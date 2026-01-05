-- Add referral_source column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_source text;