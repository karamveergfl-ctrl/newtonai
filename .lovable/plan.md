

# Institutional Hierarchy Upgrade for NewtonAI

## Overview
Extend NewtonAI from a standalone classroom tool into a multi-tenant institutional platform by adding three new database layers (Institution, Department, Course), expanding the RBAC system with institutional roles, and adding role-based dashboard routing -- all without modifying existing features.

---

## Phase 1: Database Schema Changes (Single Migration)

### 1.1 Extend the `app_role` Enum
Add four new values to the existing enum:
- `principal`
- `dean`
- `exam_admin`
- `department_head`

### 1.2 Create `institutions` Table
```text
institutions
  id              uuid PK (gen_random_uuid)
  name            text NOT NULL
  type            text NOT NULL DEFAULT 'school'
                  -- values: school, college, university, coaching
  admin_user_id   uuid NOT NULL
  logo_url        text
  timezone        text DEFAULT 'Asia/Kolkata'
  created_at      timestamptz DEFAULT now()
```
- RLS enabled
- SELECT: members of the institution can view (via helper function)
- ALL for admin_user_id owner
- Admins (platform-level) can view all

### 1.3 Create `departments` Table
```text
departments
  id              uuid PK
  institution_id  uuid NOT NULL FK -> institutions(id) ON DELETE CASCADE
  name            text NOT NULL
  head_user_id    uuid
  created_at      timestamptz DEFAULT now()
```
- RLS: institution admin or department head can manage; institution members can SELECT

### 1.4 Create `courses` Table
```text
courses
  id              uuid PK
  department_id   uuid NOT NULL FK -> departments(id) ON DELETE CASCADE
  teacher_id      uuid NOT NULL
  course_name     text NOT NULL
  course_code     text
  semester        text
  academic_year   text
  created_at      timestamptz DEFAULT now()
```
- RLS: department head / institution admin can manage; assigned teacher can view/update; enrolled students can SELECT

### 1.5 Extend `classes` Table
Add a nullable `course_id` column:
```sql
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;
```
This is nullable so all existing classes continue working without any course linkage.

### 1.6 Create `institution_members` Table
Maps users to institutions with their institutional role:
```text
institution_members
  id              uuid PK
  institution_id  uuid FK -> institutions(id) ON DELETE CASCADE
  user_id         uuid NOT NULL
  role            text NOT NULL DEFAULT 'member'
                  -- institutional context role label
  joined_at       timestamptz DEFAULT now()
  UNIQUE(institution_id, user_id)
```
- RLS: institution admin can manage; members can view own institution's members

### 1.7 Security Definer Helper Functions
Create helper functions to avoid RLS recursion:

- `is_institution_admin(inst_id uuid, uid uuid)` -- checks if user is admin of institution
- `is_institution_member(inst_id uuid, uid uuid)` -- checks if user belongs to institution
- `get_user_institution_id(uid uuid)` -- returns institution_id for a user (first match)

---

## Phase 2: RLS Policies

All new tables get RLS enabled with restrictive policies:

**institutions:**
- SELECT: `is_institution_member(id, auth.uid())` OR platform admin
- INSERT/UPDATE/DELETE: `admin_user_id = auth.uid()` OR platform admin

**departments:**
- SELECT: `is_institution_member(institution_id, auth.uid())`
- INSERT/UPDATE/DELETE: `is_institution_admin(institution_id, auth.uid())` OR `head_user_id = auth.uid()`

**courses:**
- SELECT: `is_institution_member(...)` (via department -> institution join)
- INSERT/UPDATE/DELETE: institution admin or department head
- UPDATE also allowed for assigned `teacher_id`

**institution_members:**
- SELECT: members of same institution
- INSERT/DELETE: institution admin only
- No direct UPDATE (delete + re-insert)

---

## Phase 3: Frontend -- Role Hook Extension

### 3.1 Update `useUserRole.ts`
- Extend the `UserRole` type to include the 4 new roles: `"principal" | "dean" | "exam_admin" | "department_head"`
- Add computed booleans: `isPrincipal`, `isDean`, `isExamAdmin`, `isDepartmentHead`
- Add `isInstitutionalAdmin` computed property (true if any of: principal, dean, exam_admin, department_head)
- Update the primary role priority: `admin > principal > dean > department_head > exam_admin > teacher > student > user`

### 3.2 Create `useInstitution.ts` Hook
New hook to fetch the current user's institution context:
- Queries `institution_members` joined with `institutions` for `auth.uid()`
- Returns `{ institution, department, loading }`
- Caches via React Query

---

## Phase 4: Frontend -- Routing & Navigation

### 4.1 Create `InstitutionRoute.tsx`
A new route guard component (similar to `RoleRoute`) that checks for institutional admin roles (principal/dean/department_head/exam_admin). Redirects unauthorized users to `/dashboard`.

### 4.2 Create Institutional Dashboard Page
- New lazy-loaded page: `src/pages/institution/InstitutionDashboard.tsx`
- Shows institution overview: departments, courses, member count
- Placeholder cards for future management features
- Links to department and course management

### 4.3 Create Department & Course Management Pages
- `src/pages/institution/DepartmentsPage.tsx` -- list/create/edit departments
- `src/pages/institution/CoursesPage.tsx` -- list/create/edit courses, link classes

### 4.4 Add Routes to `App.tsx`
```text
/institution              -> InstitutionDashboard (InstitutionRoute)
/institution/departments  -> DepartmentsPage (InstitutionRoute)
/institution/courses      -> CoursesPage (InstitutionRoute)
```

### 4.5 Update `AppSidebar.tsx`
- Add a new "Institution" sidebar group (visible when `isInstitutionalAdmin` is true)
- Menu items: Dashboard, Departments, Courses
- Uses `Building2`, `Layers`, `BookOpen` icons from lucide

### 4.6 Smart Dashboard Redirect
Update the `/dashboard` route logic so that after login:
- If user has institutional role (principal/dean/etc.) -> show institution section on dashboard or auto-navigate to `/institution`
- Teacher -> existing teacher dashboard
- Student -> existing student dashboard
- This is a soft redirect suggestion (banner/card), not a forced redirect, to preserve existing behavior

---

## Phase 5: RoleRoute Extension

Update `RoleRoute.tsx` to accept the new roles:
```typescript
type RoleRouteRole = "teacher" | "student" | "principal" | "dean" | "exam_admin" | "department_head";
```

---

## Files to Create
1. `supabase/migrations/[timestamp]_institutional_hierarchy.sql` -- all schema changes
2. `src/hooks/useInstitution.ts` -- institution context hook
3. `src/components/InstitutionRoute.tsx` -- route guard
4. `src/pages/institution/InstitutionDashboard.tsx` -- main institutional dashboard
5. `src/pages/institution/DepartmentsPage.tsx` -- department management
6. `src/pages/institution/CoursesPage.tsx` -- course management

## Files to Modify
1. `src/hooks/useUserRole.ts` -- extend role types and booleans
2. `src/components/RoleRoute.tsx` -- accept new roles
3. `src/components/AppSidebar.tsx` -- add institution nav group
4. `src/App.tsx` -- add institution routes

## Zero Breaking Changes
- `classes.course_id` is nullable -- all existing classes unaffected
- New enum values are additive -- existing role checks unchanged
- All new tables are independent -- no existing table structures modified
- Existing RLS policies untouched

