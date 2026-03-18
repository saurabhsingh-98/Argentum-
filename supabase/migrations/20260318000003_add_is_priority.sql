-- Migration: Add is_priority column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.posts.is_priority IS 'Flags whether a post should bypass standard filters and have high-intensity visual signatures.';
