import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, TrendingUp, Flame, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import VideoCard from '@/components/posts/VideoCard'
import CreatePostModal from '@/components/posts/CreatePostModal'
import { postsService, realtimeService } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const PAGE_SIZE = 8

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [newPostsCount, setNewPostsCount] = useState(0)

  const loadPosts = useCallback(async (pageNum = 0) => {
    setLoading(true)
    const { data, count } = await postsService.getFeed(pageNum, PAGE_SIZE)
    setLoading(false)
    if (data) {
      if (pageNum === 0) {
        setPosts(data)
      } else {
        setPosts(prev => [...prev, ...data])
      }
      setHasMore((count ?? 0) > (pageNum + 1) * PAGE_SIZE)
    }
  }, [])

  useEffect(() => {
    loadPosts(0)

    // Realtime: listen for new posts
    const channel = realtimeService.subscribeToPosts((newPost) => {
      if (newPost.user_id !== user?.id) {
        setNewPostsCount(c => c + 1)
      } else {
        setPosts(prev => [newPost, ...prev])
      }
    })

    return () => {
      realtimeService.unsubscribe(channel)
    }
  }, [loadPosts, user])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadPosts(nextPage)
  }

  const handleRefresh = () => {
    setPage(0)
    setNewPostsCount(0)
    loadPosts(0)
  }

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-purple-600" />
            Feed
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Os memes mais fresquinhos</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* New posts notification */}
      {newPostsCount > 0 && (
        <button
          onClick={handleRefresh}
          className="w-full mb-4 py-3 bg-purple-600 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-500/20"
        >
          <TrendingUp className="w-4 h-4" />
          {newPostsCount} novo{newPostsCount > 1 ? 's' : ''} meme{newPostsCount > 1 ? 's' : ''}! Clique para ver
        </button>
      )}

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
              </div>
              <div className="h-56 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Feed vazio!</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Seja o primeiro a postar um meme épico!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <VideoCard
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
              onEdit={setEditPost}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Carregando...' : 'Ver mais memes'}
              </Button>
            </div>
          )}
        </div>
      )}

      {editPost && (
        <CreatePostModal
          editPost={editPost}
          onClose={() => setEditPost(null)}
          onSuccess={() => { setEditPost(null); loadPosts(0) }}
        />
      )}
    </div>
  )
}
