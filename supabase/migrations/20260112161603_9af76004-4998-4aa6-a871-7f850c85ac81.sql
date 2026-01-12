-- Add DELETE policy for rate_limits table
CREATE POLICY "Users can delete their own rate limits"
ON public.rate_limits
FOR DELETE
USING (auth.uid() = user_id);