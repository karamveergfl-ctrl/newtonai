-- Drop existing SELECT policy and recreate with proper admin-only restriction
DROP POLICY IF EXISTS "Admins can view inquiries" ON public.enterprise_inquiries;

-- Create a proper admin-only SELECT policy
CREATE POLICY "Only admins can view inquiries"
ON public.enterprise_inquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure no public/anon access to SELECT
DROP POLICY IF EXISTS "Anyone can view inquiries" ON public.enterprise_inquiries;