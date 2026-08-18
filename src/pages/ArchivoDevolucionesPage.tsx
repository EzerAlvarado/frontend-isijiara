import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react'
import {
  fechaLimiteDisplay,
  fechaLimiteDevolucionDisplay,
  fetchDevoluciones,
} from '../api/devoluciones'
import { SearchInput } from '../components/ui/SearchInput'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { Devolucion } from '../types'
import { detalleMultaDevolucion, multaDevolucion } from '../utils/multa'
import { useAuth } from '../context/AuthContext'
import { usePerfilVestido } from '../context/PerfilVestidoContext'
import { rutaVestidos } from '../utils/perfilVestido'

function formatMoney(amount: number) {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

interface MesArchivo {
  key: string
  label: string
  year: number
  month: number
}

function mesKeyDesdeFecha(fecha: string): string | null {
  const match = fecha.match(/^(\d{4})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}`
  return null
}

function parseMesArchivo(key: string): MesArchivo | null {
  const match = key.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const fecha = new Date(year, month - 1, 1)
  const label = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  return { key, label: label.charAt(0).toUpperCase() + label.slice(1), year, month }
}

function mesesArchivoDevoluciones(devoluciones: Devolucion[]): MesArchivo[] {
  const keys = new Set<string>()
  for (const d of devoluciones) {
    const k = mesKeyDesdeFecha(d.fechaLimite)
    if (k) keys.add(k)
  }
  return Array.from(keys)
    .sort((a, b) => b.localeCompare(a))
    .map(parseMesArchivo)
    .filter((m): m is MesArchivo => m !== null)
}

function devolucionEnMes(d: Devolucion, mesKey: string): boolean {
  const k = mesKeyDesdeFecha(d.fechaLimite)
  return k === mesKey
}

export function ArchivoDevolucionesPage() {
  const { usuario } = useAuth()
  const { perfilSlug, tipoVestido } = usePerfilVestido()
  const esVestidos = usuario?.lineaNegocio === 'vestidos'
  const rutaDevoluciones = esVestidos
    ? rutaVestidos(perfilSlug, 'devoluciones')
    : '/devoluciones'

  const [searchParams, setSearchParams] = useSearchParams()
  const mesParam = searchParams.get('mes')

  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const mesSeleccionado = useMemo(
    () => (mesParam ? parseMesArchivo(mesParam) : null),
    [mesParam],
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await fetchDevoluciones(
        esVestidos ? { categoria_vestido: tipoVestido } : undefined,
      )
      // Solo las regresadas van al archivo
      setDevoluciones(data.filter((d) => d.estatus === 'regresado'))
    } catch {
      setError('No se pudieron cargar las devoluciones.')
    } finally {
      setCargando(false)
    }
  }, [esVestidos, tipoVestido])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    setSearch('')
  }, [mesParam])

  const meses = useMemo(() => mesesArchivoDevoluciones(devoluciones), [devoluciones])

  const devolucionesDelMes = useMemo(() => {
    if (!mesSeleccionado) return []
    let lista = devoluciones.filter((d) => devolucionEnMes(d, mesSeleccionado.key))
    if (search) {
      const q = search.toLowerCase()
      lista = lista.filter((d) =>
        [d.id, d.rentaId, d.cliente, d.prendaNombre, d.prendaId ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    return lista.sort((a, b) => b.fechaLimite.localeCompare(a.fechaLimite))
  }, [mesSeleccionado, devoluciones, search])

  const conteoMes = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of devoluciones) {
      const k = mesKeyDesdeFecha(d.fechaLimite)
      if (k) map.set(k, (map.get(k) ?? 0) + 1)
    }
    return map
  }, [devoluciones])

  const totalMultasMes = devolucionesDelMes.reduce(
    (sum, d) => sum + (d.multaPerdonada ? 0 : d.penalizacion),
    0,
  )

  const abrirMes = (key: string) => setSearchParams({ mes: key })
  const volverAMeses = () => setSearchParams({})

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          {mesSeleccionado ? (
            <>
              <button
                type="button"
                onClick={volverAMeses}
                className="mb-2 flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Todos los meses
              </button>
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                {mesSeleccionado.label}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {devolucionesDelMes.length} devoluciones · solo lectura
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                Archivo de devoluciones
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Historial de devoluciones completadas
                {meses.length > 0 && (
                  <span className="ml-1 text-xs">
                    ({meses.length} {meses.length === 1 ? 'mes' : 'meses'} disponibles)
                  </span>
                )}
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={rutaDevoluciones} className="btn-secondary">
            Devoluciones activas
          </Link>
          <button type="button" onClick={cargar} className="btn-secondary" title="Recargar">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="card px-6 py-12 text-center text-sm text-gray-500">
          Cargando archivo…
        </div>
      ) : !mesSeleccionado ? (
        <div className="card p-6">
          {meses.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              <Calendar className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              No hay devoluciones archivadas.
              <div className="mt-2">
                <Link to={rutaDevoluciones} className="text-brand-600 hover:underline">
                  Ver devoluciones activas
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {meses.map((mes) => {
                const count = conteoMes.get(mes.key) ?? 0
                return (
                  <button
                    key={mes.key}
                    type="button"
                    onClick={() => abrirMes(mes.key)}
                    className="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-400 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-100">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-bold uppercase tracking-tight text-gray-900">
                      {mes.label}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-semibold text-brand-700">{count}</span>{' '}
                      {count === 1 ? 'devolución' : 'devoluciones'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              {mesSeleccionado.label}
            </h3>
            <SearchInput value={search} onChange={setSearch} className="w-48" />
          </div>

          {devolucionesDelMes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No hay devoluciones en este mes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">Renta</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Prenda</th>
                    <th className="px-4 py-3">Entrega</th>
                    <th className="px-4 py-3">Fecha límite</th>
                    <th className="px-4 py-3">Estatus</th>
                    <th className="px-4 py-3">Multa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devolucionesDelMes.map((d) => {
                    const multa = multaDevolucion(d)
                    const detalle = detalleMultaDevolucion(d)
                    return (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">#{d.rentaId}</td>
                        <td className="px-4 py-3 uppercase">{d.cliente}</td>
                        <td className="px-4 py-3">
                          <span className="uppercase">{d.prendaNombre}</span>
                          {d.prendaId && (
                            <span className="ml-1 text-xs text-gray-500">(#{d.prendaId})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {d.fechaEntrega ? fechaLimiteDisplay(d.fechaEntrega) : '—'}
                        </td>
                        <td className="px-4 py-3">{fechaLimiteDevolucionDisplay(d)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={d.estatus} variant="devolucion" />
                          {d.multaPerdonada && (
                            <span className="ml-1 text-xs text-gray-500">(perdonada)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {multa > 0 ? (
                            <div>
                              <span
                                className={
                                  d.multaPerdonada
                                    ? 'text-gray-400 line-through'
                                    : 'font-semibold text-red-600'
                                }
                              >
                                {formatMoney(multa)}
                              </span>
                              {detalle && !d.multaPerdonada && (
                                <p className="text-[11px] text-gray-500">
                                  {detalle.dias} día{detalle.dias !== 1 ? 's' : ''} ×{' '}
                                  {formatMoney(detalle.tarifa)}
                                </p>
                              )}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {devolucionesDelMes.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-xs text-gray-500">
                {devolucionesDelMes.length}{' '}
                {devolucionesDelMes.length === 1 ? 'devolución' : 'devoluciones'}
              </p>
              <p className="text-sm font-medium text-gray-700">
                Total multas cobradas:{' '}
                <span className="text-red-600">{formatMoney(totalMultasMes)}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
