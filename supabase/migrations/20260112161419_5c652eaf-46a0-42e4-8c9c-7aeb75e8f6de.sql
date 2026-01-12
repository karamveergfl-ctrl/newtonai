-- Add DELETE policy for GDPR compliance on credit_transactions table
CREATE POLICY "Users can delete their own transactions"
ON public.credit_transactions
FOR DELETE
USING (auth.uid() = user_id);