-- ============================================================
-- RUN THIS ENTIRE FILE IN YOUR SUPABASE SQL EDITOR
-- Fixes: posting, image uploads, followers, storage access
-- ============================================================

-- 1. Add missing columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_collab BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- 2. Fix category check constraint to include 'Speak'
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_category_check 
CHECK (category IN ('Web3', 'AI', 'Mobile', 'DevTools', 'Game', 'Other', 'Speak'));

-- 3. Ensure posts RLS policies exist
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published" ON public.posts;
CREATE POLICY "Public read published" ON public.posts 
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Auth read own posts" ON public.posts;
CREATE POLICY "Auth read own posts" ON public.posts 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth insert posts" ON public.posts;
CREATE POLICY "Auth insert posts" ON public.posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth update own posts" ON public.posts;
CREATE POLICY "Auth update own posts" ON public.posts 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth delete own posts" ON public.posts;
CREATE POLICY "Auth delete own posts" ON public.posts 
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Fix follows table RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read follows" ON public.follows;
CREATE POLICY "Anyone can read follows" ON public.follows
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Auth users can follow" ON public.follows;
CREATE POLICY "Auth users can follow" ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Auth users can unfollow" ON public.follows;
CREATE POLICY "Auth users can unfollow" ON public.follows
  FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- 5. Fix storage RLS for message-attachments and avatars
DROP POLICY IF EXISTS "Public can read attachments" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own avatars" ON storage.objects;

CREATE POLICY "Authenticated upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated read attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

-- 6. Add attachment columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size BIGINT;

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Enable realtime for messages, users, message_reactions (safe — skips if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
  END IF;
END $$;
