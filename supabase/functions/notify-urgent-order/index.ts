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

interface UrgentOrderNotification {
  orderId: string;
  orderNumber: string;
  title: string;
  price: number;
  clientName: string;
}

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: { orderId: string } = await req.json();

    console.log('Processing urgent order notification for:', orderId);

    // Получаем информацию о заказе
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        title,
        price,
        priority,
        client_id,
        profiles!orders_client_id_fkey (
          display_name,
          full_name,
          phone
        )
      `)
      .eq('id', orderId)
      .eq('priority', 'urgent')
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      throw new Error('Order not found');
    }

    if (!order) {
      console.log('Order not found or not urgent');
      return new Response(JSON.stringify({ success: false, message: 'Order not found or not urgent' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Формируем сообщение для Telegram
    const clientName = order.profiles?.display_name || 
                      order.profiles?.full_name || 
                      order.profiles?.phone || 
                      'Неизвестный клиент';

    const message = `
🚨 <b>СРОЧНЫЙ ЗАКАЗ!</b> 🚨

📋 <b>Номер заказа:</b> ${order.order_number}
📝 <b>Название:</b> ${order.title}
💰 <b>Цена:</b> ${order.price} GT Coins
👤 <b>Клиент:</b> ${clientName}

⚡ <b>Приоритет:</b> СРОЧНЫЙ

🔗 Перейдите в приложение для проверки заказа
    `.trim();

    // Отправляем уведомление в Telegram группу
    await sendTelegramMessage(message);

    console.log('Urgent order notification sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Urgent order notification sent to Telegram group' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-urgent-order function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});