import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp } from 'lucide-react'
import { fetchIngresosMes, type IngresosMes, type RubroIngreso } from '../api/finanzas'

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

export function IngresosPage() {
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
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Ingresos mensuales</h2>
          <p className="mt-1 text-sm text-gray-600">
            Dinero que ya entró al corte, separado por Trajes, XV, Noche y Novia.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  )
}
