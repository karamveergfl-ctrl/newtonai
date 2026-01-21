-- Remove the policy that exposes all active codes
DROP POLICY IF EXISTS "Users can view active codes" ON public.redeem_codes;

-- No new SELECT policy needed - the validate_redeem_code function 
-- uses SECURITY DEFINER to validate codes server-side without exposing them