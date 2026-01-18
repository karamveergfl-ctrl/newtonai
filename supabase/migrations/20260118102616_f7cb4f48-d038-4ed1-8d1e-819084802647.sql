-- Add restrictive UPDATE policy for credit_transactions table
-- This prevents users from modifying their transaction records to maintain audit trail integrity
CREATE POLICY "Users cannot update their own transactions"
ON public.credit_transactions
FOR UPDATE
USING (false);