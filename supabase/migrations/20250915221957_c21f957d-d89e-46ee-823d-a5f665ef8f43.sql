-- Helper functions and triggers for chat system

-- Function to generate support ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text AS $$
DECLARE
  ticket_number text;
BEGIN
  ticket_number := 'SUP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) % 10000)::text, 4, '0');
  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update conversation when new message is added
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to create notifications for new messages
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  participant uuid;
  conversation_rec public.conversations%ROWTYPE;
BEGIN
  -- Get conversation details
  SELECT * INTO conversation_rec 
  FROM public.conversations 
  WHERE id = NEW.conversation_id;
  
  -- Create notification for each participant except sender
  FOREACH participant IN ARRAY conversation_rec.participants
  LOOP
    IF participant != NEW.sender_id THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        content,
        conversation_id,
        message_id
      ) VALUES (
        participant,
        'message',
        CASE 
          WHEN conversation_rec.type = 'support' THEN 'Новое сообщение в тикете'
          ELSE 'Новое сообщение'
        END,
        CASE 
          WHEN NEW.message_type = 'text' THEN LEFT(NEW.content, 100)
          WHEN NEW.message_type = 'file' THEN 'Файл: ' || NEW.file_name
          ELSE 'Новое сообщение'
        END,
        NEW.conversation_id,
        NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create notifications for new messages
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();

-- Function to automatically assign ticket number
CREATE OR REPLACE FUNCTION public.auto_assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-assign ticket numbers
CREATE TRIGGER auto_assign_ticket_number_trigger
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_ticket_number();

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;