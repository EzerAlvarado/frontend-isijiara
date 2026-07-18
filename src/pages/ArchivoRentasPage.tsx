import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react'
import { ExportRentasMenu } from '../components/rentas/ExportRentasMenu'
import { fetchRentas } from '../api/rentas'
import { NotaVentaPreview } from '../components/recibo/NotaVentaPreview'
import { SearchInput } from '../components/ui/SearchInput'
import { BloqueSemana, totalColumnasRentas } from '../components/rentas/RentasTabla'
import { useAuth } from '../context/AuthContext'
import { usePerfilVestido } from '../context/PerfilVestidoContext'
import { rutaVestidos } from '../utils/perfilVestido'
import type { Renta } from '../types'
import type { DocumentoRenta } from '../types/documentoRenta'
import { rentaADocumento } from '../utils/documentoRenta'
import { multaEfectiva } from '../utils/multa'
import {
  camposRentaCelda,
  columnasPrenda,
  rentaCoincideTab,
  subtituloTabRentas,
  tabInicialRentas,
  type TabRentas,
} from '../utils/rentasConfig'
import {
  agruparRentasPorSemana,
  etiquetaMesArchivo,
  mesKeyDesdeFechaSalida,
  mesesArchivo,
  ordenarRentasPorFechaDesc,
  parseMesArchivo,
  rentaEnMes,
} from '../utils/archivoRentas'
import { esRentaPasada } from '../utils/semanasRentas'
import { exportarRentasTab, etiquetaExportTab } from '../utils/exportRentas'
import { exportarRentasReportePdf } from '../utils/exportRentasPdf'

function filtrarPorBusqueda(
  rentas: Renta[],
  q: string,
  camposCelda: ReturnType<typeof camposRentaCelda>,
): Renta[] {
  if (!q) return rentas
  const busqueda = q.toLowerCase()
  return rentas.filter((r) => {
    const texto = [
      r.id,
      r.fechaSalida,
      r.fechaRegreso,
      r.marca,
      ...camposCelda.map((c) => r[c].valor),
    ]
      .join(' ')
      .toLowerCase()
    return texto.includes(busqueda)
  })
}

