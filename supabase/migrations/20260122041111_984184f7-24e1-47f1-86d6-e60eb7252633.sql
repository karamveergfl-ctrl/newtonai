-- Trigger for subscription changes (new subscription, upgrade, cancellation)
CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- New subscription activated
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'subscription_change',
      '🎉 Welcome to ' || NEW.plan_name || '!',
      'Your ' || NEW.plan_name || ' subscription is now active. Enjoy unlimited access to premium features!',
      jsonb_build_object('plan_name', NEW.plan_name, 'billing_cycle', NEW.billing_cycle, 'action', 'activated')
    );
  -- Subscription cancelled
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'cancelled' THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'subscription_change',
      'Subscription Cancelled',
      'Your ' || NEW.plan_name || ' subscription has been cancelled. You''ll retain access until ' || to_char(NEW.current_period_end, 'Mon DD, YYYY') || '.',
      jsonb_build_object('plan_name', NEW.plan_name, 'expires_at', NEW.current_period_end, 'action', 'cancelled')
    );
  -- Plan upgrade/change
  ELSIF TG_OP = 'UPDATE' AND OLD.plan_name IS DISTINCT FROM NEW.plan_name AND NEW.status = 'active' THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'subscription_change',
      '⬆️ Plan Upgraded to ' || NEW.plan_name || '!',
      'Your subscription has been upgraded from ' || OLD.plan_name || ' to ' || NEW.plan_name || '. Enjoy your new features!',
      jsonb_build_object('old_plan', OLD.plan_name, 'new_plan', NEW.plan_name, 'action', 'upgraded')
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on subscriptions table
DROP TRIGGER IF EXISTS on_subscription_change ON public.subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_subscription_change();

-- Function to check and notify usage limits (called from app code)
CREATE OR REPLACE FUNCTION public.check_usage_limit_warning(
  p_user_id UUID,
  p_feature_name TEXT,
  p_current_usage INTEGER,
  p_max_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_usage_percent NUMERIC;
  v_already_notified BOOLEAN;
BEGIN
  -- Calculate usage percentage
  IF p_max_limit <= 0 THEN
    RETURN FALSE;
  END IF;
  
  v_usage_percent := (p_current_usage::NUMERIC / p_max_limit::NUMERIC) * 100;
  
  -- Only notify at 80% threshold
  IF v_usage_percent >= 80 AND v_usage_percent < 100 THEN
    -- Check if already notified for this feature this month
    SELECT EXISTS(
      SELECT 1 FROM user_notifications
      WHERE user_id = p_user_id
        AND type = 'usage_limit_warning'
        AND metadata->>'feature_name' = p_feature_name
        AND created_at >= date_trunc('month', now())
    ) INTO v_already_notified;
    
    IF NOT v_already_notified THEN
      INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
      VALUES (
        p_user_id,
        'usage_limit_warning',
        '⚠️ Usage Limit Warning',
        'You''ve used ' || round(v_usage_percent) || '% of your monthly ' || REPLACE(p_feature_name, '_', ' ') || ' limit. Consider upgrading for unlimited access.',
        jsonb_build_object('feature_name', p_feature_name, 'current_usage', p_current_usage, 'max_limit', p_max_limit, 'percent_used', round(v_usage_percent))
      );
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Trigger for when a user completes onboarding
CREATE OR REPLACE FUNCTION public.notify_onboarding_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.onboarding_completed = false AND NEW.onboarding_completed = true THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.id,
      'achievement',
      '🏆 Setup Complete!',
      'Great job completing your profile! You''re all set to start learning with NewtonAI.',
      jsonb_build_object('achievement', 'onboarding_complete')
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_onboarding_complete ON public.profiles;
CREATE TRIGGER on_onboarding_complete
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_onboarding_complete();

-- Trigger for first generation milestone
CREATE OR REPLACE FUNCTION public.notify_first_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_generation_count INTEGER;
BEGIN
  -- Count total generations for user
  SELECT COUNT(*) INTO v_generation_count
  FROM generation_history
  WHERE user_id = NEW.user_id;
  
  -- First generation achievement
  IF v_generation_count = 1 THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'achievement',
      '🎯 First Generation!',
      'Congratulations on your first ' || REPLACE(NEW.tool_name, '_', ' ') || '! Keep exploring our AI study tools.',
      jsonb_build_object('achievement', 'first_generation', 'tool', NEW.tool_name)
    );
  -- 10 generations milestone
  ELSIF v_generation_count = 10 THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'achievement',
      '🔥 10 Generations!',
      'You''ve created 10 study materials with NewtonAI! You''re on a roll!',
      jsonb_build_object('achievement', '10_generations', 'count', 10)
    );
  -- 50 generations milestone
  ELSIF v_generation_count = 50 THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'achievement',
      '⭐ Power User!',
      'Incredible! You''ve generated 50 study materials. You''re a true NewtonAI power user!',
      jsonb_build_object('achievement', '50_generations', 'count', 50)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_generation_created ON public.generation_history;
CREATE TRIGGER on_generation_created
  AFTER INSERT ON public.generation_history
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_first_generation();