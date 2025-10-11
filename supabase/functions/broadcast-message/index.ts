import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['system_admin', 'admin', 'moderator'].includes(profile.role)) {
      throw new Error('Недостаточно прав для выполнения этой операции');
    }

    // Get request body
    const { message, target_audience = 'all' } = await req.json();

    if (!message || !message.trim()) {
      throw new Error('Сообщение не может быть пустым');
    }

    console.log(`Broadcasting message to ${target_audience} users:`, message);

    // Get target users based on audience
    let query = supabase.from('profiles').select('id');

    if (target_audience !== 'all') {
      query = query.eq('role', target_audience);
    }

    const { data: targetUsers, error: usersError } = await query;

    if (usersError) {
      throw usersError;
    }

    if (!targetUsers || targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Нет пользователей для рассылки',
          sent_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${targetUsers.length} target users`);

    // Create or get system user conversations and send messages
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const targetUser of targetUsers) {
      try {
        // Skip sending to admin who is broadcasting
        if (targetUser.id === user.id) {
          continue;
        }

        // Check if conversation already exists between system and user
        const { data: existingConv, error: convSearchError } = await supabase
          .from('conversations')
          .select('id')
          .contains('participants', [user.id, targetUser.id])
          .eq('type', 'chat')
          .single();

        let conversationId: string;

        if (existingConv && !convSearchError) {
          // Use existing conversation
          conversationId = existingConv.id;
        } else {
          // Create new conversation
          const { data: newConv, error: convCreateError } = await supabase
            .from('conversations')
            .insert({
              participants: [user.id, targetUser.id],
              created_by: user.id,
              type: 'chat',
              title: 'Системное сообщение'
            })
            .select('id')
            .single();

          if (convCreateError || !newConv) {
            console.error(`Failed to create conversation for user ${targetUser.id}:`, convCreateError);
            errorCount++;
            errors.push({ user_id: targetUser.id, error: convCreateError?.message });
            continue;
          }

          conversationId = newConv.id;
        }

        // Send message
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: `📢 Системное сообщение:\n\n${message}`,
            message_type: 'text'
          });

        if (messageError) {
          console.error(`Failed to send message to user ${targetUser.id}:`, messageError);
          errorCount++;
          errors.push({ user_id: targetUser.id, error: messageError.message });
        } else {
          successCount++;
        }

      } catch (error) {
        console.error(`Error processing user ${targetUser.id}:`, error);
        errorCount++;
        errors.push({ user_id: targetUser.id, error: error.message });
      }
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      user_id: user.id,
      action: 'broadcast_message',
      target_type: 'users',
      target_id: null
    });

    console.log(`Broadcast complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Сообщение отправлено ${successCount} пользователям`,
        sent_count: successCount,
        error_count: errorCount,
        errors: errorCount > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Произошла ошибка при отправке сообщений'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
