CREATE TABLE IF NOT EXISTS collab_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, applicant_id)
);
CREATE INDEX IF NOT EXISTS collab_requests_post_id_idx ON collab_requests(post_id);
CREATE INDEX IF NOT EXISTS collab_requests_applicant_id_idx ON collab_requests(applicant_id);
