-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Only admins can view inquiries" ON public.enterprise_inquiries;

-- Create a new policy that requires authentication AND admin role
CREATE POLICY "Only admins can view inquiries" 
ON public.enterprise_inquiries 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));