import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const telegramAdminChatId = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sendTelegramMessage = async (message: string) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramAdminChatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram API error:', errorData);
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId }: { ticketId: string } = await req.json();

    console.log('Processing support ticket notification for:', ticketId);

    // Получаем информацию о тикете
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        id,
        ticket_number,
        subject,
        category,
        priority,
        urgency,
        response_time_minutes,
        created_by,
        profiles!support_tickets_created_by_fkey (
          display_name,
          full_name,
          phone
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      throw new Error('Ticket not found');
    }

    if (!ticket) {
      console.log('Ticket not found');
      return new Response(JSON.stringify({ success: false, message: 'Ticket not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Формируем сообщение для Telegram
    const userName = ticket.profiles?.display_name || 
                    ticket.profiles?.full_name || 
                    ticket.profiles?.phone || 
                    'Неизвестный пользователь';

    const priorityText = ticket.priority === 'urgent' ? '🚨 СРОЧНЫЙ' :
                        ticket.priority === 'high' ? '⚠️ Высокий' :
                        ticket.priority === 'normal' ? '📋 Обычный' : '📝 Низкий';

    const urgencyText = ticket.urgency === 'critical' ? '🔥 КРИТИЧЕСКАЯ' :
                       ticket.urgency === 'high' ? '⚡ Высокая' :
                       ticket.urgency === 'normal' ? '📌 Обычная' : '🕐 Низкая';

    const responseTime = ticket.response_time_minutes ? 
      `⏱️ <b>Время ответа:</b> ${ticket.response_time_minutes} мин` : '';

    const message = `
🎫 <b>НОВЫЙ ТИКЕТ ПОДДЕРЖКИ!</b>

📋 <b>Номер:</b> ${ticket.ticket_number}
📝 <b>Тема:</b> ${ticket.subject}
📂 <b>Категория:</b> ${ticket.category || 'Не указана'}
${priorityText}
🔥 <b>Срочность:</b> ${urgencyText}
👤 <b>Пользователь:</b> ${userName}
${responseTime}

🔗 Ответьте на тикет в админ-панели
    `.trim();

    // Отправляем уведомление в Telegram
    await sendTelegramMessage(message);

    console.log('Support ticket notification sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Support ticket notification sent to Telegram' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-support-ticket function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});