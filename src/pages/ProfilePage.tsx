import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Camera, Edit2, Grid, Heart, UserPlus, UserMinus, Check, X, Globe, MessageCircle } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import VideoCard from '@/components/posts/VideoCard'
import CreatePostModal from '@/components/posts/CreatePostModal'
import { profilesService, postsService, followsService, messagesService, likesService } from '@/lib/supabase'
import type { Profile, Post } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatNumber, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const HUMOR_STYLES = [
  { value: 'all', label: 'Todos os estilos' },
  { value: 'dark', label: 'Dark Humor' },
  { value: 'wholesome', label: 'Wholesome' },
  { value: 'absurd', label: 'Absurdo' },
  { value: 'sarcastic', label: 'Sarcastic' },
  { value: 'random', label: 'Aleatório' },
]

export default function ProfilePage() {
  const { username } = useParams()
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    humor_style: 'all',
    website: '',
  })

  const isOwner = !username || username === myProfile?.username

  useEffect(() => {
    loadProfile()
  }, [username, myProfile])

  const loadProfile = async () => {
    setLoading(true)
    let targetProfile: Profile | null = null

    if (isOwner && myProfile) {
      targetProfile = myProfile
    } else if (username) {
      const { data } = await profilesService.getByUsername(username)
      targetProfile = data
    }

    if (targetProfile) {
      setProfile(targetProfile)
      setEditForm({
        display_name: targetProfile.display_name ?? '',
        bio: targetProfile.bio ?? '',
        humor_style: targetProfile.humor_style ?? 'all',
        website: targetProfile.website ?? '',
      })

      const { data: postsData } = isOwner
        ? await postsService.getMyPosts(targetProfile.id)
        : await postsService.getByUser(targetProfile.id)
      setPosts(postsData ?? [])

      const { data: likedPostIds } = await likesService.getUserLikedPosts(targetProfile.id)
      if (likedPostIds && likedPostIds.length > 0) {
        const { data: likedPostData } = await postsService.getByIds(likedPostIds)
        setLikedPosts(likedPostData ?? [])
      } else {
        setLikedPosts([])
      }

      if (user && !isOwner) {
        const { following } = await followsService.isFollowing(user.id, targetProfile.id)
        setIsFollowing(following)
      }
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const toastId = toast.loading('Enviando avatar...')
    const { data, error } = await profilesService.uploadAvatar(user.id, file)
    toast.dismiss(toastId)
    if (error) {
      toast.error('Erro ao enviar avatar')
    } else {
      toast.success('Avatar atualizado!')
      setProfile(data)
      refreshProfile()
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    const { data, error } = await profilesService.update(user.id, editForm)
    if (error) {
      toast.error('Erro ao salvar perfil')
    } else {
      toast.success('Perfil atualizado!')
      setProfile(data)
      setEditMode(false)
      refreshProfile()
    }
  }

  const handleFollow = async () => {
    if (!user || !profile) return
    if (isFollowing) {
      setIsFollowing(false)
      setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : prev)
      await followsService.unfollow(user.id, profile.id)
      toast.success('Deixou de seguir')
    } else {
      setIsFollowing(true)
      setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : prev)
      await followsService.follow(user.id, profile.id)
      toast.success('Seguindo!')
    }
  }

  const handleStartChat = async () => {
    if (!user || !profile) return
    const { data: convId, error } = await messagesService.getOrCreateConversation(user.id, profile.id)
    if (error || !convId) {
      toast.error('Erro ao abrir conversa')
    } else {
      navigate(`/chat/${convId}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-purple-50 dark:bg-purple-900/20 mx-auto">
            <UserPlus className="w-10 h-10 text-purple-600 dark:text-purple-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Usuário não encontrado</h2>
          <Link to="/">
            <Button variant="default">Voltar ao Feed</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 w-full">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
        <div className="h-24 -mx-6 -mt-6 mb-0 rounded-t-2xl bg-purple-600 mb-4 relative">
          <div className="absolute inset-0 bg-black/20 rounded-t-2xl" />
        </div>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative -mt-12 shrink-0">
            <Avatar className="w-20 h-20 ring-4 ring-white dark:ring-gray-900 shadow-lg">
              <AvatarImage src={profile.avatar_url ?? ''} />
              <AvatarFallback className="text-xl">
                {getInitials(profile.display_name || profile.username)}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-md"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 mt-1">
            {editMode ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Nome de exibição</Label>
                  <Input
                    value={editForm.display_name}
                    onChange={e => setEditForm(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="Seu nome"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Bio</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Fale algo sobre você..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs">Estilo de humor</Label>
                  <Select
                    value={editForm.humor_style}
                    onValueChange={v => setEditForm(p => ({ ...p, humor_style: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HUMOR_STYLES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Website</Label>
                  <Input
                    value={editForm.website}
                    onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={handleSaveProfile}>
                    <Check className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                      {profile.display_name || profile.username}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
                  </div>
                  {isOwner ? (
                    <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleStartChat}>
                        <MessageCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isFollowing ? 'outline' : 'gradient'}
                        onClick={handleFollow}
                      >
                        {isFollowing ? (
                          <><UserMinus className="w-3.5 h-3.5 mr-1.5" />Seguindo</>
                        ) : (
                          <><UserPlus className="w-3.5 h-3.5 mr-1.5" />Seguir</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{profile.bio}</p>
                )}

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {profile.humor_style && profile.humor_style !== 'all' && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {HUMOR_STYLES.find(s => s.value === profile.humor_style)?.label}
                    </span>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {!editMode && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-lg font-black text-gray-900 dark:text-white">{formatNumber(profile.total_posts)}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-gray-900 dark:text-white">{formatNumber(profile.followers_count)}</p>
              <p className="text-xs text-gray-500">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-gray-900 dark:text-white">{formatNumber(profile.following_count)}</p>
              <p className="text-xs text-gray-500">Seguindo</p>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      <Tabs defaultValue="posts">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="posts">
              <Grid className="w-4 h-4 mr-1.5" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="likes">
              <Heart className="w-4 h-4 mr-1.5" />
              Curtidos
            </TabsTrigger>
          </TabsList>
          {isOwner && (
            <Button size="sm" variant="default" onClick={() => setShowCreatePost(true)}>
              + Novo
            </Button>
          )}
        </div>

        <TabsContent value="posts">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center mb-3">
                <Heart className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isOwner ? 'Você ainda não publicou nenhum meme!' : 'Nenhum post ainda.'}
              </p>
              {isOwner && (
                <Button variant="default" size="sm" className="mt-3" onClick={() => setShowCreatePost(true)}>
                  Publicar primeiro meme
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.filter(p => isOwner || p.status === 'active').map(post => (
                <VideoCard
                  key={post.id}
                  post={post}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                  onEdit={setEditPost}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes">
          {likedPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center mb-3">
                <Heart className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Posts curtidos aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {likedPosts.map(post => (
                <VideoCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => { setShowCreatePost(false); loadProfile() }}
        />
      )}
      {editPost && (
        <CreatePostModal
          editPost={editPost}
          onClose={() => setEditPost(null)}
          onSuccess={() => { setEditPost(null); loadProfile() }}
        />
      )}
    </div>
  )
}
