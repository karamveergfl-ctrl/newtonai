-- Add DELETE policy for GDPR compliance on user_credits table
CREATE POLICY "Users can delete their own credits"
ON public.user_credits
FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for GDPR compliance on feature_usage table
CREATE POLICY "Users can delete their own usage"
ON public.feature_usage
FOR DELETE
USING (auth.uid() = user_id);