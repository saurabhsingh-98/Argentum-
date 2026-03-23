-- Add missing profile columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS looking_for TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'builder' CHECK (user_type IN ('builder', 'company')),
  ADD COLUMN IF NOT EXISTS pinned_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_key TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT,
  ADD COLUMN IF NOT EXISTS key_backup_method TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS key_backup_hint TEXT,
  ADD COLUMN IF NOT EXISTS key_backup_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_history JSONB DEFAULT '[]';

-- Storage: allow authenticated users to upload to message-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for message-attachments storage
CREATE POLICY "Auth users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Public can read attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

CREATE POLICY "Auth users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage: avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Auth users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');
