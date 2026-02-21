-- Fix infinite recursion in classes RLS policies
-- The student SELECT policy on classes references class_enrollments,
-- which has policies referencing classes, causing infinite recursion.

-- Create a security definer function to check enrollment without RLS
CREATE OR REPLACE FUNCTION public.is_enrolled_in_class(p_class_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = p_class_id
      AND student_id = p_student_id
      AND status = 'active'
  )
$$;

-- Drop the problematic student SELECT policy
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;

-- Recreate it using the security definer function
CREATE POLICY "Students can view enrolled classes"
ON public.classes
FOR SELECT
USING (public.is_enrolled_in_class(id, auth.uid()));