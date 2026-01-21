-- Add DELETE policy for GDPR compliance on redeemed_codes
-- Allows users to delete their own redemption history

CREATE POLICY "Users can delete their own redeemed codes"
ON redeemed_codes FOR DELETE
USING (auth.uid() = user_id);