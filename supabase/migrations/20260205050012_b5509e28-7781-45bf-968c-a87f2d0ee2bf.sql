-- Fix: Ensure profiles table requires authentication for SELECT
-- Drop the existing SELECT policy and replace with one that requires auth.uid() IS NOT NULL

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that requires authentication AND restricts to own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);