CREATE TABLE public.tts_audio_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash text NOT NULL UNIQUE,
  text_hash text NOT NULL,
  voice text NOT NULL,
  speed numeric NOT NULL DEFAULT 1,
  model text NOT NULL,
  storage_path text NOT NULL,
  duration numeric,
  provider text NOT NULL DEFAULT 'openrouter',
  status text NOT NULL DEFAULT 'ready',
  char_count integer NOT NULL DEFAULT 0,
  hit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tts_audio_cache_text_hash ON public.tts_audio_cache(text_hash);

GRANT ALL ON public.tts_audio_cache TO service_role;
ALTER TABLE public.tts_audio_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to tts_audio_cache"
  ON public.tts_audio_cache AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE public.tts_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  provider text NOT NULL,
  model text,
  voice text,
  characters integer NOT NULL DEFAULT 0,
  requests integer NOT NULL DEFAULT 1,
  cache_hit boolean NOT NULL DEFAULT false,
  estimated_cost_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tts_usage_events_user ON public.tts_usage_events(user_id, created_at DESC);

GRANT SELECT ON public.tts_usage_events TO authenticated;
GRANT ALL ON public.tts_usage_events TO service_role;
ALTER TABLE public.tts_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own TTS usage"
  ON public.tts_usage_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "No client writes to tts_usage_events"
  ON public.tts_usage_events AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (auth.uid() = user_id AND false) WITH CHECK (false);

CREATE TRIGGER update_tts_audio_cache_updated_at
  BEFORE UPDATE ON public.tts_audio_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();