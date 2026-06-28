import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Compass, User, MessageCircle, Bell, PlusSquare, Zap,
  Sun, Moon, LogOut, Settings
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', icon: Home, label: 'Feed' },
  { to: '/explore', icon: Compass, label: 'Explorar' },
  { to: '/notifications', icon: Bell, label: 'Notificações' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

interface SidebarProps {
  onCreatePost?: () => void
}

export default function Sidebar({ onCreatePost }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Até logo!')
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-64 xl:w-72 min-h-screen bg-white dark:bg-gray-950 border-r border-slate-200 dark:border-gray-800 sticky top-0 h-screen">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Meme<span className="text-purple-600 dark:text-purple-400">Flow</span>
          </h1>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group',
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-purple-600 dark:hover:text-purple-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-white' : '')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Create Post Button */}
      <div className="px-3 pb-4">
        <Button
          variant="default"
          size="lg"
          className="w-full gap-2"
          onClick={onCreatePost}
        >
          <PlusSquare className="w-5 h-5" />
          Novo Meme
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {/* Profile quick link */}
        {profile && (
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-all group"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.avatar_url ?? ''} />
              <AvatarFallback className="text-xs">
                {getInitials(profile.display_name || profile.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {profile.display_name || profile.username}
              </p>
              <p className="text-xs text-gray-500 truncate">@{profile.username}</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </NavLink>
        )}

        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
