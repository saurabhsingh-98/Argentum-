-- Migration: Fix Post Deletion Policy
-- Description: Ensures that authenticated users can delete their own posts.

-- 1. Enable RLS on posts (should already be enabled, but being safe)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing delete policy if any, and create a robust one
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Also ensure we have a standard UPDATE policy if missing
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
