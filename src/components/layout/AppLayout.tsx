import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import CreatePostModal from '@/components/posts/CreatePostModal'

export default function AppLayout() {
  const [showCreatePost, setShowCreatePost] = useState(false)

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Sidebar onCreatePost={() => setShowCreatePost(true)} />

      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 bg-white dark:bg-gray-950">
        <Outlet />
      </main>

      <MobileNav onCreatePost={() => setShowCreatePost(true)} />

      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  )
}
