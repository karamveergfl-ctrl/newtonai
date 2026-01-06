-- Create table to track feature usage per user
CREATE TABLE public.feature_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_minutes INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_name, period_start)
);

-- Enable RLS
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own usage"
ON public.feature_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.feature_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.feature_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Add subscription tier to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- Create trigger for updated_at on feature_usage
CREATE TRIGGER update_feature_usage_updated_at
BEFORE UPDATE ON public.feature_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();