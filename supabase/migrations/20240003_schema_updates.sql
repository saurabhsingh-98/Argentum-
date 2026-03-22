ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS ip_address text;
-- If notifications type is a check constraint, update it to include 'collab_request'
-- Note: Supabase typically uses check constraints, not enums, for this pattern
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('upvote', 'comment', 'follow', 'message', 'verified', 'collab_request'));
