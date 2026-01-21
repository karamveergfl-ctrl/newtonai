-- Add preferred_currency column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_currency text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_currency IS 'User preferred currency code (e.g., INR, USD, EUR)';