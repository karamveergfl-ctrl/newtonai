CREATE POLICY "Students can view their own pulse responses"
ON public.live_pulse_responses
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);