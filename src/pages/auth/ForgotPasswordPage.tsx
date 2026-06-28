import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Zap, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Digite seu email')

    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)

    if (error) {
      toast.error('Erro ao enviar email. Verifique o endereço.')
    } else {
      setSent(true)
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email enviado!</h2>
              <p className="text-slate-600 dark:text-gray-400 text-sm">
                Enviamos um link de recuperação para <strong className="text-slate-900 dark:text-white">{email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>
              <Button
                variant="outline"
                className="w-full border-slate-200 text-slate-900 hover:bg-slate-100 dark:border-gray-800 dark:text-white dark:hover:bg-white/5"
                onClick={() => setSent(false)}
              >
                Reenviar email
              </Button>
              <Link to="/login">
                <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Recuperar senha</h2>
              <p className="text-slate-600 dark:text-gray-400 text-sm mb-6">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                      Enviando...
                    </span>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white text-sm flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
