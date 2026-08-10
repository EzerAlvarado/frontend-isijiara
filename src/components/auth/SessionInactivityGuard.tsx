import { useAuth } from '../../context/AuthContext'
import { useSessionInactivity } from '../../hooks/useSessionInactivity'

export function SessionInactivityGuard() {
  const { autenticado, logout } = useAuth()
  const { mostrarAviso, extenderSesion, minutosRestantes } = useSessionInactivity(
    autenticado,
    logout,
  )

  if (!mostrarAviso) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900">Sesión por expirar</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Llevas un rato sin actividad. La sesión se cerrará en unos {minutosRestantes} minutos
          por seguridad.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
          <button
            type="button"
            onClick={extenderSesion}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Seguir conectado
          </button>
        </div>
      </div>
    </div>
  )
}
