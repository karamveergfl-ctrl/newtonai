-- Fix remaining warn-level security issues

-- 1. Payments table: Make payment records immutable (remove UPDATE/DELETE)
DROP POLICY IF EXISTS "Users can update their own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON payments;

CREATE POLICY "No payment updates"
ON payments FOR UPDATE
USING (false);

CREATE POLICY "No payment deletes"
ON payments FOR DELETE
USING (false);

-- 2. Subscriptions table: Remove UPDATE policy to prevent manipulation
-- (DELETE is already blocked with USING (false))
DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;

CREATE POLICY "No subscription updates"
ON subscriptions FOR UPDATE
USING (false);