import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Находим диалоги, которые помечены как permanently_deleted более 7 дней назад
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('Searching for conversations to delete permanently, older than:', sevenDaysAgo.toISOString());

    // Получаем диалоги для удаления
    const { data: conversationsToDelete, error: fetchError } = await supabase
      .from('conversations')
      .select('id, permanently_deleted_at')
      .eq('permanently_deleted', true)
      .lt('permanently_deleted_at', sevenDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching conversations:', fetchError);
      throw fetchError;
    }

    if (!conversationsToDelete || conversationsToDelete.length === 0) {
      console.log('No conversations to delete');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No conversations to delete',
          deleted: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${conversationsToDelete.length} conversations to delete`);

    const conversationIds = conversationsToDelete.map(c => c.id);

    // Удаляем сообщения из этих диалогов
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw messagesError;
    }

    console.log('Messages deleted successfully');

    // Удаляем реакции на сообщения (если есть)
    const { error: reactionsError } = await supabase
      .from('message_reactions')
      .delete()
      .in('message_id', await getMessageIds(supabase, conversationIds));

    if (reactionsError) {
      console.warn('Error deleting message reactions:', reactionsError);
      // Не прерываем выполнение, если нет реакций
    }

    // Удаляем уведомления связанные с этими диалогами
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .in('conversation_id', conversationIds);

    if (notificationsError) {
      console.warn('Error deleting notifications:', notificationsError);
      // Не прерываем выполнение
    }

    // Удаляем тикеты поддержки связанные с диалогами
    const { error: ticketsError } = await supabase
      .from('support_tickets')
      .delete()
      .in('conversation_id', conversationIds);

    if (ticketsError) {
      console.warn('Error deleting support tickets:', ticketsError);
      // Не прерываем выполнение
    }

    // Удаляем сами диалоги
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversationIds);

    if (deleteError) {
      console.error('Error deleting conversations:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${conversationsToDelete.length} conversations and related data`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${conversationsToDelete.length} conversations`,
        deleted: conversationsToDelete.length,
        conversationIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Вспомогательная функция для получения ID сообщений
async function getMessageIds(supabase: any, conversationIds: string[]): Promise<string[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id')
    .in('conversation_id', conversationIds);

  if (error || !data) return [];
  return data.map((m: any) => m.id);
}
