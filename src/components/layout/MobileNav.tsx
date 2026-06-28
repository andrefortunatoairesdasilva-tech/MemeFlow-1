import { NavLink } from 'react-router-dom'
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Feed' },
  { to: '/explore', icon: Compass, label: 'Explorar' },
  { to: '/create', icon: PlusSquare, label: 'Criar', special: true },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

interface MobileNavProps {
  onCreatePost?: () => void
}

export default function MobileNav({ onCreatePost }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-slate-200 dark:border-gray-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label, special }) => {
          if (special) {
            return (
              <button
                key={to}
                onClick={onCreatePost}
                className="flex flex-col items-center gap-0.5 px-3 py-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-active:scale-95 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{label}</span>
              </button>
            )
          }
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 transition-all',
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-xl transition-all',
                    isActive ? 'bg-purple-50 dark:bg-purple-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-900'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
