import { useState, useEffect } from 'react'
import { Bell, Heart, MessageCircle, UserPlus, Check, Loader2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { notificationsService } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getInitials, timeAgo } from '@/lib/utils'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const notifIcon: Record<string, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-pink-500" />,
  comment: <MessageCircle className="w-4 h-4 text-purple-500" />,
  follow: <UserPlus className="w-4 h-4 text-green-500" />,
  message: <MessageCircle className="w-4 h-4 text-blue-500" />,
}

const notifText: Record<string, string> = {
  like: 'curtiu seu vídeo',
  comment: 'comentou no seu vídeo',
  follow: 'começou a te seguir',
  message: 'enviou uma mensagem',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return undefined
    loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    if (!user) return
    const { data } = await notificationsService.getForUser(user.id)
    setNotifications(data ?? [])
    setLoading(false)
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await notificationsService.markAllRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('Todas marcadas como lidas ✓')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-xl mx-auto px-4 py-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-600" />
            Notificações
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-0.5">
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-1.5" />
            Marcar como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">Tudo tranquilo por aqui!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Suas notificações aparecerão aqui quando alguém interagir com você.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl border transition-all',
                notif.read
                  ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  : 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30'
              )}
            >
              {/* Actor Avatar */}
              <div className="relative shrink-0">
                <Link to={`/user/${notif.actor?.username}`}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notif.actor?.avatar_url ?? ''} />
                    <AvatarFallback className="text-xs">
                      {getInitials(notif.actor?.display_name || notif.actor?.username || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-800">
                  {notifIcon[notif.type]}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <Link
                    to={`/user/${notif.actor?.username}`}
                    className="font-bold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    {notif.actor?.display_name || notif.actor?.username}
                  </Link>
                  {' '}{notifText[notif.type] || 'interagiu com você'}
                </p>
                {notif.posts && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    📹 {notif.posts.title}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
              </div>

              {/* Thumbnail */}
              {notif.posts?.thumbnail_url && (
                <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={notif.posts.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Unread dot */}
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
