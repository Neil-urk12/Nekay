-- ============================================
-- Row Level Security (RLS) Policies for Nekay
-- Run this in Supabase SQL Editor
-- ============================================

-- =====================
-- PART 1: SCHEMA UPDATES (run these first if tables exist)
-- =====================

-- Add user_id column to profile_posts for faster/safer RLS
-- Only run if the table exists but column doesn't
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_posts') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_posts' AND column_name = 'user_id') 
  THEN
    ALTER TABLE profile_posts ADD COLUMN user_id UUID REFERENCES users(id);
  END IF;
END $$;

-- =====================
-- PART 2: PERFORMANCE INDEXES (only creates if table exists)
-- =====================

-- Indexes for faster RLS policy checks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_breathing_sessions_user_id ON breathing_sessions(user_id);

-- Only create these if the tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_posts') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_posts' AND column_name = 'user_id')
  THEN
    CREATE INDEX IF NOT EXISTS idx_profile_posts_user_id ON profile_posts(user_id);
  END IF;
END $$;

-- =====================
-- PART 3: RLS POLICIES - CORE TABLES
-- (Only enable RLS if table exists)
-- =====================

-- USERS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can read all profiles" ON users;
    CREATE POLICY "Users can read all profiles" ON users FOR SELECT USING (auth.role() = 'authenticated');
    
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- TASKS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users own their tasks" ON tasks;
    CREATE POLICY "Users own their tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- FOLDERS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'folders') THEN
    ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users own their folders" ON folders;
    CREATE POLICY "Users own their folders" ON folders FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- JOURNAL ENTRIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
    ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users own their journal entries" ON journal_entries;
    CREATE POLICY "Users own their journal entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- WATER LOGS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'water_logs') THEN
    ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users own their water logs" ON water_logs;
    CREATE POLICY "Users own their water logs" ON water_logs FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- POMODORO SESSIONS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pomodoro_sessions') THEN
    ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users own their pomodoro sessions" ON pomodoro_sessions;
    CREATE POLICY "Users own their pomodoro sessions" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- BREATHING SESSIONS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'breathing_sessions') THEN
    ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users own their breathing sessions" ON breathing_sessions;
    CREATE POLICY "Users own their breathing sessions" ON breathing_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================
-- PART 4: RLS POLICIES - MESSAGING TABLES
-- =====================

-- CONVERSATIONS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    
    -- Index for faster RLS policy checks on conversations
    CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
    
    DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
    CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);
    
    DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
    CREATE POLICY "Users can create conversations" ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user1_id);
    
    DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
    CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);
  END IF;
END $$;

-- MESSAGES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
    CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    );
    
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    CREATE POLICY "Users can send messages" ON messages FOR INSERT
    WITH CHECK (
      auth.uid() = sender_id
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    );
    
    DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
    CREATE POLICY "Users can mark messages as read" ON messages FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    );
  END IF;
END $$;

-- =====================
-- PART 5: RLS POLICIES - PROFILE TABLES
-- =====================

-- PROFILES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Profiles are publicly viewable" ON profiles;
    CREATE POLICY "Profiles are publicly viewable" ON profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
    USING (auth.uid()::text = id::text);
    
    DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
    CREATE POLICY "Users can create own profile" ON profiles FOR INSERT
    WITH CHECK (auth.uid()::text = id::text);
  END IF;
END $$;

-- PROFILE POSTS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_posts') THEN
    ALTER TABLE profile_posts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Profile posts are publicly viewable" ON profile_posts;
    CREATE POLICY "Profile posts are publicly viewable" ON profile_posts FOR SELECT USING (true);
    
    -- Use user_id if it exists, otherwise fall back to nickname join
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_posts' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can create own posts" ON profile_posts;
      CREATE POLICY "Users can create own posts" ON profile_posts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can delete own posts" ON profile_posts;
      CREATE POLICY "Users can delete own posts" ON profile_posts FOR DELETE
      USING (auth.uid() = user_id);
    ELSE
      DROP POLICY IF EXISTS "Users can create own posts" ON profile_posts;
      CREATE POLICY "Users can create own posts" ON profile_posts FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.nickname = profile_nickname
          AND p.id::text = auth.uid()::text
        )
      );
      
      DROP POLICY IF EXISTS "Users can delete own posts" ON profile_posts;
      CREATE POLICY "Users can delete own posts" ON profile_posts FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.nickname = profile_nickname
          AND p.id::text = auth.uid()::text
        )
      );
    END IF;
  END IF;
END $$;

-- =====================
-- PART 6: RLS POLICIES - AGREEMENTS TABLE
-- =====================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agreements') THEN
    ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Authenticated users can create agreements" ON agreements;
    CREATE POLICY "Authenticated users can create agreements" ON agreements FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
    
    DROP POLICY IF EXISTS "Authenticated users can view agreements" ON agreements;
    CREATE POLICY "Authenticated users can view agreements" ON agreements FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- =====================
-- DONE!
-- =====================
SELECT 'RLS policies applied successfully!' AS status;
