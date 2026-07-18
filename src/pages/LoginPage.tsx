import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LINEA_LABELS } from '../types/auth'
import { PERFIL_VESTIDO_DEFAULT, rutaVestidos } from '../utils/perfilVestido'

const ACCESO_RAPIDO = [
  { user: 'trajes', label: LINEA_LABELS.trajes, password: 'trajes123' },
  { user: 'noche', label: 'Noche', password: 'noche123' },
  { user: 'xv', label: 'XV', password: 'xv123' },
  { user: 'novia', label: 'Novia', password: 'novia123' },
] as const

export function LoginPage() {
  const { login, autenticado, cargando, lineaNegocio, usuario } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const perfilVestido = usuario?.perfilVestido ?? PERFIL_VESTIDO_DEFAULT
  const destinoPorDefecto =
    lineaNegocio === 'vestidos' ? rutaVestidos(perfilVestido, 'rentas') : '/rentas'
  const from = (location.state as { from?: string } | null)?.from ?? destinoPorDefecto

  if (!cargando && autenticado) {
    return <Navigate to={from} replace />
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await login(username.trim().toLowerCase(), password)
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setEnviando(false)
    }
  }

  const elegirUsuario = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-brand-700 shadow-lg">
            V
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
            Sistema ISIJARA
          </h1>
          <p className="mt-2 text-sm text-brand-100">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={enviar} className="card p-6 shadow-xl">
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
              Usuario
            </span>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="trajes, noche, xv o novia"
              autoComplete="username"
              required
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
              Contraseña
            </span>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={enviando} className="btn-primary w-full justify-center">
            <LogIn className="h-4 w-4" />
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-3 text-center text-xs font-semibold uppercase text-gray-500">
              Acceso rápido
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ACCESO_RAPIDO.map(({ user, label, password: pass }) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => elegirUsuario(user, pass)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
