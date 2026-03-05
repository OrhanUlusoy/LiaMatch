-- Migration 0010: Add skills, logo, saved_listings, messages, notifications

-- 1. Skills array on student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- 2. Logo URL on company_profiles
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS logo_url text;

-- 3. Saved listings (bookmarks)
CREATE TABLE IF NOT EXISTS saved_listings (
  student_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_user_id, internship_id)
);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own saved listings"
  ON saved_listings FOR ALL
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Admins full access saved listings"
  ON saved_listings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver marks read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Admins full access messages"
  ON messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'status_change', 'new_message', 'new_application'
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  related_id text, -- e.g. application_id, message_id
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System inserts notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins full access notifications"
  ON notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_saved_listings_student ON saved_listings(student_user_id);
