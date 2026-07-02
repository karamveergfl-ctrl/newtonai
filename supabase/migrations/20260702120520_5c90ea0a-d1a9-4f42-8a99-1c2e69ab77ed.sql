
CREATE TABLE IF NOT EXISTS public.youtube_search_cache (
  cache_key text PRIMARY KEY,
  videos jsonb NOT NULL,
  next_page_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours')
);

CREATE INDEX IF NOT EXISTS youtube_search_cache_expires_at_idx
  ON public.youtube_search_cache (expires_at);

GRANT ALL ON public.youtube_search_cache TO service_role;

ALTER TABLE public.youtube_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.youtube_search_cache
  FOR ALL USING (false) WITH CHECK (false);

-- Schedule daily cleanup of expired cache entries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('youtube_search_cache_cleanup')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'youtube_search_cache_cleanup');
    PERFORM cron.schedule(
      'youtube_search_cache_cleanup',
      '0 3 * * *',
      $cron$DELETE FROM public.youtube_search_cache WHERE expires_at < now();$cron$
    );
  END IF;
END $$;
