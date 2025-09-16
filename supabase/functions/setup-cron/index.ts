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

    console.log('Setting up cron job for order expiration...');

    // Создаем cron job для автоматического истечения заказов каждый час
    const { error: cronError } = await supabaseClient.rpc('sql', {
      query: `
        SELECT cron.schedule(
          'expire-orders-hourly',
          '0 * * * *', -- каждый час
          $$
          SELECT net.http_post(
            url:='${Deno.env.get('SUPABASE_URL')}/functions/v1/expire-orders',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
            body:='{"scheduled": true}'::jsonb
          ) as request_id;
          $$
        );
      `
    });

    if (cronError) {
      console.error('Error setting up cron job:', cronError);
      throw cronError;
    }

    console.log('Cron job created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cron job for order expiration set up successfully',
        schedule: 'Every hour (0 * * * *)',
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
    console.error('Error in setup-cron function:', error);
    
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