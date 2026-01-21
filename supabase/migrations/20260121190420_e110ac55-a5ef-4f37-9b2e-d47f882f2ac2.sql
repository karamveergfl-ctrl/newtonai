-- Fix all security issues found in the scan

-- 1. Add UPDATE policy for podcasts table (users can only update their own)
CREATE POLICY "Users can update their own podcasts"
ON podcasts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Block UPDATE on redeemed_codes (prevent fraud)
CREATE POLICY "No updates to redeemed codes"
ON redeemed_codes FOR UPDATE
USING (false);

-- 3. Block all modifications to feature_costs (pricing integrity)
CREATE POLICY "No inserts to feature costs"
ON feature_costs FOR INSERT
WITH CHECK (false);

CREATE POLICY "No updates to feature costs"
ON feature_costs FOR UPDATE
USING (false);

CREATE POLICY "No deletes from feature costs"
ON feature_costs FOR DELETE
USING (false);

-- 4. Add UPDATE policy for user_roles (admin only)
CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));