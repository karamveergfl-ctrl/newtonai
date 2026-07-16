## Root cause

Creating a class fails with `new row violates row-level security policy for table "classes"` because the INSERT policy on `classes` requires **both** `auth.uid() = teacher_id` **and** `has_role(auth.uid(), 'teacher')`.

The current user does not actually have the `teacher` role. Why:

- The `user_roles` INSERT policies only allow:
  - self-assign of role **`student`** (`WITH CHECK (auth.uid() = user_id AND role = 'student')`)
  - or admins inserting any role.
- `TeacherOnboarding.handleComplete` does `supabase.from("user_roles").upsert({ role: "teacher" })`. That upsert is silently blocked by RLS — no teacher row is ever written.
- Data confirms it: only 1 user in the whole project has the `teacher` role, and that user is also an admin (so their insert worked). Every other "teacher" that went through onboarding is effectively role-less, and their class creation dies at the RLS check.

Additionally, in the onboarding flow the class is created in step 3 but the role upsert only runs in step 7 (`handleComplete`) — so even if the policy allowed teacher self-assign, the order would still be wrong.

## Fix

### 1. Database migration — add a SECURITY DEFINER RPC to self-promote to teacher

New function `public.assign_teacher_role()`:

- `SECURITY DEFINER`, `search_path = public`.
- Uses `auth.uid()`; errors if unauthenticated.
- Refuses if the caller already has `admin` or `institutional_admin` role (defence in depth — don't let a privileged role be re-shaped through this path).
- `INSERT ... ON CONFLICT (user_id, role) DO NOTHING` into `user_roles` with `role = 'teacher'`.
- `GRANT EXECUTE ... TO authenticated`.

This is the same pattern already used elsewhere in the project (per the RPC-based access control memory) and keeps the strict RLS on `user_roles` intact — students still can't grant themselves teacher rights through the Data API; they must go through this vetted function.

Also backfill existing broken accounts: for every profile with `teacher_preferences IS NOT NULL` (i.e. they finished the teacher onboarding flow) that does not have a `teacher` row in `user_roles`, insert one. This unblocks users who already onboarded but silently lost their role.

### 2. `src/components/onboarding/TeacherOnboarding.tsx`

- In `handleCreateClass` (step 3), before the `classes` insert, call `supabase.rpc('assign_teacher_role')`. Ignore "already exists" style responses.
- In `handleComplete` (step 7), replace the current `.from('user_roles').upsert(...)` with the same `rpc('assign_teacher_role')` call so the role is guaranteed regardless of which step actually finishes.

### 3. `src/hooks/useClasses.ts`

- In the `createClass` path (used by the main dashboard's `CreateClassDialog`, which is the surface in the screenshot), call `supabase.rpc('assign_teacher_role')` once before the insert if the current user does not already have the teacher role. This heals older accounts on their next class-creation attempt even before they refresh onboarding.

### 4. No policy changes

We deliberately do NOT loosen the `user_roles` INSERT policy to allow self-assign of `teacher`. That would let any signed-in user grant themselves teacher powers by hitting the Data API directly. The SECURITY DEFINER RPC is the single controlled entry point.

## Verification

- Retry "Create Class" from the teacher dashboard: should succeed and return an `invite_code`.
- `SELECT role FROM user_roles WHERE user_id = <caller>` shows `teacher`.
- Student accounts remain unable to create classes (RPC still gates, and their onboarding flow never calls it).
- Existing pre-broken teacher accounts now have a `teacher` row after the backfill and can create classes without redoing onboarding.
