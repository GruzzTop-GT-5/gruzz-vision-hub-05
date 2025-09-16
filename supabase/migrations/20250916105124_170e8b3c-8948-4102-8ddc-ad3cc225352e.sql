-- Создаем триггер для автоматического обновления баланса
CREATE TRIGGER update_balance_on_transaction_complete
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_balance();