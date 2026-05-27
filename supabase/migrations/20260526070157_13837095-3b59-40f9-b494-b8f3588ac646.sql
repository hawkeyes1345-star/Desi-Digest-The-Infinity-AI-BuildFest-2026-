ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS dietary_preference text,
  ADD COLUMN IF NOT EXISTS allergies text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS health_conditions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- Add profiles to realtime publication so live updates work app-wide.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
END $$;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;