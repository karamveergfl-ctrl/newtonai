-- Update the handle_new_user function to explicitly set subscription_tier to 'free'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, subscription_tier)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 'free');
  RETURN new;
END;
$function$;