
-- 1) Exclude content_text from realtime broadcasts
ALTER PUBLICATION supabase_realtime DROP TABLE public.live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions
  (id, class_id, teacher_id, title, content_source, content_title, assignment_id,
   time_limit_minutes, status, started_at, quiz_started_at, quiz_ended_at, created_at,
   pulse_enabled, questions_enabled, confusion_threshold, notes_enabled,
   current_slide_index, total_slides, whiteboard_data, document_url);

-- 2) Column-level: revoke direct SELECT on content_text for client roles
REVOKE SELECT (content_text) ON public.live_sessions FROM authenticated;
REVOKE SELECT (content_text) ON public.live_sessions FROM anon;

-- 3) Teacher-only RPC to retrieve content_text on demand
CREATE OR REPLACE FUNCTION public.get_live_session_content(_session_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_text
  FROM public.live_sessions
  WHERE id = _session_id
    AND teacher_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_live_session_content(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_live_session_content(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_live_session_content(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_live_session_content(uuid) TO service_role;
