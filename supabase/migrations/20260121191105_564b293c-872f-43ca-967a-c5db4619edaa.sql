-- Lock down rate_limits table to prevent bypass
-- All rate limit operations should go through check_rate_limit() RPC

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can update their own rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Users can delete their own rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Users can insert their own rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Users can view their own rate limits" ON rate_limits;

-- Block all direct access - only SECURITY DEFINER functions can manage
CREATE POLICY "No direct rate limit access"
ON rate_limits FOR ALL
USING (false);