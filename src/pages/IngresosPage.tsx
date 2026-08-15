import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, TrendingUp } from 'lucide-react'
import {
  fetchIngresosMes,
  fetchOcupacionAnio,
  type IngresosMes,
  type OcupacionAnio,
  type RubroIngreso,
} from '../api/finanzas'

type TabIngresos = 'dinero' | 'piezas'

function formatMoney(amount: number) {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function mesAnterior(anio: number, mes: number) {
  if (mes === 1) return { anio: anio - 1, mes: 12 }
  return { anio, mes: mes - 1 }
}

function mesSiguiente(anio: number, mes: number) {
  if (mes === 12) return { anio: anio + 1, mes: 1 }
  return { anio, mes: mes + 1 }
}

function esFuturo(anio: number, mes: number) {
  const hoy = new Date()
  return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes > hoy.getMonth() + 1)
}

const COLORES_RUBRO: Record<string, string> = {
  trajes: 'bg-slate-800',
  xv: 'bg-pink-500',
  noche: 'bg-violet-600',
  novia: 'bg-amber-500',
}

const ETIQUETA_CONCEPTO: Record<string, string> = {
  operacion: 'Rentas / ventas',
  abono: 'Abonos',
  multa: 'Multas',
  danos: 'Daños',
  otro: 'Otros',
}

function diferenciaClase(valor: number, futuro?: boolean) {
  if (futuro || valor === 0) return 'text-gray-500'
  return valor > 0 ? 'text-emerald-700' : 'text-red-700'
}

function formatDelta(valor: number) {
  if (valor === 0) return 'igual'
  return valor > 0 ? `+${valor}` : String(valor)
}

