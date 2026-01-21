-- Lock down user_credits table to prevent manipulation
-- All credit operations must go through spend_credits() and earn_credits() RPCs

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can delete their own credits" ON user_credits;

-- Block direct inserts (only SECURITY DEFINER functions can insert)
CREATE POLICY "No direct credit inserts"
ON user_credits FOR INSERT
WITH CHECK (false);

-- Block direct deletes (only service role/account deletion can delete)
CREATE POLICY "No direct credit deletes"
ON user_credits FOR DELETE
USING (false);