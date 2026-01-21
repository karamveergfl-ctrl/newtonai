-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Create enterprise_inquiries table
CREATE TABLE public.enterprise_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  job_title text NOT NULL,
  team_size text NOT NULL,
  use_case text NOT NULL,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for enterprise_inquiries
CREATE POLICY "Admins can view inquiries"
ON public.enterprise_inquiries FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update inquiries"
ON public.enterprise_inquiries FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit inquiry"
ON public.enterprise_inquiries FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger function for new user signups
CREATE OR REPLACE FUNCTION notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata)
  VALUES (
    'new_signup',
    'New User Signup',
    format('New user registered: %s', COALESCE(NEW.full_name, 'Unknown')),
    jsonb_build_object('user_id', NEW.id, 'full_name', NEW.full_name)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION notify_new_signup();

-- Trigger function for subscription purchases
CREATE OR REPLACE FUNCTION notify_subscription_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    INSERT INTO public.admin_notifications (type, title, message, metadata)
    VALUES (
      'subscription_purchase',
      'New Subscription',
      format('New %s subscription purchased (%s)', NEW.plan_name, NEW.billing_cycle),
      jsonb_build_object('subscription_id', NEW.id, 'plan_name', NEW.plan_name, 'billing_cycle', NEW.billing_cycle, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_subscription_activated
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION notify_subscription_purchase();

-- Trigger function for enterprise inquiries
CREATE OR REPLACE FUNCTION notify_enterprise_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata)
  VALUES (
    'enterprise_inquiry',
    'Enterprise Inquiry',
    format('New inquiry from %s at %s', NEW.first_name || ' ' || NEW.last_name, NEW.company),
    jsonb_build_object('inquiry_id', NEW.id, 'email', NEW.email, 'company', NEW.company)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_enterprise_inquiry
AFTER INSERT ON public.enterprise_inquiries
FOR EACH ROW EXECUTE FUNCTION notify_enterprise_inquiry();

-- Update trigger for enterprise_inquiries
CREATE TRIGGER update_enterprise_inquiries_updated_at
BEFORE UPDATE ON public.enterprise_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();