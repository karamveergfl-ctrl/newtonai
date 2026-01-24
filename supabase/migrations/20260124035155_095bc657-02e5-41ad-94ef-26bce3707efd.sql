-- Drop the existing flawed SELECT policy
DROP POLICY IF EXISTS "Only admins can view inquiries" ON public.enterprise_inquiries;

-- Create a new policy that properly checks admin role only
CREATE POLICY "Only admins can view inquiries"
ON public.enterprise_inquiries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));