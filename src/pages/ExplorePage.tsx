import { useState, useEffect } from 'react'
import { Search, Loader2, Compass } from 'lucide-react'
import { Input } from '@/components/ui/input'
import VideoCard from '@/components/posts/VideoCard'
import { postsService, profilesService } from '@/lib/supabase'
import type { Post, Profile } from '@/lib/supabase'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import { getInitials } from '@/lib/utils'

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'random', label: 'Aleatório' },
  { value: 'reacao', label: 'Reação' },
  { value: 'dark', label: 'Dark' },
  { value: 'wholesome', label: 'Wholesome' },
  { value: 'absurdo', label: 'Absurdo' },
  { value: 'politica', label: 'Política' },
  { value: 'games', label: 'Games' },
  { value: 'anime', label: 'Anime' },
]

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'posts' | 'users'>('posts')

  useEffect(() => {
    if (search.trim().length > 0) {
      handleSearch()
    } else {
      loadByCategory(category)
    }
  }, [category, search])

  const loadByCategory = async (cat: string) => {
    setLoading(true)
    let data: Post[] | null = []
    if (cat === 'all') {
      const result = await postsService.getFeed(0, 20)
      data = result.data
    } else {
      const result = await postsService.getByCategory(cat, 0, 20)
      data = result.data
    }
    setPosts(data ?? [])
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    const { data } = await profilesService.search(search)
    setProfiles(data ?? [])
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-600" />
          Explorar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Descubra memes e criadores</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar memes ou usuários..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {search.trim() ? (
        <>
          {/* Search Results: Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('posts')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === 'posts'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Vídeos
            </button>
            <button
              onClick={() => setTab('users')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === 'users'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Usuários
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : tab === 'users' ? (
            <div className="space-y-2">
              {profiles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Nenhum usuário encontrado</div>
              ) : (
                profiles.map(profile => (
                  <Link
                    key={profile.id}
                    to={`/user/${profile.username}`}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile.avatar_url ?? ''} />
                      <AvatarFallback>{getInitials(profile.display_name || profile.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{profile.display_name || profile.username}</p>
                      <p className="text-sm text-gray-500">@{profile.username}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.total_posts}</p>
                      <p className="text-xs text-gray-500">posts</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.filter(p =>
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.description.toLowerCase().includes(search.toLowerCase())
              ).map(post => (
                <VideoCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  category === cat.value
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🌵</div>
              <p className="text-gray-500">Nenhum meme nesta categoria ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <VideoCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
