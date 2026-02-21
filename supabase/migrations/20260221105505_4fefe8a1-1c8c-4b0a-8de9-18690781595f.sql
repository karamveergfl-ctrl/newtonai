-- Fix class_enrollments policies that reference classes (could cause recursion)
-- Create a security definer function to check class ownership
CREATE OR REPLACE FUNCTION public.is_class_teacher(p_class_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id
      AND teacher_id = p_teacher_id
  )
$$;

-- Fix class_enrollments policies
DROP POLICY IF EXISTS "Teachers can view enrollments" ON public.class_enrollments;
CREATE POLICY "Teachers can view enrollments"
ON public.class_enrollments
FOR SELECT
USING (public.is_class_teacher(class_id, auth.uid()));

DROP POLICY IF EXISTS "Teachers can update enrollments" ON public.class_enrollments;
CREATE POLICY "Teachers can update enrollments"
ON public.class_enrollments
FOR UPDATE
USING (public.is_class_teacher(class_id, auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete enrollments" ON public.class_enrollments;
CREATE POLICY "Teachers can delete enrollments"
ON public.class_enrollments
FOR DELETE
USING (public.is_class_teacher(class_id, auth.uid()));