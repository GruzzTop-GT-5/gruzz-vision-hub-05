import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting order expiration check...');

    // Вызываем функцию для пометки истекших заказов
    const { error: expireError } = await supabaseClient.rpc('mark_expired_orders');
    
    if (expireError) {
      console.error('Error marking expired orders:', expireError);
      throw expireError;
    }

    console.log('Successfully marked expired orders');

    // Получаем статистику
    const { data: stats, error: statsError } = await supabaseClient
      .from('orders')
      .select('status, is_expired')
      .neq('status', 'completed');

    if (statsError) {
      console.error('Error getting stats:', statsError);
    } else {
      const total = stats?.length || 0;
      const expired = stats?.filter(order => order.is_expired).length || 0;
      const active = total - expired;
      
      console.log(`Order statistics: ${total} total, ${active} active, ${expired} expired`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order expiration check completed',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in expire-orders function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )
  }
})