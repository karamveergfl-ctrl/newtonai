-- Remove the overly permissive policy that allows any role self-assignment
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Replace with a restricted policy that only allows non-privileged roles
CREATE POLICY "Users can self-assign student or teacher role"
ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('student'::app_role, 'teacher'::app_role)
);