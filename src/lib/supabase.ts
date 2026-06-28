import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// ============================================================
// AUTH FUNCTIONS
// ============================================================

export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string, username: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    })
    return { data, error }
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Recover password (sends reset email)
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  // Update password (after recovery)
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  },

  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  // Get current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// ============================================================
// PROFILES FUNCTIONS
// ============================================================

export const profilesService = {
  // Get profile by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Get profile by username
  getByUsername: async (username: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    return { data, error }
  },

  // Update profile
  update: async (id: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Search profiles
  search: async (query: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20)
    return { data, error }
  },

  // Upload avatar
  uploadAvatar: async (userId: string, file: File) => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) return { data: null, error: uploadError }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId)
      .select()
      .single()

    return { data, error, url: urlData.publicUrl }
  },

  // Delete old avatar from storage
  deleteAvatar: async (path: string) => {
    const { error } = await supabase.storage.from('avatars').remove([path])
    return { error }
  },
}

// ============================================================
// POSTS FUNCTIONS
// ============================================================

export const postsService = {
  // Get all active posts (feed) with pagination
  getFeed: async (page = 0, limit = 10) => {
    const { data, error, count } = await supabase
      .from('posts')
      .select('*, profiles(*)', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)
    return { data, error, count }
  },

  // Get posts by user
  getByUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get posts by a list of IDs
  getByIds: async (ids: string[]) => {
    if (ids.length === 0) return { data: [] as Post[] | null, error: null }
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .in('id', ids)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get own posts (including drafts)
  getMyPosts: async (userId: string) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get post by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Create post
  create: async (post: Partial<Post>) => {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select('*, profiles(*)')
      .single()
    return { data, error }
  },

  // Update post
  update: async (id: string, updates: Partial<Post>) => {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select('*, profiles(*)')
      .single()
    return { data, error }
  },

  // Delete post
  delete: async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id)
    return { error }
  },

  // Upload video file
  uploadVideo: async (userId: string, file: File, onProgress?: (progress: number) => void) => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/video-${Date.now()}.${ext}`

    // Simulate progress since Supabase JS v2 doesn't expose upload progress directly
    onProgress?.(10)
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(path, file, { upsert: false })
    onProgress?.(100)

    if (uploadError) return { data: null, error: uploadError, path: null }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path)
    return { data: urlData, error: null, path }
  },

  // Upload thumbnail
  uploadThumbnail: async (userId: string, file: File) => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/thumb-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(path, file, { upsert: false })

    if (uploadError) return { data: null, error: uploadError, path: null }

    const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path)
    return { data: urlData, error: null, path }
  },

  // Get posts by category
  getByCategory: async (category: string, page = 0, limit = 10) => {
    const { data, error, count } = await supabase
      .from('posts')
      .select('*, profiles(*)', { count: 'exact' })
      .eq('status', 'active')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)
    return { data, error, count }
  },

  // Increment view count
  incrementView: async (postId: string) => {
    const { error } = await supabase.rpc('increment_view', { post_id: postId })
    return { error }
  },
}

// ============================================================
// LIKES FUNCTIONS
// ============================================================

export const likesService = {
  // Like a post
  like: async (userId: string, postId: string) => {
    const { data, error } = await supabase
      .from('likes')
      .insert({ user_id: userId, post_id: postId })
      .select()
      .single()
    return { data, error }
  },

  // Unlike a post
  unlike: async (userId: string, postId: string) => {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)
    return { error }
  },

  // Check if user liked a post
  isLiked: async (userId: string, postId: string) => {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()
    return { liked: !!data, error }
  },

  // Get likes for a post
  getForPost: async (postId: string) => {
    const { data, error, count } = await supabase
      .from('likes')
      .select('*, profiles(*)', { count: 'exact' })
      .eq('post_id', postId)
    return { data, error, count }
  },

  // Get all posts liked by a user
  getUserLikedPosts: async (userId: string) => {
    const { data, error } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
    return { data: data?.map(l => l.post_id) ?? [], error }
  },
}

// ============================================================
// COMMENTS FUNCTIONS
// ============================================================

export const commentsService = {
  // Get comments for a post
  getForPost: async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  // Create comment
  create: async (userId: string, postId: string, content: string) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: userId, post_id: postId, content })
      .select('*, profiles(*)')
      .single()
    return { data, error }
  },

  // Update comment
  update: async (id: string, content: string) => {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select('*, profiles(*)')
      .single()
    return { data, error }
  },

  // Delete comment
  delete: async (id: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    return { error }
  },
}

// ============================================================
// FOLLOWS FUNCTIONS
// ============================================================

export const followsService = {
  // Follow user
  follow: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })
      .select()
      .single()
    return { data, error }
  },

  // Unfollow user
  unfollow: async (followerId: string, followingId: string) => {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
    return { error }
  },

  // Check if following
  isFollowing: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle()
    return { following: !!data, error }
  },

  // Get followers of a user
  getFollowers: async (userId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .select('*, profiles!follows_follower_id_fkey(*)')
      .eq('following_id', userId)
    return { data, error }
  },

  // Get users a user is following
  getFollowing: async (userId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .select('*, profiles!follows_following_id_fkey(*)')
      .eq('follower_id', userId)
    return { data, error }
  },
}

// ============================================================
// CONVERSATIONS / MESSAGES FUNCTIONS
// ============================================================

export const messagesService = {
  // Get or create conversation between two users
  getOrCreateConversation: async (userA: string, userB: string) => {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      user_a: userA,
      user_b: userB,
    })
    return { data, error }
  },

  // Get all conversations for a user
  getConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        profile_1:profiles!conversations_participant_1_fkey(*),
        profile_2:profiles!conversations_participant_2_fkey(*)
      `)
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('last_message_at', { ascending: false })
    return { data, error }
  },

  // Get messages in a conversation
  getMessages: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  // Send message
  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select('*, profiles(*)')
      .single()
    return { data, error }
  },

  // Mark messages as read
  markAsRead: async (conversationId: string, userId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false)
    return { error }
  },

  // Subscribe to new messages in a conversation (Realtime)
  subscribeToMessages: (
    conversationId: string,
    callback: (message: Message) => void
  ) => {
    const channelName = `messages:${conversationId}:${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
    return supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => callback(payload.new as Message)
      )
      .subscribe()
  },

  // Subscribe to conversations list (Realtime)
  subscribeToConversations: (
    userId: string,
    callback: (conversation: Conversation) => void
  ) => {
    const channelName = `conversations:${userId}:${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
    return supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1=eq.${userId}`,
        },
        (payload) => callback(payload.new as Conversation)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_2=eq.${userId}`,
        },
        (payload) => callback(payload.new as Conversation)
      )
      .subscribe()
  },
}

