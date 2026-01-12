-- Add UPDATE policy to search_history table for CRUD consistency
CREATE POLICY "Users can update their own search history"
ON public.search_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);