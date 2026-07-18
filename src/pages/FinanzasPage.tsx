import { useCallback, useEffect, useState } from 'react'
import { Clock, Coins, DollarSign, Plus, RefreshCw, Save, Shirt, Trash2 } from 'lucide-react'
import { useFinanzas } from '../context/FinanzasContext'
import { useAuth } from '../context/AuthContext'
import type { PrecioReferencia } from '../api/finanzas'
import { fmtMontoConDlls, getTipoCambioMxUsd } from '../utils/tipoCambio'

function formatMoney(amount: number) {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function nuevoId() {
  return `precio-${Date.now()}`
}

export function FinanzasPage() {
  const { usuario } = useAuth()
  const esTrajes = usuario?.lineaNegocio !== 'vestidos'
  const {
    cargando,
    error,
    recargar,
    guardar,
    tipoCambioUsd,
    multaPorDia,
    fondoFeria,
    preciosReferencia,
    usarCodigosNuevosPantalon,
  } = useFinanzas()
  const [tipoCambioEdit, setTipoCambioEdit] = useState('')
  const [multaPorDiaEdit, setMultaPorDiaEdit] = useState('')
  const [fondoFeriaEdit, setFondoFeriaEdit] = useState('')
  const [usarCodigosNuevosEdit, setUsarCodigosNuevosEdit] = useState(false)
  const [preciosEdit, setPreciosEdit] = useState<PrecioReferencia[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  useEffect(() => {
    setTipoCambioEdit(String(tipoCambioUsd))
    setMultaPorDiaEdit(String(multaPorDia))
    setFondoFeriaEdit(String(fondoFeria))
    setUsarCodigosNuevosEdit(usarCodigosNuevosPantalon)
    setPreciosEdit(preciosReferencia.map((p) => ({ ...p })))
  }, [tipoCambioUsd, multaPorDia, fondoFeria, usarCodigosNuevosPantalon, preciosReferencia])

  const actualizarPrecio = (id: string, campo: 'nombre' | 'precioMxn', valor: string) => {
    setPreciosEdit((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              [campo]: campo === 'precioMxn' ? Number(valor) || 0 : valor,
            }
          : p,
      ),
    )
  }

  const agregarPrecio = () => {
    setPreciosEdit((prev) => [
      ...prev,
      { id: nuevoId(), nombre: 'Nuevo concepto', precioMxn: 0 },
    ])
  }

  const eliminarPrecio = (id: string) => {
    setPreciosEdit((prev) => prev.filter((p) => p.id !== id))
  }

  const guardarCambios = useCallback(async () => {
    const tc = Number(tipoCambioEdit)
    const multa = Number(multaPorDiaEdit)
    const fondo = Number(fondoFeriaEdit)
    if (!tc || tc <= 0) {
      setErrorLocal('El tipo de cambio debe ser mayor a cero.')
      return
    }
    if (Number.isNaN(multa) || multa < 0) {
      setErrorLocal('La multa por día no puede ser negativa.')
      return
    }
    if (Number.isNaN(fondo) || fondo < 0) {
      setErrorLocal('El fondo de feria no puede ser negativo.')
      return
    }
    if (preciosEdit.length === 0) {
      setErrorLocal('Debe haber al menos un precio de referencia.')
      return
    }
    if (preciosEdit.some((p) => !p.nombre.trim())) {
      setErrorLocal('Todos los conceptos deben tener nombre.')
      return
    }

    setGuardando(true)
    setErrorLocal(null)
    setMensaje(null)
    try {
      await guardar({
        tipoCambioUsd: tc,
        multaPorDia: multa,
        fondoFeria: fondo,
        preciosReferencia: preciosEdit.map((p) => ({
          id: p.id,
          nombre: p.nombre.trim(),
          precioMxn: Number(p.precioMxn) || 0,
        })),
        ...(esTrajes ? { usarCodigosNuevosPantalon: usarCodigosNuevosEdit } : {}),
      })
      setMensaje('Configuración guardada.')
    } catch {
      setErrorLocal('No se pudo guardar. Verifica que el servidor esté activo.')
    } finally {
      setGuardando(false)
    }
  }, [tipoCambioEdit, multaPorDiaEdit, fondoFeriaEdit, preciosEdit, usarCodigosNuevosEdit, esTrajes, guardar])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Finanzas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Precios de referencia, tipo de cambio, fondo de feria y multas por retraso.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={recargar} disabled={cargando} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={guardarCambios} disabled={guardando || cargando} className="btn-primary">
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </div>

      {(error || errorLocal) && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorLocal ?? error}
        </p>
      )}
      {mensaje && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {mensaje}
        </p>
      )}

      {cargando && preciosEdit.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">Cargando finanzas…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                    Tipo de cambio
                  </h3>
                  <p className="text-xs text-gray-500">1 USD = ? MXN</p>
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                  Pesos por dólar
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input-field"
                  value={tipoCambioEdit}
                  onChange={(e) => setTipoCambioEdit(e.target.value)}
                  placeholder="18.50"
                />
              </label>
              <p className="mt-3 text-xs text-gray-500">
                Se usa en anticipos DLLS, conversiones del recibo y totales del corte del día.
              </p>
              {Number(tipoCambioEdit) > 0 && (
                <p className="mt-2 text-sm text-gray-700">
                  Ejemplo: $100 USD ≈ {formatMoney(Number(tipoCambioEdit) * 100)} MXN
                </p>
              )}
            </section>

            <section className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                    Fondo de feria
                  </h3>
                  <p className="text-xs text-gray-500">Cambio que se deja en caja</p>
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                  Monto en caja (MXN)
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="input-field"
                  value={fondoFeriaEdit}
                  onChange={(e) => setFondoFeriaEdit(e.target.value)}
                  placeholder="2732"
                />
              </label>
              <p className="mt-3 text-xs text-gray-500">
                Se usa como valor por defecto al abrir el corte del día. Puedes ajustarlo también
                en cada jornada.
              </p>
              {Number(fondoFeriaEdit) >= 0 && (
                <p className="mt-2 text-sm text-gray-700">
                  Valor configurado: {formatMoney(Number(fondoFeriaEdit) || 0)}
                </p>
              )}
            </section>

            <section className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                    Multa por retraso
                  </h3>
                  <p className="text-xs text-gray-500">Por cada día después del plazo</p>
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                  Monto por día (MXN)
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="input-field"
                  value={multaPorDiaEdit}
                  onChange={(e) => setMultaPorDiaEdit(e.target.value)}
                  placeholder="15"
                />
              </label>
              <p className="mt-3 text-xs text-gray-500">
                Se calcula automáticamente en devoluciones retrasadas y se registra al marcar
                regresado.
              </p>
              {Number(multaPorDiaEdit) >= 0 && (
                <p className="mt-2 text-sm text-gray-700">
                  Ejemplo: 3 días de retraso = {formatMoney(Number(multaPorDiaEdit) * 3)}
                </p>
              )}
            </section>

            {esTrajes && (
              <section className="card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Shirt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                      Códigos de pantalón
                    </h3>
                    <p className="text-xs text-gray-500">Formato en rentas: talla#código</p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={usarCodigosNuevosEdit}
                    onChange={(e) => setUsarCodigosNuevosEdit(e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Usar códigos nuevos en pantalón
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Desactivado: se muestra el código viejo si existe; si no, el nuevo. Solo
                      aplica a trajes (vestidos no se modifican).
                    </span>
                  </span>
                </label>
              </section>
            )}
          </div>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                  Precios aproximados de renta
                </h3>
                <p className="text-xs text-gray-500">
                  Referencia para el equipo; no se aplican automáticamente al crear rentas.
                </p>
              </div>
              <button type="button" onClick={agregarPrecio} className="btn-secondary text-xs">
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3 w-36">Precio MXN</th>
                    <th className="px-4 py-3 w-40">Equiv. USD</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preciosEdit.map((p) => {
                    const tc = Number(tipoCambioEdit) || getTipoCambioMxUsd()
                    const usd =
                      tc > 0 ? Math.round((p.precioMxn / tc) * 100) / 100 : 0
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            className="input-field uppercase"
                            value={p.nombre}
                            onChange={(e) => actualizarPrecio(p.id, 'nombre', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="input-field"
                            value={p.precioMxn || ''}
                            onChange={(e) => actualizarPrecio(p.id, 'precioMxn', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.precioMxn > 0 ? (
                            <span title={fmtMontoConDlls(p.precioMxn)}>
                              ≈ ${usd} USD
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => eliminarPrecio(p.id)}
                            title="Eliminar"
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            disabled={preciosEdit.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
