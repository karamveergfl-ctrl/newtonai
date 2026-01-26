-- Drop the current permissive policy
DROP POLICY IF EXISTS "Authenticated users can read feature costs" ON public.feature_costs;

-- Create admin-only read policy
CREATE POLICY "Only admins can read feature costs"
ON public.feature_costs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));