import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { ApiError } from '../api/client'
import {
  actualizarFondoInicial,
  cerrarCorte,
  diaAnterior,
  diaSiguiente,
  fechaCorteDisplay,
  fetchCorte,
  hoyISO,
  registrarGasto,
  reponerVale,
  type CorteDiaResponse,
} from '../api/corte'
import { ConteoCajaModal } from '../components/corte/ConteoCajaModal'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useFinanzas } from '../context/FinanzasContext'
import { usePerfilVestido } from '../context/PerfilVestidoContext'
import { METODOS_PAGO } from '../utils/metodoPago'
import { calcularTotalesConteo } from '../utils/conteoCaja'
import type { ConteoFisico } from '../utils/conteoCaja'
import { conceptoBadgeClass, conceptoTransaccion } from '../utils/conceptoTransaccion'
import { categoriaBackendDesdeSlug } from '../utils/perfilVestido'
import { dllsAPesos, getTipoCambioMxUsd } from '../utils/tipoCambio'
import type { MetodoPago, TurnoCorte } from '../types'

function esGastoFondo(referencia: string) {
  return referencia.toUpperCase().startsWith('G')
}

function formatMoney(amount: number) {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function formatMontoTransaccion(monto: number, pago: string) {
  const abs = Math.abs(monto)
  if (pago === 'dlls') {
    const usd = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    const mxn = formatMoney(dllsAPesos(abs))
    return `${usd} (${mxn})`
  }
  return formatMoney(abs)
}

export function CorteDiaPage() {
  const { fondoFeria } = useFinanzas()
  const { lineaNegocio } = useAuth()
  const { perfilSlug, etiquetaPerfil } = usePerfilVestido()
  const [fecha, setFecha] = useState(hoyISO)
  const [turno, setTurno] = useState<TurnoCorte | null>(null)
  const [corte, setCorte] = useState<CorteDiaResponse | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fondoEdit, setFondoEdit] = useState('')
  const [mostrarGasto, setMostrarGasto] = useState(false)
  const [mostrarConteo, setMostrarConteo] = useState(false)
  const [verConteo, setVerConteo] = useState(false)
  const [mostrarFondoConteo, setMostrarFondoConteo] = useState(false)
  const [fondoConteoReadOnly, setFondoConteoReadOnly] = useState(false)
  const [gastoCliente, setGastoCliente] = useState('Gasto operativo')
  const [gastoMonto, setGastoMonto] = useState('')
  const [gastoPago, setGastoPago] = useState<MetodoPago>('pesos')
  const [guardando, setGuardando] = useState(false)

  const esVestidos = lineaNegocio === 'vestidos'
  const categoriaBackend = esVestidos ? categoriaBackendDesdeSlug(perfilSlug) : undefined

  const turnoActivo = turno ?? corte?.turno ?? 'manana'
  const turnoRef = useRef(turno)
  turnoRef.current = turno

  const cargar = useCallback(async () => {
    const turnoSolicitado = turno
    setCargando(true)
    setError(null)
    try {
      const data = await fetchCorte(fecha, turnoSolicitado ?? undefined, categoriaBackend)
      if (turnoRef.current !== turnoSolicitado) return
      setCorte(data)
      if (turnoSolicitado === null) {
        setTurno(data.turno)
      }
      setFondoEdit(String(data.fondoInicial || ''))
    } catch {
      if (turnoRef.current !== turnoSolicitado) return
      setError('No se pudo cargar el corte. Verifica que el servidor esté activo.')
    } finally {
      if (turnoRef.current === turnoSolicitado) {
        setCargando(false)
      }
    }
  }, [fecha, turno, categoriaBackend])

  useEffect(() => {
    setTurno(null)
  }, [fecha])

  useEffect(() => {
    cargar()
  }, [cargar])

  const resumen = corte?.resumen

  const tieneDesgloseFondo =
    corte &&
    !corte.cerrado &&
    corte.totalesFondo &&
    (corte.totalesFondo.mxnTotal > 0 || corte.totalesFondo.usdTotal > 0)

  const metricas = resumen
    ? [
        {
          label: 'Ingresos Totales (Rentas y Multas)',
          value: resumen.ingresosTotales,
          icon: Banknote,
          color: 'text-green-600 bg-green-50',
        },
        {
          label: corte?.incluyeManana ? 'Caja (mañana + tarde)' : 'Caja del Turno',
          value: resumen.cajaDelDia,
          icon: Banknote,
          color: 'text-emerald-700 bg-emerald-50',
        },
        {
          label: 'Total en Caja (Fondo + Caja)',
          value: resumen.totalEnCaja,
          icon: Banknote,
          color: 'text-green-600 bg-green-50',
        },
        {
          label: 'Gastos del Fondo (Vales)',
          value: resumen.gastosDelFondo,
          icon: Trash2,
          color: 'text-amber-700 bg-amber-50',
        },
        {
          label: 'Ingresos BBVA / Zelle',
          value: resumen.ingresosTarjeta,
          icon: CreditCard,
          color: 'text-blue-600 bg-blue-50',
        },
      ]
    : []

  const fondoConfigurado = corte?.fondoFeriaConfig ?? fondoFeria

  const aplicarFondoConfigurado = async () => {
    if (!corte || corte.cerrado) return
    setFondoEdit(String(fondoConfigurado))
    setGuardando(true)
    try {
      const data = await actualizarFondoInicial(fecha, fondoConfigurado, undefined, turnoActivo, categoriaBackend)
      setCorte(data)
    } catch {
      setError('No se pudo aplicar el fondo configurado.')
    } finally {
      setGuardando(false)
    }
  }

  const guardarFondo = async () => {
    if (!corte || corte.cerrado) return
    setGuardando(true)
    try {
      const data = await actualizarFondoInicial(fecha, Number(fondoEdit) || 0, undefined, turnoActivo, categoriaBackend)
      setCorte(data)
    } catch {
      setError('No se pudo guardar el fondo inicial.')
    } finally {
      setGuardando(false)
    }
  }

  const confirmarFondoConteo = async (conteoFondo: ConteoFisico) => {
    if (!corte || corte.cerrado) return
    const tc = corte.totalesConteo?.tipoCambioUsd ?? getTipoCambioMxUsd()
    const totales = calcularTotalesConteo(conteoFondo)
    const fondoMxn = totales.mxnTotal + totales.usdTotal * tc
    const pendingTotal = corte.valesPendientes.reduce((s, v) => s + v.montoMxn, 0)
    const valesEnConteo = conteoFondo.valesMxn ?? 0
    let montoAReponer = pendingTotal - valesEnConteo

    setGuardando(true)
    try {
      let data = await actualizarFondoInicial(fecha, fondoMxn, conteoFondo, turnoActivo, categoriaBackend)
      const valesOrdenados = [...corte.valesPendientes].sort((a, b) => a.fecha.localeCompare(b.fecha))
      for (const vale of valesOrdenados) {
        if (montoAReponer <= 0.01) break
        if (vale.montoMxn <= montoAReponer + 0.01) {
          data = await reponerVale(vale.id, fecha, true, turnoActivo, categoriaBackend)
          montoAReponer -= vale.montoMxn
        }
      }
      setCorte(data)
      setFondoEdit(String(data.fondoInicial))
      setMostrarFondoConteo(false)
    } catch {
      setError('No se pudo guardar el fondo de feria.')
    } finally {
      setGuardando(false)
    }
  }

  const handleCierre = () => {
    if (!corte || corte.cerrado) return
    setMostrarConteo(true)
  }

  const confirmarCierre = async (
    conteoFondo: ConteoFisico,
    conteoCaja: ConteoFisico,
    empleado?: string,
  ) => {
    if (!empleado?.trim()) {
      setError('Indica el nombre del empleado que hace el corte.')
      return
    }
    setGuardando(true)
    try {
      const data = await cerrarCorte(fecha, conteoFondo, conteoCaja, empleado, turnoActivo, categoriaBackend)
      setCorte(data)
      setMostrarConteo(false)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo cerrar el corte.'
      setError(msg)
    } finally {
      setGuardando(false)
    }
  }

  const handleGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    const monto = Number(gastoMonto)
    if (!monto || monto <= 0) return
    setGuardando(true)
    try {
      const data = await registrarGasto({
        fecha,
        cliente: gastoCliente,
        monto,
        pago: gastoPago,
        turno: turnoActivo,
        categoria: categoriaBackend,
      })
      setCorte(data)
      setFondoEdit(String(data.fondoInicial))
      setMostrarGasto(false)
      setGastoMonto('')
      setGastoCliente('Gasto operativo')
    } catch {
      setError('No se pudo registrar el gasto.')
    } finally {
      setGuardando(false)
    }
  }

  const handleReponerVale = async (valeId: string) => {
    if (!corte || corte.cerrado) return
    setGuardando(true)
    try {
      const data = await reponerVale(valeId, fecha, false, turnoActivo, categoriaBackend)
      setCorte(data)
      setFondoEdit(String(data.fondoInicial))
    } catch {
      setError('No se pudo reponer el vale.')
    } finally {
      setGuardando(false)
    }
  }

  const imprimir = () => window.print()

  return (
    <div id="corte-imprimible">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold uppercase tracking-tight">Corte del Día</h2>
            {esVestidos && (
              <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-bold uppercase text-brand-800">
                {etiquetaPerfil}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            {(['manana', 'tarde'] as TurnoCorte[]).map((t) => {
              const estado = corte?.turnosDia.find((x) => x.turno === t)
              const activo = turnoActivo === t
              let badge = 'Abierto'
              let badgeClass = 'text-emerald-700'
              if (estado?.omitido) {
                badge = 'Omitido'
                badgeClass = 'text-amber-700'
              } else if (estado?.cerrado) {
                badge = 'Cerrado'
                badgeClass = 'text-red-600'
              } else if (!estado?.existe) {
                badge = 'Sin corte'
                badgeClass = 'text-gray-400'
              }
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTurno(t)}
                  className={`rounded-lg border px-4 py-2 text-left transition ${
                    activo
                      ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="block text-xs font-bold uppercase">
                    {t === 'manana' ? 'Mañana' : 'Tarde'}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase ${badgeClass}`}>{badge}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFecha(diaAnterior(fecha))}
              className="rounded border border-gray-200 p-1 hover:bg-gray-50 print:hidden"
              aria-label="Día anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-gray-600">{fechaCorteDisplay(fecha)}</p>
            <button
              type="button"
              onClick={() => setFecha(diaSiguiente(fecha))}
              className="rounded border border-gray-200 p-1 hover:bg-gray-50 print:hidden"
              aria-label="Día siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {fecha !== hoyISO() && (
              <button
                type="button"
                onClick={() => setFecha(hoyISO())}
                className="text-xs font-semibold uppercase text-brand-700 print:hidden"
              >
                Hoy
              </button>
            )}
          </div>
          {corte?.cerrado && (
            <p className="mt-1 text-xs font-semibold uppercase text-red-600">
              Corte {corte.turnoLabel} cerrado
              {corte.omitido ? ' (omitido)' : ''}
              {corte.empleadoCorte ? ` · ${corte.empleadoCorte}` : ''}
            </p>
          )}
          {corte?.incluyeManana && !corte.cerrado && (
            <p className="mt-1 text-xs font-semibold uppercase text-amber-700">
              Turno tarde incluye movimientos de mañana (sin corte de mañana)
            </p>
          )}
        </div>
        <div className="flex gap-2 print:hidden">
          <button type="button" onClick={cargar} disabled={cargando} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          {!corte?.cerrado && (
            <button type="button" onClick={() => setMostrarGasto(true)} className="btn-secondary">
              <Plus className="h-4 w-4" />
              Vale
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
          {error}
        </p>
      )}

      {cargando && !corte ? (
        <p className="py-12 text-center text-sm text-gray-500">Cargando corte…</p>
      ) : corte && resumen ? (
        <>
          {corte.incluyeManana && !corte.cerrado && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
              No se hizo corte de mañana. Al cerrar tarde se registrarán todos los movimientos del día en un solo corte.
            </p>
          )}
          <div className="card mb-6 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">Resumen Financiero</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {metricas.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-xl font-bold">{formatMoney(value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-6 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-sm font-semibold uppercase text-gray-700">Desglose Detallado</h3>
              <p className="mt-1 text-xs text-gray-500">
                Movimientos del turno {corte.turnoLabel.toLowerCase()}
                {corte.incluyeManana ? ' (incluye mañana)' : ''}.
              </p>
            </div>
            <div className="overflow-x-auto">
              {corte.transacciones.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  Sin movimientos en este turno. Las rentas nuevas aparecen aquí al guardarse.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="px-4 py-3">Hora</th>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3">Ref.</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Pago</th>
                      <th className="px-4 py-3">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {corte.transacciones.map((tx) => {
                      const concepto = conceptoTransaccion(tx)
                      return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{tx.timestamp}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${conceptoBadgeClass(concepto)}`}
                          >
                            {concepto}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {tx.referencia}
                          {esGastoFondo(tx.referencia) && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                              Vale
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 uppercase">{tx.cliente}</td>
                        <td className="px-4 py-3 uppercase">{tx.pago}</td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            tx.monto < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {tx.monto < 0 ? '-' : ''}
                          {formatMontoTransaccion(tx.monto, tx.pago)}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="card p-6">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                Fondo de Feria
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Monedas y billetes para dar cambio. Valor configurado: {formatMoney(fondoConfigurado)}.
              </p>
              {corte.cerrado ? (
                <p className="text-3xl font-bold">{formatMoney(corte.fondoInicial)}</p>
              ) : (
                <>
                  <p className="hidden text-3xl font-bold print:block">
                    {formatMoney(Number(fondoEdit) || corte.fondoInicial)}
                  </p>
                  <div className="flex items-end gap-2 print:hidden">
                    <label className="flex-1">
                      <span className="sr-only">Fondo de feria</span>
                      <input
                        type="number"
                        className="input-field text-2xl font-bold"
                        value={fondoEdit}
                        onChange={(e) => setFondoEdit(e.target.value)}
                        min={0}
                        step={1}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={guardando}
                      onClick={guardarFondo}
                    >
                      Guardar
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 print:hidden">
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase text-gray-600"
                      onClick={aplicarFondoConfigurado}
                      disabled={guardando}
                    >
                      Usar valor de Finanzas
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase text-brand-700"
                      onClick={() => {
                        setFondoConteoReadOnly(false)
                        setMostrarFondoConteo(true)
                      }}
                    >
                      {tieneDesgloseFondo ? 'Editar desglose' : 'Contar fondo de feria'}
                    </button>
                    {tieneDesgloseFondo && (
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase text-gray-600"
                        onClick={() => {
                          setFondoConteoReadOnly(true)
                          setMostrarFondoConteo(true)
                        }}
                      >
                        Ver desglose
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="card p-6">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                Caja del Turno
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Efectivo del turno por rentas y multas. No incluye gastos del fondo (vales).
              </p>
              <p className="text-3xl font-bold">{formatMoney(resumen.cajaDelDia)}</p>
              <p className="mt-2 text-xs text-gray-500">
                Total en caja: {formatMoney(resumen.totalEnCaja)} (fondo + caja)
              </p>
            </div>
            <div className="card p-6 md:col-span-2 xl:col-span-1">
              <h3 className="mb-3 text-xs font-semibold uppercase text-gray-500">
                Multas de Devoluciones Tardías
              </h3>
              {corte.multasTardias.length === 0 ? (
                <p className="text-sm text-gray-500">Sin multas pendientes.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {corte.multasTardias.map((m) => (
                    <p key={m.rentaId} className="text-gray-700">
                      Cliente {m.cliente}, Renta #{m.rentaId}:{' '}
                      <span className="font-medium">{formatMoney(m.monto)}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {corte.valesPendientes.length > 0 && (
            <div className="card mb-6 overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold uppercase text-gray-700">Vales pendientes de reponer</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Total por reponer al fondo: {formatMoney(resumen.valesPendientesTotal)}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {corte.valesPendientes.map((vale) => (
                  <div
                    key={vale.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm"
                  >
                    <div>
                      <p className="font-medium uppercase text-gray-900">{vale.concepto}</p>
                      <p className="text-xs text-gray-500">
                        {vale.referencia} · {vale.fecha} · {formatMoney(vale.montoMxn)} al fondo
                      </p>
                    </div>
                    {!corte.cerrado && (
                      <button
                        type="button"
                        className="btn-secondary print:hidden"
                        disabled={guardando}
                        onClick={() => handleReponerVale(vale.id)}
                      >
                        Reponer al fondo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {corte.cerrado && corte.totalesConteo && (
            <div className="card mb-6 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-gray-700">
                  Conteo físico al cierre
                </h3>
                <button
                  type="button"
                  className="text-xs font-semibold uppercase text-brand-700 print:hidden"
                  onClick={() => setVerConteo(true)}
                >
                  Ver detalle
                </button>
              </div>
              {corte.empleadoCorte && (
                <p className="mb-3 text-sm text-gray-700">
                  <span className="text-xs uppercase text-gray-500">Empleado: </span>
                  <span className="font-semibold uppercase">{corte.empleadoCorte}</span>
                </p>
              )}
              <div className={`grid gap-4 text-sm ${(corte.totalesConteo.mxnVales ?? 0) > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
                <div>
                  <p className="text-xs text-gray-500">Billetes MXN</p>
                  <p className="font-bold">{formatMoney(corte.totalesConteo.mxnBilletes)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Monedas MXN</p>
                  <p className="font-bold">{formatMoney(corte.totalesConteo.mxnMonedas)}</p>
                </div>
                {(corte.totalesConteo.mxnVales ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-gray-500">Vales</p>
                    <p className="font-bold">{formatMoney(corte.totalesConteo.mxnVales)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Billetes USD</p>
                  <p className="font-bold">
                    {corte.totalesConteo.usdTotal.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Diferencia</p>
                  <p
                    className={`font-bold ${
                      corte.totalesConteo.diferenciaMxn != null &&
                      Math.abs(corte.totalesConteo.diferenciaMxn) < 0.01
                        ? 'text-green-700'
                        : (corte.totalesConteo.diferenciaMxn ?? 0) >= 0
                          ? 'text-amber-700'
                          : 'text-red-700'
                    }`}
                  >
                    {corte.totalesConteo.diferenciaMxn != null
                      ? `${corte.totalesConteo.diferenciaMxn >= 0 ? '+' : ''}${formatMoney(corte.totalesConteo.diferenciaMxn)}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 print:hidden">
            <button
              type="button"
              onClick={imprimir}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700"
            >
              <Printer className="h-5 w-5" />
              Imprimir Resumen
            </button>
            <button
              type="button"
              onClick={handleCierre}
              disabled={corte.cerrado || guardando}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Lock className="h-5 w-5" />
              {corte.cerrado ? 'Corte cerrado' : `Cerrar turno ${corte.turnoLabel.toLowerCase()}`}
            </button>
          </div>
        </>
      ) : null}

      <Modal open={mostrarGasto} onClose={() => !guardando && setMostrarGasto(false)} title="Registrar gasto (vale)">
        <p className="mb-4 text-sm text-gray-600">
          El monto se descuenta del <strong>fondo de feria</strong> y queda un vale pendiente hasta que lo repongas.
        </p>
        <form onSubmit={handleGasto} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Concepto</span>
            <input
              className="input-field uppercase"
              value={gastoCliente}
              onChange={(e) => setGastoCliente(e.target.value.toLocaleUpperCase('es-MX'))}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Monto $ MXN</span>
            <input
              type="number"
              className="input-field"
              value={gastoMonto}
              onChange={(e) => setGastoMonto(e.target.value)}
              min={1}
              step={1}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Forma de pago</span>
            <select
              className="input-field"
              value={gastoPago}
              onChange={(e) => setGastoPago(e.target.value as MetodoPago)}
            >
              {METODOS_PAGO.filter((m) => m.value === 'pesos' || m.value === 'dlls').map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setMostrarGasto(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Crear vale'}
            </button>
          </div>
        </form>
      </Modal>

      {corte && resumen && (
        <ConteoCajaModal
          open={mostrarConteo}
          onClose={() => !guardando && setMostrarConteo(false)}
          onConfirmSeparado={confirmarCierre}
          expectedMxn={resumen.totalEnCaja}
          expectedFondoMxn={resumen.fondoFisico}
          expectedCajaMxn={resumen.cajaDelDia}
          fondoMxn={resumen.fondoFisico}
          cajaMxn={resumen.cajaDelDia}
          initialConteoFondo={corte.conteoFondo}
          tipoCambioUsd={corte.totalesConteo?.tipoCambioUsd}
          guardando={guardando}
          pedirNombreEmpleado
          modoSeparado
          valesPendientes={corte.valesPendientes}
          valesEsperadosFondo={resumen.valesEsperadosFondo}
          descripcion={`Cierre del turno ${corte.turnoLabel.toLowerCase()}. Cuenta fondo de feria y caja por separado. Indica quién hace el corte (obligatorio).`}
          titulo={`Cierre de caja — turno ${corte.turnoLabel.toLowerCase()}`}
        />
      )}

      {corte?.cerrado && (corte.conteoCaja || corte.conteoFisico) && (
        <ConteoCajaModal
          open={verConteo}
          onClose={() => setVerConteo(false)}
          expectedMxn={resumen?.totalEnCaja ?? 0}
          expectedFondoMxn={resumen?.fondoFisico}
          expectedCajaMxn={resumen?.cajaDelDia}
          fondoMxn={resumen?.fondoFisico}
          cajaMxn={resumen?.cajaDelDia}
          tipoCambioUsd={corte.totalesConteo?.tipoCambioUsd}
          initialConteoFondo={corte.conteoFondo}
          initialConteoCaja={corte.conteoCaja}
          readOnly
          modoSeparado={Boolean(corte.conteoCaja)}
          initialConteo={corte.conteoFisico}
          mostrarVales={!corte.conteoCaja}
          valesPendientes={corte.valesPendientes}
          valesEsperadosFondo={resumen?.valesEsperadosFondo}
          descripcion={
            corte.empleadoCorte
              ? `Corte realizado por ${corte.empleadoCorte}. Conteo físico al cerrar (fondo + caja).`
              : 'Conteo físico al cerrar: fondo de feria y caja del turno.'
          }
        />
      )}

      {corte && !corte.cerrado && (
        <ConteoCajaModal
          open={mostrarFondoConteo}
          onClose={() => !guardando && setMostrarFondoConteo(false)}
          onConfirm={fondoConteoReadOnly ? undefined : confirmarFondoConteo}
          expectedMxn={corte.fondoInicial}
          tipoCambioUsd={corte.totalesConteo?.tipoCambioUsd}
          initialConteo={corte.conteoFondo}
          readOnly={fondoConteoReadOnly}
          guardando={guardando}
          modoFondo
          fondoReferencia={fondoConfigurado}
          valesPendientes={corte.valesPendientes}
          valesEsperadosFondo={resumen?.valesEsperadosFondo}
          titulo="Fondo de feria — conteo"
          descripcion="Cuenta billetes, monedas y vales del fondo. En vales: 1 unidad = $1 MXN (50 = $50)."
        />
      )}
    </div>
  )
}
