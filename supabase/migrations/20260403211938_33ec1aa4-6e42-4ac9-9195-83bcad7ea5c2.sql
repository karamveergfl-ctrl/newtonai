ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS grade_level text,
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS thumbnail text,
  ADD COLUMN IF NOT EXISTS max_students integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;