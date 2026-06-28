import { Toaster } from 'react-hot-toast'
import { useTheme } from '@/contexts/ThemeContext'

export function ToastProvider() {
  const { theme } = useTheme()

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: theme === 'dark' ? '#1f2937' : '#ffffff',
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#7C3AED',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  )
}
