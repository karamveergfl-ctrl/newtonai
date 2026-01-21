-- Fix remaining error-level security issues

-- 1. SUBSCRIPTIONS: Block user INSERT and UPDATE (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "No subscription updates" ON subscriptions;

CREATE POLICY "No user inserts to subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (false);

CREATE POLICY "No user updates to subscriptions"
ON subscriptions FOR UPDATE
USING (false);

-- 2. ENTERPRISE INQUIRIES: Already secure, but add explicit comment
-- SELECT: Admin only (has_role check) ✅
-- INSERT: Authenticated with validation ✅
-- UPDATE: Admin only ✅
-- DELETE: Admin only ✅
-- No changes needed - the finding is about the business sensitivity of the data,
-- not a policy misconfiguration. The RLS is correct.