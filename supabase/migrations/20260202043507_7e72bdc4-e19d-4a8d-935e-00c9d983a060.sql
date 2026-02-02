-- Fix profiles SELECT policy to be strictly owner-only
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create simplified owner-only SELECT policy
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);