export function ArchivoRentasPage() {
  const { usuario } = useAuth()
  const { perfilSlug, tipoVestido } = usePerfilVestido()
  const lineaNegocio = usuario?.lineaNegocio ?? 'trajes'
  const esVestidos = lineaNegocio === 'vestidos'
  const tabActiva: TabRentas = esVestidos ? tipoVestido : tabInicialRentas(lineaNegocio)
  const rutaRentas = esVestidos ? rutaVestidos(perfilSlug, 'rentas') : '/rentas'
  const [searchParams, setSearchParams] = useSearchParams()
  const mesParam = searchParams.get('mes')

  const colsPrenda = useMemo(() => columnasPrenda(lineaNegocio), [lineaNegocio])
  const camposCelda = useMemo(() => camposRentaCelda(lineaNegocio), [lineaNegocio])
  const totalCols = useMemo(
    () => totalColumnasRentas(colsPrenda, 'archivo', lineaNegocio),
    [colsPrenda, lineaNegocio],
  )

  const [rentas, setRentas] = useState<Renta[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [docImpresion, setDocImpresion] = useState<DocumentoRenta | null>(null)

  const mesSeleccionado = useMemo(
    () => (mesParam ? parseMesArchivo(mesParam) : null),
    [mesParam],
  )

  const cargarRentas = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const data = await fetchRentas(
        esVestidos ? { categoria_vestido: tipoVestido } : undefined,
      )
      setRentas(data)
    } catch (err) {
      setErrorCarga(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor. ¿Está corriendo Django en el puerto 8000?',
      )
    } finally {
      setCargando(false)
    }
  }, [esVestidos, tipoVestido])

  useEffect(() => {
    cargarRentas()
  }, [cargarRentas])

  useEffect(() => {
    setSearch('')
  }, [mesParam, tabActiva])

  const rentasPasadas = useMemo(
    () => rentas.filter((r) => esRentaPasada(r.fechaSalida)),
    [rentas],
  )

  const rentasPasadasTab = useMemo(
    () =>
      filtrarPorBusqueda(
        rentasPasadas.filter((r) => rentaCoincideTab(r, tabActiva, lineaNegocio)),
        search,
        camposCelda,
      ),
    [rentasPasadas, tabActiva, lineaNegocio, search, camposCelda],
  )

  const meses = useMemo(() => mesesArchivo(rentasPasadasTab), [rentasPasadasTab])

  const conteoMesPorTab = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rentasPasadas) {
      if (!rentaCoincideTab(r, tabActiva, lineaNegocio)) continue
      const k = mesKeyDesdeFechaSalida(r.fechaSalida)
      if (k) map.set(k, (map.get(k) ?? 0) + 1)
    }
    return map
  }, [rentasPasadas, tabActiva, lineaNegocio])

  const rentasDelMes = useMemo(() => {
    if (!mesSeleccionado) return []
    return ordenarRentasPorFechaDesc(
      rentasPasadasTab.filter((r) => rentaEnMes(r, mesSeleccionado.key)),
    )
  }, [mesSeleccionado, rentasPasadasTab])

  const semanasDelMes = useMemo(
    () => agruparRentasPorSemana(rentasDelMes),
    [rentasDelMes],
  )

  const totalMes = rentasDelMes.reduce(
    (sum, r) => (r.cancelada ? sum : sum + r.fondo + multaEfectiva(r)),
    0,
  )

  const abrirMes = (key: string) => {
    setSearchParams({ mes: key })
  }

  const volverAMeses = () => {
    setSearchParams({})
  }

  const etiquetaTab = etiquetaExportTab(tabActiva, lineaNegocio)
  const datosExport = mesSeleccionado ? rentasDelMes : rentasPasadasTab

  const exportarExcel = () => {
    const { filas } = exportarRentasTab(datosExport, tabActiva, lineaNegocio, 'archivo')
    if (filas === 0) {
      window.alert(`No hay rentas archivadas de ${etiquetaTab} para exportar.`)
    }
  }

  const exportarPdf = async () => {
    if (datosExport.length === 0) {
      window.alert(`No hay rentas archivadas de ${etiquetaTab} para exportar.`)
      return
    }
    const mesKey = mesSeleccionado?.key ?? 'completo'
    const mesLabel = mesSeleccionado?.label ?? 'Archivo completo'
    try {
      await exportarRentasReportePdf(datosExport, tabActiva, lineaNegocio, {
        mesKey,
        mesLabel,
      })
    } catch {
      window.alert('No se pudo generar el reporte PDF. Intenta de nuevo.')
    }
  }

  const filaProps = {
    esVestidos,
    variant: 'archivo' as const,
    onImprimir: (renta: Renta) => setDocImpresion(rentaADocumento(renta)),
  }

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
                {subtituloTabRentas(tabActiva)} · {rentasDelMes.length} rentas
                {semanasDelMes.length > 0 && (
                  <span className="ml-1 text-xs">
                    · {semanasDelMes.length}{' '}
                    {semanasDelMes.length === 1 ? 'semana' : 'semanas'}
                  </span>
                )}
                · solo lectura
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Archivo de rentas</h2>
              <p className="mt-1 text-sm text-gray-500">
                Elige un mes para ver todas las rentas archivadas
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
          <Link to={rutaRentas} className="btn-secondary">
            Rentas activas
          </Link>
          <ExportRentasMenu
            disabled={cargando}
            onExportExcel={exportarExcel}
            onExportPdf={exportarPdf}
            titleExcel={`Exportar ${mesSeleccionado ? mesSeleccionado.label : 'archivo'} (CSV)`}
            titlePdf={`Reporte PDF ${mesSeleccionado ? `de ${mesSeleccionado.label}` : 'del archivo'}`}
          />
          <button type="button" onClick={cargarRentas} className="btn-secondary" title="Recargar">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorCarga && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{errorCarga}</span>
          <button type="button" onClick={cargarRentas} className="btn-secondary text-xs">
            Reintentar
          </button>
        </div>
      )}

      {docImpresion && (
        <NotaVentaPreview
          open={!!docImpresion}
          onClose={() => setDocImpresion(null)}
          doc={docImpresion}
        />
      )}

      {cargando ? (
        <div className="card px-6 py-12 text-center text-sm text-gray-500">Cargando archivo…</div>
      ) : !mesSeleccionado ? (
        <div className="card p-6">
          {meses.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              <Calendar className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              No hay rentas pasadas en {subtituloTabRentas(tabActiva)}.
              <div className="mt-2">
                <Link to={rutaRentas} className="text-brand-600 hover:underline">
                  Ver rentas activas
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {meses.map((mes) => {
                const enTab = conteoMesPorTab.get(mes.key) ?? 0
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
                      <span className="font-semibold text-brand-700">{enTab}</span> en{' '}
                      {subtituloTabRentas(tabActiva)}
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
              {etiquetaMesArchivo(mesSeleccionado.key)} — {subtituloTabRentas(tabActiva)}
            </h3>
            <SearchInput value={search} onChange={setSearch} className="w-48" />
          </div>

          {rentasDelMes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No hay rentas de {subtituloTabRentas(tabActiva)} en este mes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {semanasDelMes.map(({ semana, rentas: rentasSemana }) => (
                    <BloqueSemana
                      key={semana.key}
                      semana={semana}
                      rentas={rentasSemana}
                      columnasPrenda={colsPrenda}
                      totalCols={totalCols}
                      mostrarFilasVacias={false}
                      {...filaProps}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rentasDelMes.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-xs text-gray-500">
                {rentasDelMes.length} rentas · {semanasDelMes.length}{' '}
                {semanasDelMes.length === 1 ? 'semana' : 'semanas'} · ordenadas por fecha de
                salida
              </p>
              <p className="text-sm font-medium text-gray-700">
                Total del mes:{' '}
                <span className="text-brand-600">
                  {totalMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
