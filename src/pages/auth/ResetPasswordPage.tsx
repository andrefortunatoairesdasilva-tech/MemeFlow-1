import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Lock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Senha deve ter ao menos 6 caracteres')
    if (password !== confirmPassword) return toast.error('Senhas não coincidem')

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      toast.error('Erro ao redefinir senha. Tente novamente.')
    } else {
      setDone(true)
      setTimeout(() => navigate('/'), 3000)
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
        </div>

        <div className="bg-white dark:bg-gray-900 backdrop-blur-xl border border-slate-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Senha redefinida!</h2>
              <p className="text-slate-600 dark:text-gray-400 text-sm">
                Sua senha foi atualizada com sucesso. Redirecionando...
              </p>
              <div className="w-4 h-4 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Nova senha</h2>
              <p className="text-slate-600 dark:text-gray-400 text-sm mb-6">Escolha uma nova senha segura.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-300">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mín. 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
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
                  <Label className="text-gray-300">Confirmar nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>

                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= i * 2
                              ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-yellow-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-400'
                              : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {password.length < 6 ? 'Fraca' : password.length < 8 ? 'Regular' : password.length < 12 ? 'Boa' : 'Forte'}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Redefinindo...
                    </span>
                  ) : (
                    'Redefinir senha'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
