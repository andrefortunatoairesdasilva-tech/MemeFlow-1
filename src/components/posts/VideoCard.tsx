import { useState, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber, timeAgo, getInitials } from '@/lib/utils'
import { likesService, postsService, commentsService, realtimeService } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Post } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface VideoCardProps {
  post: Post
  onDelete?: (id: string) => void
  onEdit?: (post: Post) => void
}

const categoryColors: Record<string, string> = {
  random: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  reacao: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  dark: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  wholesome: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  absurdo: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  politica: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  games: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  anime: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}

export default function VideoCard({ post, onDelete, onEdit }: VideoCardProps) {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const isOwner = user?.id === post.user_id

  useEffect(() => {
    if (user) {
      likesService.isLiked(user.id, post.id).then(({ liked }) => setLiked(liked))
    }
  }, [user, post.id])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleLike = async () => {
    if (!user) return toast.error('Faça login para curtir')
    if (liked) {
      setLiked(false)
      setLikesCount(c => c - 1)
      await likesService.unlike(user.id, post.id)
    } else {
      setLiked(true)
      setLikesCount(c => c + 1)
      await likesService.like(user.id, post.id)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Excluir este post?')) return
    const { error } = await postsService.delete(post.id)
    if (error) {
      toast.error('Erro ao excluir post')
    } else {
      toast.success('Post excluído!')
      onDelete?.(post.id)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
      await navigator.share({ title: post.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado! 🔗')
    }
  }

  const profile = post.profiles

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/user/${profile?.username}`}>
          <Avatar className="w-10 h-10 ring-2 ring-purple-500/20">
            <AvatarImage src={profile?.avatar_url ?? ''} />
            <AvatarFallback className="text-xs">
              {getInitials(profile?.display_name || profile?.username || 'U')}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/user/${profile?.username}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {profile?.display_name || profile?.username}
            </p>
          </Link>
          <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', categoryColors[post.category] || categoryColors.random)}>
            #{post.category}
          </span>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg py-1 w-36">
                    <button
                      onClick={() => { onEdit?.(post); setShowMenu(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-purple-500" />
                      Editar
                    </button>
                    <button
                      onClick={() => { handleDelete(); setShowMenu(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="px-4 pb-3">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{post.title}</h3>
        {post.description && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{post.description}</p>
        )}
      </div>

      {/* Video Player */}
      <div className="relative bg-black aspect-video group">
        {post.video_url ? (
          <>
            <video
              ref={videoRef}
              src={post.video_url}
              poster={post.thumbnail_url ?? undefined}
              className="w-full h-full object-contain"
              muted={isMuted}
              loop
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Controls overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
            </div>
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {!isPlaying && (
              <button onClick={togglePlay} className="absolute inset-0 w-full h-full" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {post.thumbnail_url ? (
              <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-contain" />
            ) : (
              <div className="text-gray-500 text-sm">Sem vídeo</div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
            liked
              ? 'bg-pink-50 text-pink-500 dark:bg-pink-900/20 dark:text-pink-400'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-pink-500 dark:hover:text-pink-400'
          )}
        >
          <Heart className={cn('w-4 h-4 transition-all', liked && 'fill-current')} />
          <span>{formatNumber(likesCount)}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-500 dark:hover:text-purple-400 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{formatNumber(post.comments_count)}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="ml-auto">
          {post.status !== 'active' && (
            <Badge variant="warning" className="text-xs">
              {post.status === 'draft' ? 'Rascunho' : 'Arquivado'}
            </Badge>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentsSection postId={post.id} />
      )}
    </div>
  )
}

function CommentsSection({ postId }: { postId: string }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<import('@/lib/supabase').Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    commentsService.getForPost(postId).then(({ data }: { data: import('@/lib/supabase').Comment[] | null }) => {
      setComments(data ?? [])
      setLoading(false)
    })

    const channel = realtimeService.subscribeToComments(postId, ({ eventType, new: newComment, old: oldComment }: { eventType: string; new: import('@/lib/supabase').Comment; old: import('@/lib/supabase').Comment }) => {
      if (eventType === 'INSERT') {
        setComments(prev => [...prev, newComment])
      } else if (eventType === 'DELETE') {
        setComments(prev => prev.filter(c => c.id !== oldComment.id))
      }
    })

    return () => {
      realtimeService.unsubscribe(channel)
    }
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return
    const trimmed = newComment.trim()
    setNewComment('')
    await commentsService.create(user.id, postId, trimmed)
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-3">
      {loading ? (
        <div className="text-xs text-gray-400 text-center py-2">Carregando comentários...</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-gray-400 text-center py-2">Nenhum comentário ainda. Seja o primeiro! 😄</div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-2">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={comment.profiles?.avatar_url ?? ''} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.profiles?.display_name || comment.profiles?.username || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {comment.profiles?.username}
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? ''} />
            <AvatarFallback className="text-xs">
              {getInitials(profile?.display_name || profile?.username || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Adicionar comentário..."
              className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="text-purple-600 dark:text-purple-400 disabled:opacity-40 hover:text-purple-700 text-xs font-semibold transition-colors"
            >
              Enviar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
