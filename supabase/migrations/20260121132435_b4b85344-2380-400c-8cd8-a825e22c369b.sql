-- Allow authenticated users to read feature costs
CREATE POLICY "Authenticated users can read feature costs"
ON public.feature_costs
FOR SELECT
USING (auth.uid() IS NOT NULL);