-- Drop the old restrictive check constraint
ALTER TABLE public.credit_transactions DROP CONSTRAINT credit_transactions_type_check;

-- Add new check constraint that includes all valid types
ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_type_check 
CHECK (type = ANY (ARRAY['earn'::text, 'spend'::text, 'ad_reward'::text, 'feature_use'::text, 'bonus'::text, 'refund'::text, 'signup_bonus'::text]));