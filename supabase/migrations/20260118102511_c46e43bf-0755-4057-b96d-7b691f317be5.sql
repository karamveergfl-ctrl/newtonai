-- Add DELETE policy for payments table to allow users to delete their own payment records
CREATE POLICY "Users can delete their own payments"
ON public.payments
FOR DELETE
USING (auth.uid() = user_id);