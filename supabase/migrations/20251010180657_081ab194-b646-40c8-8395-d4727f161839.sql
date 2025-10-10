-- Drop existing trigger
DROP TRIGGER IF EXISTS update_balance_on_transaction_complete ON public.transactions;

-- Recreate trigger to work on both INSERT and UPDATE
CREATE TRIGGER update_balance_on_transaction_complete
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_balance();