import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import FeedPage from '@/pages/FeedPage'
import ExplorePage from '@/pages/ExplorePage'
import ProfilePage from '@/pages/ProfilePage'
import ChatPage from '@/pages/ChatPage'
import NotificationsPage from '@/pages/NotificationsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider />
        <BrowserRouter>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected app routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<FeedPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:conversationId" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/user/:username" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
