import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Search, ArrowLeft, MessageCircle, Loader2, Waves } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { messagesService, profilesService } from '@/lib/supabase'
import type { Conversation, Message, Profile } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getInitials, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { conversationId } = useParams()
  const { user, profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get other participant's profile from a conversation
  const getOtherProfile = (conv: Conversation): Profile | null => {
    if (!user) return null
    return user.id === conv.participant_1 ? (conv.profile_2 ?? null) : (conv.profile_1 ?? null)
  }

  const currentConv = conversations.find(c => c.id === conversationId)
  const otherProfile = currentConv ? getOtherProfile(currentConv) : null

  useEffect(() => {
    loadConversations()
  }, [user])

  useEffect(() => {
    if (!conversationId) return
    loadMessages(conversationId)
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    if (!user) return
    const { data } = await messagesService.getConversations(user.id)
    setConversations(data ?? [])
    setLoading(false)
  }

  const loadMessages = async (convId: string) => {
    const { data } = await messagesService.getMessages(convId)
    setMessages(data ?? [])
    if (user) {
      await messagesService.markAsRead(convId, user.id)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !conversationId || !newMessage.trim()) return
    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)
    const { data, error } = await messagesService.sendMessage(conversationId, user.id, content)
    setSending(false)
    if (error) {
      toast.error('Erro ao enviar mensagem')
      return
    }

    if (data) {
      setMessages(prev => [...prev, data])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }
    const { data } = await profilesService.search(q)
    setSearchResults((data ?? []).filter(p => p.id !== user?.id))
  }

  const handleStartChat = async (targetProfile: Profile) => {
    if (!user) return
    const { data: convId, error } = await messagesService.getOrCreateConversation(user.id, targetProfile.id)
    if (error || !convId) {
      toast.error('Erro ao iniciar conversa')
    } else {
      setSearchQuery('')
      setSearchResults([])
      await loadConversations()
      navigate(`/chat/${convId}`)
    }
  }

  return (
    <div className="flex h-screen md:h-auto md:min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Conversations List */}
      <div className={cn(
        'w-full md:w-80 xl:w-96 border-r border-gray-100 dark:border-gray-800 flex flex-col',
        conversationId ? 'hidden md:flex' : 'flex'
      )}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-600" />
            Chat
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar usuário..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleStartChat(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={p.avatar_url ?? ''} />
                    <AvatarFallback className="text-xs">{getInitials(p.display_name || p.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.display_name || p.username}</p>
                    <p className="text-xs text-gray-500">@{p.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 space-y-3">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma conversa ainda.<br />Busque um usuário para começar!
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = getOtherProfile(conv)
              if (!other) return null
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-50 dark:border-gray-900',
                    conv.id === conversationId && 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30'
                  )}
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={other.avatar_url ?? ''} />
                    <AvatarFallback>{getInitials(other.display_name || other.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {other.display_name || other.username}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.last_message || 'Iniciar conversa...'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
        'flex-1 flex flex-col',
        !conversationId ? 'hidden md:flex' : 'flex'
      )}>
        {conversationId && otherProfile ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
              <button
                onClick={() => navigate('/chat')}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherProfile.avatar_url ?? ''} />
                <AvatarFallback>{getInitials(otherProfile.display_name || otherProfile.username)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  {otherProfile.display_name || otherProfile.username}
                </p>
                <p className="text-xs text-gray-500">@{otherProfile.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Waves className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Diga olá para {otherProfile.display_name || otherProfile.username}!
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === user?.id
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex items-end gap-2', isMe && 'flex-row-reverse')}
                    >
                      {!isMe && (
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarImage src={otherProfile.avatar_url ?? ''} />
                          <AvatarFallback className="text-xs">
                            {getInitials(otherProfile.display_name || otherProfile.username)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                        isMe
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          isMe ? 'text-white/60' : 'text-gray-400'
                        )}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={myProfile?.avatar_url ?? ''} />
                  <AvatarFallback className="text-xs">
                    {getInitials(myProfile?.display_name || myProfile?.username || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Mensagem..."
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  variant="default"
                  disabled={!newMessage.trim() || sending}
                  className="rounded-2xl shrink-0"
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Suas mensagens</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Selecione uma conversa ou busque um usuário
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
