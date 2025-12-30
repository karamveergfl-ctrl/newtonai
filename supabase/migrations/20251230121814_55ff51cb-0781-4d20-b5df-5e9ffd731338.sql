-- Add DELETE policies to allow users to manage their own data

-- Allow users to delete their own search history
CREATE POLICY "Users can delete their own search history"
  ON public.search_history FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to delete their own study sessions
CREATE POLICY "Users can delete their own study sessions"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to delete their own video watch time
CREATE POLICY "Users can delete their own video watch time"
  ON public.video_watch_time FOR DELETE
  USING (auth.uid() = user_id);