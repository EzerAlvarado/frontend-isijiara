import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { fetchAlertasReuso, type AlertaReuso, type AlertasReuso } from '../api/finanzas'
import { useAuth } from '../context/AuthContext'
import { usePerfilVestido } from '../context/PerfilVestidoContext'

function tarjetaAlerta(alerta: AlertaReuso) {
  if (alerta.traslape || alerta.severidad === 'alta') {
    return 'border-red-200 bg-red-50'
  }
  if (alerta.severidad === 'media') {
    return 'border-amber-200 bg-amber-50'
  }
  return 'border-orange-200 bg-orange-50'
}

export function AlertasVestidosPage() {
  const { lineaNegocio } = useAuth()
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

  if (lineaNegocio !== 'vestidos') {
    return <Navigate to="/ingresos" replace />
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Alertas de vestido</h2>
          <p className="mt-1 text-sm text-gray-600">
            El mismo vestido rentado otra vez muy seguido: hay que cuidarlo o encargar otro.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
    </div>
  )
}
