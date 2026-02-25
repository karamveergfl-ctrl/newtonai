
-- Enable RLS on the view
ALTER VIEW public.live_pulse_summary SET (security_invoker = on);

-- Policy: Teachers of the session's class can view pulse summary
CREATE POLICY "Teachers can view pulse summary"
ON public.live_pulse_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = live_pulse_responses.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  )
);
