-- Add engagement and status columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS looking_for TEXT,
ADD COLUMN IF NOT EXISTS pinned_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
CREATE POLICY "Public read follows" ON public.follows 
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.follows 
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows 
  FOR DELETE USING (auth.uid() = follower_id);

-- Update users policies to ensure they can update their own new columns
-- (Existing "Users update own" policy should already cover this)
