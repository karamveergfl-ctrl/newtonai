
-- Phase 1.1: Extend app_role enum with institutional roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dean';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'exam_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_head';

-- Phase 1.2: Create institutions table
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'school',
  admin_user_id uuid NOT NULL,
  logo_url text,
  timezone text DEFAULT 'Asia/Kolkata',
  created_at timestamptz DEFAULT now()
);

-- Phase 1.6: Create institution_members table (before helper functions need it)
CREATE TABLE public.institution_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(institution_id, user_id)
);

-- Phase 1.3: Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  head_user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Phase 1.4: Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  course_name text NOT NULL,
  course_code text,
  semester text,
  academic_year text,
  created_at timestamptz DEFAULT now()
);

-- Phase 1.5: Extend classes table with nullable course_id
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

-- Phase 1.7: Security definer helper functions

CREATE OR REPLACE FUNCTION public.is_institution_admin(inst_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institutions
    WHERE id = inst_id AND admin_user_id = uid
  )
  OR EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE institution_id = inst_id AND user_id = uid AND role IN ('admin', 'principal')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_institution_member(inst_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE institution_id = inst_id AND user_id = uid
  )
  OR EXISTS (
    SELECT 1 FROM public.institutions
    WHERE id = inst_id AND admin_user_id = uid
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_institution_id(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.institution_members
  WHERE user_id = uid
  LIMIT 1;
$$;

-- Phase 2: Enable RLS on all new tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- institutions policies
CREATE POLICY "Members can view their institution"
ON public.institutions FOR SELECT TO authenticated
USING (is_institution_member(id, auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Institution admin can insert"
ON public.institutions FOR INSERT TO authenticated
WITH CHECK (admin_user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Institution admin can update"
ON public.institutions FOR UPDATE TO authenticated
USING (admin_user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Institution admin can delete"
ON public.institutions FOR DELETE TO authenticated
USING (admin_user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- institution_members policies
CREATE POLICY "Members can view own institution members"
ON public.institution_members FOR SELECT TO authenticated
USING (is_institution_member(institution_id, auth.uid()));

CREATE POLICY "Institution admin can insert members"
ON public.institution_members FOR INSERT TO authenticated
WITH CHECK (is_institution_admin(institution_id, auth.uid()));

CREATE POLICY "Institution admin can delete members"
ON public.institution_members FOR DELETE TO authenticated
USING (is_institution_admin(institution_id, auth.uid()));

CREATE POLICY "No direct member updates"
ON public.institution_members FOR UPDATE TO authenticated
USING (false);

-- departments policies
CREATE POLICY "Institution members can view departments"
ON public.departments FOR SELECT TO authenticated
USING (is_institution_member(institution_id, auth.uid()));

CREATE POLICY "Admin or head can insert departments"
ON public.departments FOR INSERT TO authenticated
WITH CHECK (is_institution_admin(institution_id, auth.uid()));

CREATE POLICY "Admin or head can update departments"
ON public.departments FOR UPDATE TO authenticated
USING (is_institution_admin(institution_id, auth.uid()) OR head_user_id = auth.uid());

CREATE POLICY "Admin can delete departments"
ON public.departments FOR DELETE TO authenticated
USING (is_institution_admin(institution_id, auth.uid()));

-- courses policies
CREATE POLICY "Institution members can view courses"
ON public.courses FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.departments d
  WHERE d.id = courses.department_id
  AND is_institution_member(d.institution_id, auth.uid())
));

CREATE POLICY "Admin or dept head can insert courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.departments d
  WHERE d.id = courses.department_id
  AND (is_institution_admin(d.institution_id, auth.uid()) OR d.head_user_id = auth.uid())
));

CREATE POLICY "Admin or dept head or teacher can update courses"
ON public.courses FOR UPDATE TO authenticated
USING (
  teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.departments d
    WHERE d.id = courses.department_id
    AND (is_institution_admin(d.institution_id, auth.uid()) OR d.head_user_id = auth.uid())
  )
);

CREATE POLICY "Admin or dept head can delete courses"
ON public.courses FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.departments d
  WHERE d.id = courses.department_id
  AND (is_institution_admin(d.institution_id, auth.uid()) OR d.head_user_id = auth.uid())
));

-- Indexes for performance
CREATE INDEX idx_institution_members_user ON public.institution_members(user_id);
CREATE INDEX idx_institution_members_inst ON public.institution_members(institution_id);
CREATE INDEX idx_departments_institution ON public.departments(institution_id);
CREATE INDEX idx_courses_department ON public.courses(department_id);
CREATE INDEX idx_courses_teacher ON public.courses(teacher_id);
CREATE INDEX idx_classes_course ON public.classes(course_id);
