-- ============================================================
-- MemeFlow - Supabase Setup SQL
-- Execute this in your Supabase SQL Editor (in order)
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  humor_style TEXT DEFAULT 'all', -- 'all' | 'dark' | 'wholesome' | 'absurd' | 'sarcastic' | 'random'
  website TEXT,
  total_posts INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos / Posts
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'random', -- 'random' | 'reacao' | 'dark' | 'wholesome' | 'absurdo' | 'politica' | 'games' | 'anime'
  video_url TEXT NOT NULL,
  video_storage_path TEXT, -- path in supabase storage if uploaded
  thumbnail_url TEXT,
  thumbnail_storage_path TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Conversations (DMs)
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 != participant_2)
);

-- Messages (Chat)
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. STORAGE BUCKETS
-- ============================================================

-- Videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  TRUE,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  TRUE,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. STORAGE POLICIES
-- ============================================================

-- ===== VIDEOS BUCKET =====
-- Public read
CREATE POLICY "videos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Authenticated users can upload
CREATE POLICY "videos_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Users can update their own videos
CREATE POLICY "videos_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Users can delete their own videos
CREATE POLICY "videos_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- ===== THUMBNAILS BUCKET =====
CREATE POLICY "thumbnails_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "thumbnails_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "thumbnails_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- ===== AVATARS BUCKET =====
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "avatars_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "avatars_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES POLICIES =====
CREATE POLICY "profiles_public_read"
ON public.profiles FOR SELECT
USING (TRUE);

CREATE POLICY "profiles_auth_insert"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_auth_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_auth_delete"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ===== POSTS POLICIES =====
CREATE POLICY "posts_public_read_active"
ON public.posts FOR SELECT
USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "posts_auth_insert"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_auth_update"
ON public.posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_auth_delete"
ON public.posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===== LIKES POLICIES =====
CREATE POLICY "likes_public_read"
ON public.likes FOR SELECT
USING (TRUE);

CREATE POLICY "likes_auth_insert"
ON public.likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_auth_delete"
ON public.likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===== COMMENTS POLICIES =====
CREATE POLICY "comments_public_read"
ON public.comments FOR SELECT
USING (TRUE);

CREATE POLICY "comments_auth_insert"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_auth_update"
ON public.comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_auth_delete"
ON public.comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===== FOLLOWS POLICIES =====
CREATE POLICY "follows_public_read"
ON public.follows FOR SELECT
USING (TRUE);

CREATE POLICY "follows_auth_insert"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_auth_delete"
ON public.follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- ===== CONVERSATIONS POLICIES =====
CREATE POLICY "conversations_participant_read"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "conversations_auth_insert"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "conversations_auth_update"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ===== MESSAGES POLICIES =====
CREATE POLICY "messages_participant_read"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);

CREATE POLICY "messages_auth_insert"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);

CREATE POLICY "messages_auth_update"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "messages_auth_delete"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- ===== NOTIFICATIONS POLICIES =====
CREATE POLICY "notifications_owner_read"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "notifications_auth_insert"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "notifications_owner_update"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "notifications_owner_delete"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::TEXT, 1, 4)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger: after user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update profile updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Increment likes count on post
CREATE OR REPLACE FUNCTION public.handle_like_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  
  -- Create notification for post owner (if not self-like)
  INSERT INTO public.notifications (user_id, actor_id, type, post_id)
  SELECT p.user_id, NEW.user_id, 'like', NEW.post_id
  FROM public.posts p
  WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_insert
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_insert();

-- Decrement likes count on post
CREATE OR REPLACE FUNCTION public.handle_like_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_like_delete
  AFTER DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_delete();

-- Increment comments count
CREATE OR REPLACE FUNCTION public.handle_comment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  
  -- Notification for post owner
  INSERT INTO public.notifications (user_id, actor_id, type, post_id)
  SELECT p.user_id, NEW.user_id, 'comment', NEW.post_id
  FROM public.posts p
  WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_insert();

-- Decrement comments count
CREATE OR REPLACE FUNCTION public.handle_comment_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_comment_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_delete();

-- Handle follows - update counts
CREATE OR REPLACE FUNCTION public.handle_follow_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  
  -- Notification for followed user
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_follow_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_insert();

CREATE OR REPLACE FUNCTION public.handle_follow_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_follow_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_delete();

-- Handle total_posts counter
CREATE OR REPLACE FUNCTION public.handle_post_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles SET total_posts = total_posts + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_insert();

CREATE OR REPLACE FUNCTION public.handle_post_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles SET total_posts = GREATEST(total_posts - 1, 0) WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_post_delete
  AFTER DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_delete();

-- Handle message insert - update conversation last_message
CREATE OR REPLACE FUNCTION public.handle_message_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_other_user UUID;
BEGIN
  UPDATE public.conversations
  SET last_message = NEW.content, last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Get other participant and create notification
  SELECT CASE 
    WHEN participant_1 = NEW.sender_id THEN participant_2
    ELSE participant_1
  END INTO v_other_user
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  INSERT INTO public.notifications (user_id, actor_id, type, message_id)
  VALUES (v_other_user, NEW.sender_id, 'message', NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_message_insert();

-- Get or create conversation function
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user_a UUID, user_b UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_p1 UUID;
  v_p2 UUID;
BEGIN
  -- Always store with lower UUID first for consistency
  IF user_a < user_b THEN
    v_p1 := user_a; v_p2 := user_b;
  ELSE
    v_p1 := user_b; v_p2 := user_a;
  END IF;
  
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE participant_1 = v_p1 AND participant_2 = v_p2;
  
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1, participant_2)
    VALUES (v_p1, v_p2)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

-- ============================================================
-- 7. REALTIME SUBSCRIPTIONS - Enable for tables
-- ============================================================

-- Enable realtime on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- ============================================================
-- SETUP COMPLETE ✅
-- 
-- Configure Supabase Auth (Dashboard > Authentication > Settings):
--   - Enable Email Auth
--   - Set Site URL to your app URL
--   - Set Redirect URLs (for password recovery)
--   - Optionally enable Email Confirmations
--
-- Update your .env file with:
--   VITE_SUPABASE_URL=https://your-project-id.supabase.co
--   VITE_SUPABASE_ANON_KEY=your-anon-key-here
-- ============================================================
