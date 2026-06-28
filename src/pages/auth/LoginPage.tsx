import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Preencha todos os campos')

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      const msg = error.message?.toLowerCase()
      if (msg?.includes('invalid') || msg?.includes('credentials')) {
        toast.error('Email ou senha incorretos')
      } else if (msg?.includes('email not confirmed')) {
        toast.error('Confirme seu email antes de entrar')
      } else {
        toast.error('Erro ao entrar. Tente novamente.')
      }
    } else {
      toast.success('Bem-vindo de volta!')
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600 shadow-2xl shadow-purple-500/40 mb-4">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            MemeFlow
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1 text-sm">Onde os memes ganham vida</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 backdrop-blur-xl border border-slate-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Entrar na conta</h2>
          <p className="text-slate-600 dark:text-gray-400 text-sm mb-6">Bem-vindo de volta!</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Não tem conta?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
