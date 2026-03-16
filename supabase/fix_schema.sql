-- Run this in your Supabase SQL Editor to fix the missing column errors
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS twitter_username TEXT,
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS currently_building TEXT;

-- Reload the schema cache
NOTIFY pgrst, 'reload schema';
