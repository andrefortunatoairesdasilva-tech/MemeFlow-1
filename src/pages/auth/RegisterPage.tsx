import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Mail, Lock, User, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateForm = () => {
    if (!form.email || !form.password || !form.username || !form.displayName) {
      toast.error('Preencha todos os campos')
      return false
    }
    if (form.username.length < 3) {
      toast.error('Username deve ter ao menos 3 caracteres')
      return false
    }
    if (!/^[a-z0-9_]+$/.test(form.username)) {
      toast.error('Username: apenas letras minúsculas, números e _')
      return false
    }
    if (form.password.length < 6) {
      toast.error('Senha deve ter ao menos 6 caracteres')
      return false
    }
    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não coincidem')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.username, form.displayName)
    setLoading(false)

    if (error) {
      const msg = error.message?.toLowerCase()
      if (msg?.includes('already registered') || msg?.includes('already exists')) {
        toast.error('Este email já está em uso')
      } else if (msg?.includes('username')) {
        toast.error('Este username já está em uso')
      } else if (msg?.includes('password')) {
        toast.error('Senha muito fraca. Use ao menos 6 caracteres')
      } else {
        toast.error('Erro ao criar conta. Tente novamente.')
      }
    } else {
      toast.success('Conta criada! Verifique seu email', { duration: 5000 })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600 shadow-2xl shadow-purple-500/40 mb-4">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            MemeFlow
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1 text-sm">Entre para a comunidade mais engraçada</p>
        </div>

        <div className="bg-white dark:bg-gray-900 backdrop-blur-xl border border-slate-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Criar conta grátis</h2>
          <p className="text-slate-600 dark:text-gray-400 text-sm mb-6">Comece a compartilhar memes agora!</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Nome de exibição</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  name="displayName"
                  type="text"
                  placeholder="Seu nome"
                  value={form.displayName}
                  onChange={handleChange}
                  className="pl-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  name="username"
                  type="text"
                  placeholder="seu_username"
                  value={form.username}
                  onChange={e => setForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  className="pl-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Apenas letras minúsculas, números e _</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className="pl-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mín. 6 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoComplete="new-password"
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

            <div className="space-y-1.5">
              <Label className="text-gray-300">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoComplete="new-password"
                  required
                />
              </div>
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
                  Criando conta...
                </span>
              ) : (
                'Criar conta grátis'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Já tem conta?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
