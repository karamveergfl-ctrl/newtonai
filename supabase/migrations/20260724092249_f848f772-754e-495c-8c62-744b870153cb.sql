
DROP POLICY IF EXISTS "Authenticated users can submit valid inquiries" ON public.enterprise_inquiries;
DROP POLICY IF EXISTS "Authenticated users submit their own inquiries" ON public.enterprise_inquiries;

CREATE POLICY "Authenticated users submit their own valid inquiries"
ON public.enterprise_inquiries
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND first_name IS NOT NULL AND length(first_name) > 0
  AND last_name IS NOT NULL AND length(last_name) > 0
  AND email IS NOT NULL AND length(email) > 0
  AND company IS NOT NULL AND length(company) > 0
  AND job_title IS NOT NULL AND length(job_title) > 0
  AND team_size IS NOT NULL AND length(team_size) > 0
  AND use_case IS NOT NULL AND length(use_case) > 0
);
