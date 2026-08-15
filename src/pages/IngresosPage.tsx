import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, TrendingUp } from 'lucide-react'
import {
  fetchAlertasReuso,
  fetchIngresosMes,
  type AlertaReuso,
  type AlertasReuso,
  type IngresosMes,
  type RubroIngreso,
} from '../api/finanzas'
import { useAuth } from '../context/AuthContext'
import { usePerfilVestido } from '../context/PerfilVestidoContext'

type TabIngresos = 'dinero' | 'alertas'

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

function tarjetaAlerta(alerta: AlertaReuso) {
  if (alerta.traslape || alerta.severidad === 'alta') {
    return 'border-red-200 bg-red-50'
  }
  if (alerta.severidad === 'media') {
    return 'border-amber-200 bg-amber-50'
  }
  return 'border-orange-200 bg-orange-50'
}

function PanelAlertas() {
  const { tipoVestido } = usePerfilVestido()
  const [categoria, setCategoria] = useState<string>(tipoVestido)
  const [data, setData] = useState<AlertasReuso | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setData(await fetchAlertasReuso(categoria, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las alertas.')
      setData(null)
    } finally {
      setCargando(false)
    }
  }, [categoria])

  useEffect(() => {
    setCategoria(tipoVestido)
  }, [tipoVestido])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="quince">XV</option>
          <option value="noche">Noche</option>
          <option value="boda">Novia</option>
          <option value="todas">Todos los vestidos</option>
        </select>
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
        <p className="py-12 text-center text-sm text-gray-500">Cargando alertas…</p>
      ) : data ? (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Si el mismo vestido vuelve a salir en {data.diasAlerta} días o menos después de regresar,
            aparece aquí: hay que recibirlo a tiempo y en buenas condiciones, o encargar otro.
          </p>

          {data.alertas.length === 0 ? (
            <p className="card mb-6 px-4 py-8 text-center text-sm text-gray-500">
              No hay vestidos con rentas tan seguidas en las próximas semanas.
            </p>
          ) : (
            <div className="mb-6 space-y-3">
              {data.alertas.map((alerta) => (
                <article
                  key={`${alerta.codigo}-${alerta.anterior.rentaId}-${alerta.siguiente.rentaId}`}
                  className={`card border p-4 ${tarjetaAlerta(alerta)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-gray-900">
                        {alerta.color || 'Vestido'} {alerta.codigo}
                      </p>
                      {alerta.descripcion && (
                        <p className="text-xs text-gray-600">{alerta.descripcion}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                      {alerta.traslape
                        ? 'Se empalman'
                        : `${alerta.diasEntre} día${alerta.diasEntre === 1 ? '' : 's'} de holgura`}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-xs font-semibold uppercase text-gray-500">Sale</span>
                      <br />
                      {alerta.anterior.fechaSalida} → {alerta.anterior.fechaRegreso}
                      {alerta.anterior.cliente ? ` · ${alerta.anterior.cliente}` : ''}
                    </p>
                    <p>
                      <span className="text-xs font-semibold uppercase text-gray-500">Vuelve a salir</span>
                      <br />
                      {alerta.siguiente.fechaSalida} → {alerta.siguiente.fechaRegreso}
                      {alerta.siguiente.cliente ? ` · ${alerta.siguiente.cliente}` : ''}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    Este vestido se ha rentado {alerta.vecesRentado} vez
                    {alerta.vecesRentado === 1 ? '' : 'es'}.
                  </p>
                </article>
              ))}
            </div>
          )}

          <section className="card overflow-x-auto">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                Veces que se ha rentado el mismo vestido
              </h3>
            </div>
            {data.masRentados.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">Aún no hay rentas en esta categoría.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2">Código</th>
                    <th className="px-4 py-2">Color</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2 text-right">Veces</th>
                  </tr>
                </thead>
                <tbody>
                  {data.masRentados.map((item) => (
                    <tr key={`${item.piezaId ?? item.codigo}-${item.color}`} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-semibold">{item.codigo || '—'}</td>
                      <td className="px-4 py-2">{item.color || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{item.descripcion || '—'}</td>
                      <td className="px-4 py-2 text-right font-semibold">{item.veces}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </>
  )
}

export function IngresosPage() {
  const { lineaNegocio } = useAuth()
  const esVestidos = lineaNegocio === 'vestidos'
  const [tab, setTab] = useState<TabIngresos>('dinero')
  const tabActiva = esVestidos ? tab : 'dinero'

  const titulo = tabActiva === 'alertas' ? 'Alertas de vestido' : 'Ingresos mensuales'
  const subtitulo =
    tabActiva === 'alertas'
      ? 'El mismo vestido rentado otra vez muy seguido: hay que cuidarlo o encargar otro.'
      : 'Dinero que ya entró al corte, separado por Trajes, XV, Noche y Novia.'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">{titulo}</h2>
          <p className="mt-1 text-sm text-gray-600">{subtitulo}</p>
        </div>
        {esVestidos && (
          <div className="flex flex-wrap gap-2">
            <TabButton activa={tabActiva === 'dinero'} onClick={() => setTab('dinero')}>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Dinero
              </span>
            </TabButton>
            <TabButton activa={tabActiva === 'alertas'} onClick={() => setTab('alertas')}>
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Alertas
              </span>
            </TabButton>
          </div>
        )}
      </div>

      {tabActiva === 'dinero' && <PanelDinero />}
      {tabActiva === 'alertas' && esVestidos && <PanelAlertas />}
    </div>
  )
}
