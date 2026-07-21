import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import {
  esDevolucionPendiente,
  fechaLimiteDevolucionDisplay,
  fetchDevoluciones,
  updateDevolucion,
} from '../api/devoluciones'
import { SearchInput } from '../components/ui/SearchInput'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Modal } from '../components/ui/Modal'
import type { Devolucion } from '../types'
import { detalleMultaDevolucion, multaDevolucion } from '../utils/multa'
import { useAuth } from '../context/AuthContext'
import { usePerfilVestido } from '../context/PerfilVestidoContext'

function formatMoney(amount: number) {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

export function DevolucionesPage() {
  const { usuario } = useAuth()
  const { tipoVestido } = usePerfilVestido()
  const esVestidos = usuario?.lineaNegocio === 'vestidos'
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [procesando, setProcesando] = useState<Devolucion | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [multaPerdonada, setMultaPerdonada] = useState(false)
  const [cargoDanos, setCargoDanos] = useState('')
  const [notaDanos, setNotaDanos] = useState('')
  const [confirmandoSalio, setConfirmandoSalio] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await fetchDevoluciones(
        esVestidos ? { categoria_vestido: tipoVestido } : undefined,
      )
      setDevoluciones(data)
    } catch {
      setError('No se pudieron cargar las devoluciones.')
    } finally {
      setCargando(false)
    }
  }, [esVestidos, tipoVestido])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtradas = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return devoluciones
    return devoluciones.filter((d) =>
      [d.id, d.rentaId, d.cliente, d.prendaNombre, d.prendaId ?? '', d.estatus]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [devoluciones, search])

  const retrasadas = useMemo(
    () => filtradas.filter((d) => d.estatus === 'retrasado'),
    [filtradas],
  )

  const abrirDevolucion = async (d: Devolucion) => {
    setMultaPerdonada(false)
    setCargoDanos('')
    setNotaDanos('')
    setProcesando(d)
    try {
      const lista = await fetchDevoluciones({ renta_id: d.rentaId })
      const actualizada = lista.find((x) => x.id === d.id)
      if (actualizada) {
        setProcesando(actualizada)
        setDevoluciones((prev) =>
          prev.map((item) => (item.id === actualizada.id ? actualizada : item)),
        )
      }
    } catch {
      /* mantener datos locales */
    }
  }

  const confirmarRegresado = async (confirmarSalio = false) => {
    if (!procesando) return
    setGuardando(true)
    try {
      const cargo = Number.parseFloat(cargoDanos.replace(',', '.')) || 0
      const actualizada = await updateDevolucion(procesando.id, {
        estatus: 'regresado',
        multaPerdonada: multaPerdonada,
        cargoDanos: cargo > 0 ? cargo : 0,
        notaDanos: notaDanos.trim(),
        ...(confirmarSalio ? { confirmarSalio: true } : {}),
      })
      setDevoluciones((prev) => prev.map((d) => (d.id === actualizada.id ? actualizada : d)))
      setProcesando(null)
      setConfirmandoSalio(false)
      setMultaPerdonada(false)
      setCargoDanos('')
      setNotaDanos('')
    } catch {
      setError('No se pudo registrar la devolución.')
    } finally {
      setGuardando(false)
    }
  }

  const solicitarRegresado = () => {
    if (!procesando) return
    if (procesando.estatus === 'revisar_salida') {
      setConfirmandoSalio(true)
      return
    }
    void confirmarRegresado(false)
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Devoluciones</h2>
          <p className="mt-1 text-sm text-gray-500">
            {cargando ? 'Cargando…' : `${filtradas.length} devoluciones registradas`}
            {retrasadas.length > 0 && (
              <span className="ml-2 font-medium text-red-600">
                · {retrasadas.length} retrasada{retrasadas.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button type="button" onClick={cargar} disabled={cargando} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {retrasadas.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Devoluciones retrasadas</p>
              <p className="mt-1 text-sm text-red-700">
                Se marcan solos como retrasado al pasar la fecha límite.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {retrasadas.map((d) => {
                  const detalle = detalleMultaDevolucion(d)
                  return (
                    <li key={d.id}>
                      Renta #{d.rentaId} — {d.cliente}: límite {fechaLimiteDevolucionDisplay(d)}
                      {detalle && (
                        <span className="font-semibold">
                          {' '}
                          · debe pagar {formatMoney(detalle.monto)} ({detalle.dias} día
                          {detalle.dias !== 1 ? 's' : ''} × {formatMoney(detalle.tarifa)})
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Afuera, retrasadas y regresadas
          </h3>
          <SearchInput value={search} onChange={setSearch} className="w-56" />
        </div>

        <div className="overflow-x-auto">
          {cargando && devoluciones.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">Cargando devoluciones…</p>
          ) : filtradas.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No hay devoluciones. Se crean al guardar una renta con piezas del inventario.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Renta</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Prenda</th>
                  <th className="px-4 py-3">Fecha salida</th>
                  <th className="px-4 py-3">Fecha límite</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3">Multa</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map((d) => {
                  const pendiente = esDevolucionPendiente(d.estatus)
                  const multa = multaDevolucion(d)
                  const detalle = detalleMultaDevolucion(d)
                  return (
                    <tr
                      key={d.id}
                      className={
                        d.estatus === 'retrasado'
                          ? 'bg-red-50/60'
                          : d.estatus === 'revisar_salida'
                            ? 'bg-amber-50/50'
                            : 'hover:bg-gray-50'
                      }
                    >
                      <td className="px-4 py-3 font-medium">#{d.rentaId}</td>
                      <td className="px-4 py-3 uppercase">{d.cliente}</td>
                      <td className="px-4 py-3">
                        <span className="uppercase">{d.prendaNombre}</span>
                        {d.prendaId && (
                          <span className="ml-1 text-xs text-gray-500">(#{d.prendaId})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{d.fechaSalioReal || '—'}</td>
                      <td className="px-4 py-3">{fechaLimiteDevolucionDisplay(d)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.estatus} variant="devolucion" />
                      </td>
                      <td className="px-4 py-3">
                        {multa > 0 ? (
                          <div>
                            <span className="font-semibold text-red-600">{formatMoney(multa)}</span>
                            {detalle && (
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
                      <td className="px-4 py-3">
                        {pendiente ? (
                          <button
                            type="button"
                            onClick={() => abrirDevolucion(d)}
                            className="text-xs font-semibold uppercase text-brand-700 hover:underline"
                          >
                            Marcar regresado
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Regresado
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={procesando != null}
        onClose={() => {
          if (guardando) return
          setProcesando(null)
          setConfirmandoSalio(false)
          setMultaPerdonada(false)
          setCargoDanos('')
          setNotaDanos('')
        }}
        title="Registrar devolución"
      >
        {procesando && (() => {
          const detalle = detalleMultaDevolucion(procesando)
          const multaActiva = detalle && detalle.monto > 0 && !multaPerdonada
          const cargoNumerico = Number.parseFloat(cargoDanos.replace(',', '.')) || 0
          const hayDanos = cargoNumerico > 0 || notaDanos.trim().length > 0
          return (
          <div className="space-y-4">
            {confirmandoSalio ? (
              <>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-900">
                    ¿El cliente ya recogió la prenda?
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    Esta renta aún no está marcada como salió en Rentas. Al confirmar, se registrará
                    la fecha de salida de hoy y se continuará con la devolución.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    disabled={guardando}
                    onClick={() => setConfirmandoSalio(false)}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1"
                    disabled={guardando}
                    onClick={() => void confirmarRegresado(true)}
                  >
                    {guardando ? 'Guardando…' : 'Sí, ya recogió'}
                  </button>
                </div>
              </>
            ) : (
              <>
            <p className="text-sm text-gray-600">
              Renta <strong>#{procesando.rentaId}</strong> — {procesando.cliente}
            </p>
            {procesando.estatus === 'revisar_salida' && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Aún no se ha confirmado la salida de la prenda. Marca la fila en azul en Rentas o confirma
                al registrar la devolución.
              </p>
            )}
            <p className="text-sm">
              <span className="font-medium">Prenda:</span> {procesando.prendaNombre}
            </p>
            <p className="text-sm">
              <span className="font-medium">Fecha límite:</span>{' '}
              {fechaLimiteDevolucionDisplay(procesando)}
            </p>
            {detalle ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-800">
                  {procesando.estatus === 'retrasado'
                    ? 'Esta renta está retrasada'
                    : 'Atraso en la devolución'}
                </p>
                {multaPerdonada ? (
                  <>
                    <p className="mt-2 text-lg font-bold text-gray-700 line-through">
                      {formatMoney(detalle.monto)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-green-700">
                      Multa perdonada — no se registrará en el corte.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-lg font-bold text-red-700">
                      Debe pagar: {formatMoney(detalle.monto)}
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      {detalle.dias} día{detalle.dias !== 1 ? 's' : ''} de retraso ×{' '}
                      {formatMoney(detalle.tarifa)} por día
                    </p>
                    <button
                      type="button"
                      className="btn-secondary mt-3 w-full text-xs uppercase"
                      disabled={guardando}
                      onClick={() => setMultaPerdonada(true)}
                    >
                      Perdonar multa
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Sin multa — aún está dentro del plazo de regreso.
              </p>
            )}

            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">Daños en la prenda</p>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Precio por daños</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={cargoDanos}
                  disabled={guardando}
                  onChange={(e) => setCargoDanos(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Nota de daños (opcional)</span>
                <textarea
                  rows={2}
                  placeholder="Ej. mancha en saco, cierre roto…"
                  value={notaDanos}
                  disabled={guardando}
                  onChange={(e) => setNotaDanos(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              {hayDanos && (
                <p className="text-xs text-amber-700">
                  Las piezas irán a mantenimiento en inventario
                  {cargoNumerico > 0 && ` y se registrará ${formatMoney(cargoNumerico)} en el corte`}.
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Al confirmar, las piezas del inventario se actualizarán según el estado del regreso.
              {multaActiva && ' La multa se registrará en el corte del día.'}
              {!hayDanos && !multaActiva && ' Sin cargos adicionales al corte.'}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={guardando}
                onClick={() => {
                  setProcesando(null)
                  setConfirmandoSalio(false)
                  setMultaPerdonada(false)
                  setCargoDanos('')
                  setNotaDanos('')
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={guardando}
                onClick={solicitarRegresado}
              >
                {guardando ? 'Guardando…' : 'Confirmar regresado'}
              </button>
            </div>
              </>
            )}
          </div>
          )
        })()}
      </Modal>
    </div>
  )
}
