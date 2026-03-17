CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  github_username TEXT,
  twitter_username TEXT,
  instagram_username TEXT,
  website_url TEXT,
  hbar_wallet TEXT,
  streak_count INT DEFAULT 0,
  currently_building TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT,
  status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft','published','private')),
  category TEXT 
    CHECK (category IN ('Web3','AI','Mobile','DevTools','Game','Other')),
  tags TEXT[] DEFAULT '{}',
  upvotes INT DEFAULT 0,
  nft_token_id TEXT,
  hcs_sequence_num BIGINT,
  verification_status TEXT DEFAULT 'unverified' 
    CHECK (verification_status IN ('unverified','pending','verified')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read users" ON public.users 
  FOR SELECT USING (true);
CREATE POLICY "Users insert own" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own" ON public.users 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public read published" ON public.posts 
  FOR SELECT USING (status = 'published');
CREATE POLICY "Auth read own posts" ON public.posts 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth insert posts" ON public.posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own posts" ON public.posts 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public read upvotes" ON public.upvotes 
  FOR SELECT USING (true);
CREATE POLICY "Auth insert upvotes" ON public.upvotes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete upvotes" ON public.upvotes 
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public read comments" ON public.comments 
  FOR SELECT USING (true);
CREATE POLICY "Auth insert comments" ON public.comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_upvotes(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET upvotes = upvotes + 1 
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_upvotes(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET upvotes = GREATEST(0, upvotes - 1) 
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
