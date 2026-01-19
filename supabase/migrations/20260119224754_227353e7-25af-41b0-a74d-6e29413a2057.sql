-- Create podcasts table for history
CREATE TABLE public.podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  source_content TEXT,
  script JSONB NOT NULL,
  audio_segments JSONB,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own podcasts"
  ON public.podcasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own podcasts"
  ON public.podcasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own podcasts"
  ON public.podcasts FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_podcasts_user_id ON public.podcasts(user_id);
CREATE INDEX idx_podcasts_created_at ON public.podcasts(created_at DESC);