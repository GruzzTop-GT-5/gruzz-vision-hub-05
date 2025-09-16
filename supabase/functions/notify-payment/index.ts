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
    const { transactionId }: { transactionId: string } = await req.json();

    console.log('Processing payment notification for:', transactionId);

    // Получаем информацию о транзакции
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        payment_method,
        user_id,
        profiles!transactions_user_id_fkey (
          display_name,
          full_name,
          phone
        )
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError) {
      console.error('Error fetching transaction:', transactionError);
      throw new Error('Transaction not found');
    }

    if (!transaction) {
      console.log('Transaction not found');
      return new Response(JSON.stringify({ success: false, message: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Формируем сообщение для Telegram
    const userName = transaction.profiles?.display_name || 
                    transaction.profiles?.full_name || 
                    transaction.profiles?.phone || 
                    'Неизвестный пользователь';

    const typeText = transaction.type === 'deposit' ? 'Пополнение' : 
                    transaction.type === 'withdrawal' ? 'Вывод' : 'Платеж';

    const methodText = transaction.payment_method === 'bank_card' ? 'Банковская карта' :
                      transaction.payment_method === 'yoomoney' ? 'ЮMoney' :
                      transaction.payment_method === 'ozon' ? 'Ozon' : 'Другой способ';

    const message = `
💰 <b>НОВЫЙ ПЛАТЕЖ!</b>

📋 <b>Тип:</b> ${typeText}
💳 <b>Способ:</b> ${methodText}
💵 <b>Сумма:</b> ${transaction.amount} GT Coins
👤 <b>Пользователь:</b> ${userName}

🔗 Проверьте платеж в админ-панели
    `.trim();

    // Отправляем уведомление в Telegram
    await sendTelegramMessage(message);

    console.log('Payment notification sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment notification sent to Telegram' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-payment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});