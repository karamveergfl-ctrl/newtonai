## Goal
Make class creation work reliably from the teacher dashboard, including for existing teacher accounts that were missing the backend `teacher` role.

## Diagnosis
The live database still rejects the `classes` insert because the insert policy requires the user to have the `teacher` role. The helper function meant to assign that role currently references a non-existent enum value (`institutional_admin`), so it can fail before inserting the role. Table grants for the checked tables also appear absent from the Data API grant list, which can break role checks/client reads even when RLS is correct.

## Plan
1. **Fix the teacher role assignment function**
   - Replace `assign_teacher_role()` with a safe `SECURITY DEFINER` function that only uses valid role enum values.
   - Keep it authenticated-only.
   - Preserve security by not loosening the `user_roles` table policy to let users directly self-assign teacher rows.

2. **Backfill affected teacher accounts**
   - Add missing `teacher` role rows for existing users who already completed teacher onboarding or already own classes.
   - Use conflict-safe inserts so existing roles are not duplicated.

3. **Repair Data API grants for involved tables**
   - Grant authenticated access to `classes`, `user_roles`, and `profiles` only as allowed by their RLS policies.
   - Grant service-role access for backend/admin operations.
   - Do not add anonymous access to auth-only tables.

4. **Harden frontend class creation**
   - In `useClasses.createClass`, call `assign_teacher_role()` before inserting the class and stop immediately with a clear toast if that RPC fails.
   - Re-check the role after the RPC so the user gets a useful error instead of a generic row-level security failure.
   - Keep the actual `classes` insert scoped to `teacher_id: user.id`.

5. **Verify after implementation**
   - Confirm database policies/functions/grants are correct.
   - Confirm the class creation path no longer shows the row-level security violation and produces a class/invite code.

## Technical details
- Database migration will update only functions/grants/backfill data needed for class creation.
- No RLS policy will be loosened for direct teacher self-assignment.
- Frontend changes will be limited to the class creation flow/error handling.