function BarraParticipacion({ rubros, total }: { rubros: RubroIngreso[]; total: number }) {
  if (total <= 0) return null
  return (
    <div className="mt-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        {rubros
          .filter((r) => r.ingresoMxn > 0)
          .map((r) => (
            <div
              key={r.id}
              className={COLORES_RUBRO[r.id] ?? 'bg-gray-400'}
              style={{ width: `${(r.ingresoMxn / total) * 100}%` }}
              title={`${r.label}: ${formatMoney(r.ingresoMxn)}`}
            />
          ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
        {rubros.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${COLORES_RUBRO[r.id] ?? 'bg-gray-400'}`} />
            {r.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function TabButton({
  activa,
  onClick,
  children,
}: {
  activa: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
        activa ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

function PanelDinero() {
  const ahora = new Date()
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [mes, setMes] = useState(ahora.getMonth() + 1)
  const [data, setData] = useState<IngresosMes | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetchIngresosMes(anio, mes)
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los ingresos.')
      setData(null)
    } finally {
      setCargando(false)
    }
  }, [anio, mes])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const irAnterior = () => {
    const next = mesAnterior(anio, mes)
    setAnio(next.anio)
    setMes(next.mes)
  }

  const irSiguiente = () => {
    const next = mesSiguiente(anio, mes)
    if (esFuturo(next.anio, next.mes)) return
    setAnio(next.anio)
    setMes(next.mes)
  }

  const maximo = useMemo(
    () => Math.max(1, ...(data?.rubros.map((r) => r.ingresoMxn) ?? [1])),
    [data],
  )

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={irAnterior} title="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[160px] text-center text-sm font-semibold uppercase tracking-wide text-gray-800">
          {data?.mesLabel ?? '—'}
        </span>
        <button
          type="button"
          className="btn-secondary"
          onClick={irSiguiente}
          disabled={esFuturo(mesSiguiente(anio, mes).anio, mesSiguiente(anio, mes).mes)}
          title="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" className="btn-secondary" onClick={() => void cargar()} disabled={cargando}>
          <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando && !data ? (
        <p className="py-12 text-center text-sm text-gray-500">Cargando ingresos…</p>
      ) : data ? (
        <>
          <section className="card mb-6 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {data.esMesActual ? 'Ingreso a la fecha' : 'Ingreso del mes'}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                  {formatMoney(data.totalMxn)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {data.movimientos} movimiento{data.movimientos === 1 ? '' : 's'} en {data.mesLabel}
                  {data.esMesActual ? ' · mes en curso' : ''}
                </p>
              </div>
              {data.esMesActual && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Hoy</p>
                  <p className="text-xl font-bold text-emerald-900">{formatMoney(data.hoyMxn)}</p>
                </div>
              )}
            </div>
            <BarraParticipacion rubros={data.rubros} total={data.totalMxn} />
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.rubros.map((rubro) => {
              const pct = data.totalMxn > 0 ? (rubro.ingresoMxn / data.totalMxn) * 100 : 0
              const conceptos = Object.entries(rubro.porConcepto).filter(([, v]) => v > 0)
              return (
                <article key={rubro.id} className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                      {rubro.label}
                    </h3>
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(rubro.ingresoMxn)}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {pct.toFixed(0)}% del mes · {rubro.movimientos} mov.
                  </p>
                  {data.esMesActual && rubro.hoyMxn > 0 && (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Hoy {formatMoney(rubro.hoyMxn)}
                    </p>
                  )}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full ${COLORES_RUBRO[rubro.id] ?? 'bg-gray-400'}`}
                      style={{ width: `${(rubro.ingresoMxn / maximo) * 100}%` }}
                    />
                  </div>
                  {conceptos.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-gray-600">
                      {conceptos.map(([key, valor]) => (
                        <li key={key} className="flex justify-between gap-2">
                          <span>{ETIQUETA_CONCEPTO[key] ?? key}</span>
                          <span className="font-medium text-gray-800">{formatMoney(valor)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        </>
      ) : null}
    </>
  )
}

function PanelPiezas() {
  const ahora = new Date()
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [data, setData] = useState<OcupacionAnio | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setData(await fetchOcupacionAnio(anio))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el conteo.')
      setData(null)
    } finally {
      setCargando(false)
    }
  }, [anio])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setAnio((a) => a - 1)}
          title="Año anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[120px] text-center text-sm font-semibold uppercase tracking-wide text-gray-800">
          {anio} vs {anio - 1}
        </span>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setAnio((a) => a + 1)}
          disabled={anio >= ahora.getFullYear()}
          title="Año siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" className="btn-secondary" onClick={() => void cargar()} disabled={cargando}>
          <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando && !data ? (
        <p className="py-12 text-center text-sm text-gray-500">Cargando ocupación…</p>
      ) : data ? (
        <>
          <section className="card mb-6 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Piezas que salieron en {data.anio}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{data.totales.actual}</p>
            <p className={`mt-1 text-sm ${diferenciaClase(data.totales.actual - data.totales.anterior)}`}>
              {formatDelta(data.totales.actual - data.totales.anterior)} vs {data.anioAnterior} (
              {data.totales.anterior})
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Cuenta rentas, premier, sesión y paquete. No cuenta ventas ni canceladas. El número entre
              paréntesis es el mismo mes del año pasado.
            </p>
            {data.mesesMasOcupados.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.mesesMasOcupados.map((item) => (
                  <span
                    key={`${item.rubro}-${item.mes}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                  >
                    {item.mesLabel} {data.anioAnterior}: {item.anterior} {item.rubroLabel}
                  </span>
                ))}
              </div>
            )}
          </section>

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Mes</th>
                  {data.meses[0]?.rubros.map((r) => (
                    <th key={r.id} className="px-3 py-3">
                      {r.label}
                    </th>
                  ))}
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Vs {data.anioAnterior}</th>
                </tr>
              </thead>
              <tbody>
                {data.meses.map((mes) => (
                  <tr
                    key={mes.mes}
                    className={`border-b border-gray-100 ${mes.esMesActual ? 'bg-emerald-50/60' : ''} ${
                      mes.esFuturo ? 'text-gray-400' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {mes.mesLabel}
                      {mes.esMesActual ? (
                        <span className="ml-2 text-[10px] font-semibold uppercase text-emerald-700">
                          en curso
                        </span>
                      ) : null}
                    </td>
                    {mes.rubros.map((r) => (
                      <td key={r.id} className="px-3 py-2.5">
                        <span className="font-semibold">{r.actual}</span>
                        <span className="ml-1 text-xs text-gray-500">({r.anterior})</span>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 font-semibold">{mes.totalActual}</td>
                    <td className={`px-3 py-2.5 font-medium ${diferenciaClase(mes.diferencia, mes.esFuturo)}`}>
                      {mes.esFuturo ? '—' : formatDelta(mes.diferencia)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  )
}

export function IngresosPage() {
  const [tab, setTab] = useState<TabIngresos>('dinero')

  const titulo = tab === 'piezas' ? 'Piezas por mes' : 'Ingresos mensuales'
  const subtitulo =
    tab === 'piezas'
      ? 'Cuántos vestidos o trajes salieron cada mes, comparado con el mismo mes del año pasado.'
      : 'Dinero que ya entró al corte, separado por Trajes, XV, Noche y Novia.'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">{titulo}</h2>
          <p className="mt-1 text-sm text-gray-600">{subtitulo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TabButton activa={tab === 'dinero'} onClick={() => setTab('dinero')}>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Dinero
            </span>
          </TabButton>
          <TabButton activa={tab === 'piezas'} onClick={() => setTab('piezas')}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Piezas
            </span>
          </TabButton>
        </div>
      </div>

      {tab === 'dinero' && <PanelDinero />}
      {tab === 'piezas' && <PanelPiezas />}
    </div>
  )
}
