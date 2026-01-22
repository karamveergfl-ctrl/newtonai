-- Create generation_history table to track all tool generations
CREATE TABLE public.generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL, -- 'quiz', 'flashcards', 'mind_map', 'podcast', 'summary', 'lecture_notes', 'homework_help'
  title TEXT,
  source_type TEXT, -- 'text', 'pdf', 'youtube', 'audio', 'image'
  source_preview TEXT, -- First 200 chars of content
  result_preview JSONB, -- Store preview of results
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on generation_history
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for generation_history
CREATE POLICY "Users can view their own generation history"
  ON public.generation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generation history"
  ON public.generation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generation history"
  ON public.generation_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_notifications table for user-facing notifications
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'credit_spent', 'credit_earned', 'usage_limit_warning', 'welcome', 'subscription_change', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.user_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Add new columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system';

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to notify on credit spent (will be called by trigger)
CREATE OR REPLACE FUNCTION public.notify_credit_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'spend' AND NEW.feature_name IS NOT NULL THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'credit_spent',
      'Credits Used',
      format('Used %s credits for %s', ABS(NEW.amount), REPLACE(NEW.feature_name, '_', ' ')),
      jsonb_build_object('amount', ABS(NEW.amount), 'feature', NEW.feature_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to notify on credit earned
CREATE OR REPLACE FUNCTION public.notify_credit_earned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'earn' THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'credit_earned',
      'Credits Earned! 🎉',
      format('You earned %s credits from watching a video', NEW.amount),
      jsonb_build_object('amount', NEW.amount, 'ad_duration', NEW.ad_duration)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for credit spent notifications
CREATE TRIGGER on_credit_spent
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW
  WHEN (NEW.type = 'spend')
  EXECUTE FUNCTION public.notify_credit_spent();

-- Create trigger for credit earned notifications
CREATE TRIGGER on_credit_earned
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW
  WHEN (NEW.type = 'earn')
  EXECUTE FUNCTION public.notify_credit_earned();

-- Create function to send welcome notification on profile creation
CREATE OR REPLACE FUNCTION public.notify_welcome_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.id,
    'welcome',
    'Welcome to NewtonAI! 🎓',
    'Start by uploading a PDF, entering a YouTube link, or pasting your study notes to generate quizzes, flashcards, and more!',
    jsonb_build_object('full_name', NEW.full_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for welcome notification
CREATE TRIGGER on_user_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_welcome_user();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON public.generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON public.generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_tool_name ON public.generation_history(tool_name);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);