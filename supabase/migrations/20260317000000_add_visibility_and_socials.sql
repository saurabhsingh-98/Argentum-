-- Migration to add visibility and new social columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS twitter_username TEXT,
ADD COLUMN IF NOT EXISTS instagram_username TEXT;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
