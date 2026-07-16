REVOKE ALL ON FUNCTION public.assign_teacher_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_teacher_role() FROM anon;
REVOKE ALL ON FUNCTION public.assign_teacher_role() FROM service_role;
GRANT EXECUTE ON FUNCTION public.assign_teacher_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_teacher_role() TO service_role;

REVOKE ALL ON public.classes FROM anon;
REVOKE ALL ON public.classes FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;

REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM PUBLIC;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;