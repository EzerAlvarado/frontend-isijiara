import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, HelpCircle } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePerfilVestido } from '../../context/PerfilVestidoContext'
import { fetchDevoluciones, fechaLimiteDisplay } from '../../api/devoluciones'
import { LINEA_LOGOS, LINEA_TITULOS } from '../../types/auth'
import type { Devolucion } from '../../types'
import { detalleMultaDevolucion } from '../../utils/multa'
import {
  PERFILES_VESTIDO,
  etiquetaPerfilLegible,
  paginaPerfilDesdePath,
  rutaVestidos,
  type PerfilVestidoSlug,
} from '../../utils/perfilVestido'

function HeaderPanel({
  open,
  onClose,
  align,
  children,
  className = '',
}: {
  open: boolean
  onClose: () => void
  align: 'left' | 'right'
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={`absolute top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function useAvisosRetraso(enabled: boolean, categoriaVestido?: string) {
  const [retrasadas, setRetrasadas] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async () => {
    if (!enabled) return
    setCargando(true)
    try {
      const data = await fetchDevoluciones({
        estatus: 'retrasado',
        ...(categoriaVestido ? { categoria_vestido: categoriaVestido } : {}),
      })
      setRetrasadas(data)
    } catch {
      setRetrasadas([])
    } finally {
      setCargando(false)
    }
  }, [enabled, categoriaVestido])

  useEffect(() => {
    cargar()
    const id = window.setInterval(cargar, 60_000)
    return () => window.clearInterval(id)
  }, [cargar])

  return { retrasadas, cargando, recargar: cargar }
}

function PerfilVestidoSwitcher({
  perfilActivo,
  paginaActual,
}: {
  perfilActivo: PerfilVestidoSlug
  paginaActual: 'rentas' | 'inventario' | 'archivo-rentas'
}) {
  return (
    <nav
      className="ml-3 flex items-center gap-1 rounded-lg border border-pink-300/60 bg-white/70 p-0.5"
      aria-label="Cambiar perfil de vestidos"
    >
      {PERFILES_VESTIDO.map((slug) => (
        <NavLink
          key={slug}
          to={rutaVestidos(slug, paginaActual)}
          className={({ isActive }) =>
            `rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
              isActive || slug === perfilActivo
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-pink-900/70 hover:bg-pink-50 hover:text-pink-900'
            }`
          }
        >
          {etiquetaPerfilLegible(slug)}
        </NavLink>
      ))}
    </nav>
  )
}

export function Header() {
  const { usuario } = useAuth()
  const { perfilSlug, etiquetaPerfil, tipoVestido } = usePerfilVestido()
  const location = useLocation()
  const linea = usuario?.lineaNegocio
  const titulo = linea ? LINEA_TITULOS[linea] : 'Sistema ISIJARA'
  const logoSrc = linea ? LINEA_LOGOS[linea] : null

  const [panelInfo, setPanelInfo] = useState(false)
  const [panelAvisos, setPanelAvisos] = useState(false)
  const { retrasadas, cargando, recargar } = useAvisosRetraso(
    !!usuario,
    linea === 'vestidos' ? tipoVestido : undefined,
  )

  const abrirInfo = () => {
    setPanelAvisos(false)
    setPanelInfo((v) => !v)
  }

  const abrirAvisos = () => {
    setPanelInfo(false)
    setPanelAvisos((v) => {
      if (!v) recargar()
      return !v
    })
  }

  const esVestidos = linea === 'vestidos'
  const paginaPerfil = paginaPerfilDesdePath(location.pathname) ?? 'rentas'
  const mostrarPerfil = esVestidos
  const perfilBloqueado = !!usuario?.perfilVestido

  return (
    <header
      className={`flex h-16 items-center justify-between border-b px-6 ${
        esVestidos ? 'border-pink-200 bg-pink-100' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex min-w-0 items-center">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={titulo}
            className={
              esVestidos
                ? 'h-12 w-auto max-w-[min(100%,480px)] rounded object-contain object-left'
                : 'h-11 w-auto max-w-[min(100%,420px)] object-contain object-left'
            }
          />
        ) : (
          <h1 className="text-sm font-bold uppercase tracking-wide text-gray-900">{titulo}</h1>
        )}
        {mostrarPerfil && (
          <>
            <span className="ml-3 rounded-md border border-pink-400/70 bg-pink-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
              {etiquetaPerfil}
            </span>
            {!perfilBloqueado && (
              <PerfilVestidoSwitcher perfilActivo={perfilSlug} paginaActual={paginaPerfil} />
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={abrirInfo}
            className={`rounded-lg p-2 transition-colors ${
              panelInfo ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            aria-label="Información del sistema"
            aria-expanded={panelInfo}
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <HeaderPanel open={panelInfo} onClose={() => setPanelInfo(false)} align="right">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Información
              </p>
            </div>
            <div className="space-y-3 px-4 py-3 text-sm leading-relaxed text-gray-700">
              <p>
                Sistema desarrollado por <span className="font-semibold">Ezer Jehu Alvarado</span>.
                Cualquier problema, comunicarse para un reporte:
              </p>
              <p>
                <a href="tel:6531077410" className="font-medium text-brand-700 hover:underline">
                  653 107 7410
                </a>
                <br />
                <a
                  href="mailto:ezeralvarado@gmail.com"
                  className="font-medium text-brand-700 hover:underline"
                >
                  ezeralvarado@gmail.com
                </a>
              </p>
            </div>
          </HeaderPanel>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={abrirAvisos}
            className={`relative rounded-lg p-2 transition-colors ${
              panelAvisos ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            aria-label="Avisos de atrasos en entregas"
            aria-expanded={panelAvisos}
          >
            <Bell className="h-5 w-5" />
            {retrasadas.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {retrasadas.length > 9 ? '9+' : retrasadas.length}
              </span>
            )}
          </button>
          <HeaderPanel open={panelAvisos} onClose={() => setPanelAvisos(false)} align="right">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Atrasos en entregas
              </p>
              <Link
                to="/devoluciones"
                onClick={() => setPanelAvisos(false)}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Ver todo
              </Link>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {cargando && retrasadas.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">Cargando avisos…</p>
              ) : retrasadas.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  Sin atrasos registrados. Las devoluciones pasan a retrasado al vencer la fecha
                  límite.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {retrasadas.map((d) => {
                    const detalle = detalleMultaDevolucion(d)
                    return (
                      <li key={d.id}>
                        <Link
                          to="/devoluciones"
                          onClick={() => setPanelAvisos(false)}
                          className="block px-4 py-3 transition-colors hover:bg-red-50/60"
                        >
                          <p className="text-sm font-semibold text-red-800">
                            Renta #{d.rentaId} · {d.cliente}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600">{d.prendaNombre}</p>
                          <p className="mt-1 text-xs text-red-700">
                            Límite {fechaLimiteDisplay(d.fechaLimite)}
                            {detalle
                              ? ` · ${detalle.dias} día(s) · multa $${detalle.monto.toLocaleString('es-MX')}`
                              : ''}
                          </p>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </HeaderPanel>
        </div>
      </div>
    </header>
  )
}
