
-- Add whiteboard_data column to live_sessions
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS whiteboard_data jsonb DEFAULT '[]'::jsonb;

-- Create lecture_captures table
CREATE TABLE public.lecture_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  slide_timeline jsonb DEFAULT '[]'::jsonb,
  whiteboard_paths text[] DEFAULT '{}',
  transcript_segments jsonb DEFAULT '[]'::jsonb,
  audio_duration_seconds integer DEFAULT 0,
  status text DEFAULT 'recording',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.lecture_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers own lecture captures"
  ON public.lecture_captures FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Create whiteboard-notes storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('whiteboard-notes', 'whiteboard-notes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for whiteboard-notes bucket
CREATE POLICY "Teachers can upload whiteboard notes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'whiteboard-notes'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Teachers can view own whiteboard notes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'whiteboard-notes'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Teachers can delete own whiteboard notes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'whiteboard-notes'
    AND auth.uid() IS NOT NULL
  );

-- Enable realtime for lecture_captures
ALTER PUBLICATION supabase_realtime ADD TABLE public.lecture_captures;