// ============================================================
// NOTIFICATIONS FUNCTIONS
// ============================================================

export const notificationsService = {
  // Get notifications for user
  getForUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(*), posts(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    return { data, error }
  },

  // Mark all as read
  markAllRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    return { error }
  },

  // Get unread count
  getUnreadCount: async (userId: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    return { count: count ?? 0, error }
  },

  // Subscribe to notifications (Realtime)
  subscribeToNotifications: (
    userId: string,
    callback: (notification: Notification) => void
  ) => {
    const channelName = `notifications:${userId}:${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
    return supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload.new as Notification)
      )
      .subscribe()
  },
}

// ============================================================
// REALTIME - FEED SUBSCRIPTIONS
// ============================================================

export const realtimeService = {
  // Subscribe to new posts in feed (Realtime)
  subscribeToPosts: (callback: (post: Post) => void) => {
    return supabase
      .channel('feed:posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'status=eq.active',
        },
        (payload) => callback(payload.new as Post)
      )
      .subscribe()
  },

  // Subscribe to likes changes (Realtime)
  subscribeToLikes: (
    postId: string,
    callback: (payload: { eventType: string; new: Like; old: Like }) => void
  ) => {
    return supabase
      .channel(`likes:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `post_id=eq.${postId}`,
        },
        (payload) =>
          callback({
            eventType: payload.eventType,
            new: payload.new as Like,
            old: payload.old as Like,
          })
      )
      .subscribe()
  },

  // Subscribe to comments (Realtime)
  subscribeToComments: (
    postId: string,
    callback: (payload: { eventType: string; new: Comment; old: Comment }) => void
  ) => {
    return supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) =>
          callback({
            eventType: payload.eventType,
            new: payload.new as Comment,
            old: payload.old as Comment,
          })
      )
      .subscribe()
  },

  // Unsubscribe from a channel
  unsubscribe: async (channel: ReturnType<typeof supabase.channel>) => {
    await supabase.removeChannel(channel)
  },
}

// ============================================================
// TYPES
// ============================================================

export type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  humor_style: string
  website: string | null
  total_posts: number
  followers_count: number
  following_count: number
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  video_url: string
  video_storage_path: string | null
  thumbnail_url: string | null
  thumbnail_storage_path: string | null
  status: 'active' | 'draft' | 'archived'
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type Like = {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export type Comment = {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export type Conversation = {
  id: string
  participant_1: string
  participant_2: string
  last_message: string | null
  last_message_at: string
  created_at: string
  profile_1?: Profile
  profile_2?: Profile
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  profiles?: Profile
}

export type Notification = {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'message'
  post_id: string | null
  message_id: string | null
  read: boolean
  created_at: string
  actor?: Profile
  posts?: Post
}
