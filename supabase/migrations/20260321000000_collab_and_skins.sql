-- Migration: Add Collaboration and Profile Effects support
-- Created: 2026-03-21

-- 1. Update users table with type and verification status
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'builder' CHECK (user_type IN ('builder', 'company')),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Update posts table with collaboration toggle
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_collab BOOLEAN DEFAULT FALSE;

-- 3. Refresh schema cache
NOTIFY pgrst, 'reload schema';
