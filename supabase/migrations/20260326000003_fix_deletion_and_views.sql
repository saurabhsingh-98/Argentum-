-- 1. Fix Foreign Keys for Posts (Add Cascading Deletes)

-- upvotes
ALTER TABLE IF EXISTS public.upvotes
DROP CONSTRAINT IF EXISTS upvotes_post_id_fkey,
ADD CONSTRAINT upvotes_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES public.posts(id) 
  ON DELETE CASCADE;

-- comments
ALTER TABLE IF EXISTS public.comments
DROP CONSTRAINT IF EXISTS comments_post_id_fkey,
ADD CONSTRAINT comments_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES public.posts(id) 
  ON DELETE CASCADE;

-- collab_requests
ALTER TABLE IF EXISTS public.collab_requests
DROP CONSTRAINT IF EXISTS collab_requests_post_id_fkey,
ADD CONSTRAINT collab_requests_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES public.posts(id) 
  ON DELETE CASCADE;

-- post_reactions (Check and fix)
ALTER TABLE IF EXISTS public.post_reactions
DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey,
ADD CONSTRAINT post_reactions_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES public.posts(id) 
  ON DELETE CASCADE;

-- reports (check for both target_post_id and post_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'target_post_id') THEN
    ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_post_id_fkey;
    ALTER TABLE public.reports ADD CONSTRAINT reports_target_post_id_fkey FOREIGN KEY (target_post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'post_id') THEN
    ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_post_id_fkey;
    ALTER TABLE public.reports ADD CONSTRAINT reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Fix View Increment Function Permissions
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO public;
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO authenticated;

-- Ensure it's security definer to bypass RLS on update
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
