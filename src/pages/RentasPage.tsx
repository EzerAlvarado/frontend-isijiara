import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { ExportRentasMenu } from '../components/rentas/ExportRentasMenu'
import { cancelRenta, createRenta, fetchRentas, registrarAbono, updateRenta } from '../api/rentas'
import { NotaVentaPreview } from '../components/recibo/NotaVentaPreview'
import { AbonoModal } from '../components/rentas/AbonoModal'
import { RentaFormModal } from '../components/rentas/RentaFormModal'
import { SearchInput } from '../components/ui/SearchInput'
import { PaintToolbar, type ModoPintar } from '../components/rentas/PaintToolbar'
import { NotaOtraSituacionModal } from '../components/rentas/NotaOtraSituacionModal'
import {
  aplicarEstatusACelda,
  BloqueSemana,
  totalColumnasRentas,
} from '../components/rentas/RentasTabla'
import { useAuth } from '../context/AuthContext'
import { usePerfilVestido } from '../context/PerfilVestidoContext'
import { rutaVestidos } from '../utils/perfilVestido'
import type { CampoRentaCelda, EstatusCelda, Renta } from '../types'
import type { DocumentoRenta } from '../types/documentoRenta'
import { rentaADocumento } from '../utils/documentoRenta'
import { multaEfectiva } from '../utils/multa'
import {
  camposRentaCelda,
  columnasPrenda,
  rentaCoincideTab,
  subtituloTabRentas,
  tabInicialRentas,
  tituloRentas,
  type TabRentas,
} from '../utils/rentasConfig'
import {
  FILAS_VACIAS_POR_SEMANA,
  MESES_VENTANA_ADELANTE,
  esRentaPasada,
  estaEnVentanaActual,
  semanaKeyDesdeFechaSalida,
  semanasVentanaActual,
} from '../utils/semanasRentas'
import { exportarRentasTab, etiquetaExportTab } from '../utils/exportRentas'
import { exportarRentasReportePdf } from '../utils/exportRentasPdf'

export function RentasPage() {
  const { usuario } = useAuth()
  const { perfilSlug, tipoVestido } = usePerfilVestido()
  const lineaNegocio = usuario?.lineaNegocio ?? 'trajes'
  const esVestidos = lineaNegocio === 'vestidos'
  const tabActiva: TabRentas = esVestidos ? tipoVestido : tabInicialRentas(lineaNegocio)
  const rutaArchivo = esVestidos ? rutaVestidos(perfilSlug, 'archivo-rentas') : '/archivo-rentas'

  useEffect(() => {
    if (esVestidos) setModoPintar('fila')
  }, [esVestidos])
  const colsPrenda = useMemo(() => columnasPrenda(lineaNegocio), [lineaNegocio])
  const camposCelda = useMemo(() => camposRentaCelda(lineaNegocio), [lineaNegocio])
  const totalCols = useMemo(
    () => totalColumnasRentas(colsPrenda, 'activa', lineaNegocio),
    [colsPrenda, lineaNegocio],
  )

  const [rentas, setRentas] = useState<Renta[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modoPintar, setModoPintar] = useState<ModoPintar>(() =>
    lineaNegocio === 'vestidos' ? 'fila' : 'celda',
  )
  const [colorActivo, setColorActivo] = useState<EstatusCelda | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [rentaEditando, setRentaEditando] = useState<Renta | null>(null)
  const [rentaAbono, setRentaAbono] = useState<Renta | null>(null)
  const [docImpresion, setDocImpresion] = useState<DocumentoRenta | null>(null)
  const [notaModal, setNotaModal] = useState<{
    notaInicial: string
    resolve: (nota: string | null) => void
  } | null>(null)

  const semanas = useMemo(() => semanasVentanaActual(), [])

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

  const rentasFiltradas = useMemo(() => {
    const q = search.toLowerCase()
    return rentas.filter((r) => {
      if (!estaEnVentanaActual(r.fechaSalida)) return false
      if (!rentaCoincideTab(r, tabActiva, lineaNegocio)) return false
      if (!q) return true
      const texto = [
        r.id,
        r.tipoEntrega,
        r.fechaSalida,
        r.fechaRegreso,
        r.marca,
        ...camposCelda.map((c) => r[c].valor),
      ]
        .join(' ')
        .toLowerCase()
      return texto.includes(q)
    })
  }, [rentas, search, camposCelda, tabActiva, lineaNegocio])

  const rentasArchivadas = useMemo(
    () => rentas.filter((r) => esRentaPasada(r.fechaSalida)).length,
    [rentas],
  )

  const rentasPorSemana = useMemo(() => {
    const map = new Map<string, Renta[]>()
    for (const s of semanas) map.set(s.key, [])
    for (const r of rentasFiltradas) {
      const key = semanaKeyDesdeFechaSalida(r.fechaSalida) || r.semanaInicio
      const lista = map.get(key)
      if (lista) lista.push(r)
    }
    return map
  }, [semanas, rentasFiltradas])

  const buscando = search.trim().length > 0

  const semanasVisibles = useMemo(() => {
    if (!buscando) return semanas
    return semanas.filter((s) => (rentasPorSemana.get(s.key)?.length ?? 0) > 0)
  }, [semanas, rentasPorSemana, buscando])

  const total = rentasFiltradas.reduce(
    (sum, r) => (r.cancelada ? sum : sum + r.fondo + multaEfectiva(r)),
    0,
  )

  const sincronizar = async (id: string, cambios: Partial<Renta>, fallback: Renta) => {
    try {
      const actualizada = await updateRenta(id, cambios)
      setRentas((prev) => prev.map((r) => (r.id === id ? actualizada : r)))
    } catch {
      setRentas((prev) => prev.map((r) => (r.id === id ? fallback : r)))
      setErrorCarga('No se pudo guardar un cambio. Verifica la conexión con el servidor.')
    }
  }

  const solicitarNotaOtraSituacion = (notaInicial = '') =>
    new Promise<string | null>((resolve) => {
      setNotaModal({ notaInicial, resolve })
    })

  const cerrarNotaModal = (nota: string | null) => {
    notaModal?.resolve(nota)
    setNotaModal(null)
  }

  const notaInicialOtraSituacionFila = (renta: Renta) => {
    if (renta.estatusFila !== 'otra_situacion') return ''
    for (const campo of camposCelda) {
      const nota = renta[campo].nota?.trim()
      if (nota) return nota
    }
    return ''
  }

  const actualizarCelda = async (rentaId: string, campo: CampoRentaCelda, estatus: EstatusCelda) => {
    const renta = rentas.find((r) => r.id === rentaId)
    if (!renta || renta.cancelada) return

    let nota: string | undefined
    if (estatus === 'otra_situacion') {
      const notaInicial =
        renta[campo].estatus === 'otra_situacion' ? (renta[campo].nota ?? '') : ''
      nota = (await solicitarNotaOtraSituacion(notaInicial)) ?? undefined
      if (!nota) return
    }

    const anterior = renta
    const nuevaCelda = aplicarEstatusACelda(renta[campo], estatus, nota)
    const actualizada = { ...renta, [campo]: nuevaCelda }
    setRentas((prev) => prev.map((r) => (r.id === rentaId ? actualizada : r)))
    sincronizar(rentaId, { [campo]: nuevaCelda }, anterior)
  }

  const pintarFila = async (rentaId: string, estatus: EstatusCelda) => {
    const renta = rentas.find((r) => r.id === rentaId)
    if (!renta || renta.cancelada) return

    let notaFila: string | undefined
    if (estatus === 'otra_situacion') {
      notaFila = (await solicitarNotaOtraSituacion(notaInicialOtraSituacionFila(renta))) ?? undefined
      if (!notaFila) return
    }

    const anterior = renta
    const actualizada: Renta = {
      ...renta,
      estatusFila: estatus === 'normal' ? undefined : estatus,
    }
    for (const campo of camposCelda) {
      actualizada[campo] = aplicarEstatusACelda(renta[campo], estatus, notaFila)
    }
    setRentas((prev) => prev.map((r) => (r.id === rentaId ? actualizada : r)))

    const cambios: Partial<Renta> = {
      estatusFila: actualizada.estatusFila ?? ('' as Renta['estatusFila']),
    }
    for (const campo of camposCelda) {
      cambios[campo] = actualizada[campo]
    }
    sincronizar(rentaId, cambios, anterior)
  }

  const handleCrearRenta = async (payload: Omit<Renta, 'id'>) => {
    const nueva = await createRenta(payload)
    setRentas((prev) => [...prev, nueva])
  }

  const handleActualizarRenta = async (payload: Omit<Renta, 'id'>) => {
    if (!rentaEditando) return
    const actualizada = await updateRenta(rentaEditando.id, payload)
    setRentas((prev) => prev.map((r) => (r.id === rentaEditando.id ? actualizada : r)))
  }

  const abrirNueva = () => {
    setRentaEditando(null)
    setMostrarFormulario(true)
  }

  const abrirEditar = (renta: Renta) => {
    if (renta.cancelada) return
    setRentaEditando(renta)
    setMostrarFormulario(true)
  }

  const cancelarRentaHandler = async (renta: Renta) => {
    if (renta.cancelada) return
    const cliente = renta.cliente?.valor?.trim() || 'sin cliente'
    const ok = window.confirm(
      `¿Cancelar la renta #${renta.id} (${cliente})?\n\nEl registro se conservará y las piezas volverán a disponible en inventario.`,
    )
    if (!ok) return
    try {
      const actualizada = await cancelRenta(renta.id)
      setRentas((prev) => prev.map((r) => (r.id === renta.id ? actualizada : r)))
    } catch {
      setErrorCarga('No se pudo cancelar la renta. Verifica la conexión con el servidor.')
    }
  }

  const abrirImprimir = (renta: Renta) => {
    setDocImpresion(rentaADocumento(renta))
  }

  const abrirAbono = (renta: Renta) => {
    setRentaAbono(renta)
  }

  const guardarAbono = async (payload: Parameters<typeof registrarAbono>[1]) => {
    if (!rentaAbono) return
    const actualizada = await registrarAbono(rentaAbono.id, payload)
    setRentas((prev) => prev.map((r) => (r.id === actualizada.id ? actualizada : r)))
  }

  const etiquetaTab = etiquetaExportTab(tabActiva, lineaNegocio)

  const exportarExcel = () => {
    const { filas } = exportarRentasTab(rentasFiltradas, tabActiva, lineaNegocio)
    if (filas === 0) {
      window.alert(`No hay rentas de ${etiquetaTab} para exportar.`)
    }
  }

  const exportarPdf = async () => {
    if (rentasFiltradas.length === 0) {
      window.alert(`No hay rentas de ${etiquetaTab} para exportar.`)
      return
    }
    const mesKey = new Date().toISOString().slice(0, 7)
    const mesLabel = `Ventana actual · ${new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
    try {
      await exportarRentasReportePdf(rentasFiltradas, tabActiva, lineaNegocio, {
        mesKey,
        mesLabel,
      })
    } catch {
      window.alert('No se pudo generar el reporte PDF. Intenta de nuevo.')
    }
  }

  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setRentaEditando(null)
  }

  const modoPintarEfectivo: ModoPintar = esVestidos ? 'fila' : modoPintar
  const puedePintarFila = colorActivo !== null && modoPintarEfectivo === 'fila'
  const filaProps = {
    esVestidos,
    variant: 'activa' as const,
    puedePintarFila,
    colorActivo,
    modoPintar: modoPintarEfectivo,
    onPintarFila: pintarFila,
    onActualizarCelda: actualizarCelda,
    onEditar: abrirEditar,
    onAbono: abrirAbono,
    onImprimir: abrirImprimir,
    onCancelar: cancelarRentaHandler,
  }

  const primeraSemana = semanas[0]
  const ultimaSemana = semanas[semanas.length - 1]

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            {tituloRentas(lineaNegocio, tabActiva)}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {primeraSemana?.label} — {ultimaSemana?.label}
            <span className="ml-1 text-xs">
              (semana actual + {MESES_VENTANA_ADELANTE} meses)
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {rentasArchivadas > 0 && (
            <Link to={rutaArchivo} className="btn-secondary" title="Ver rentas pasadas">
              Archivo ({rentasArchivadas})
            </Link>
          )}
          <ExportRentasMenu
            disabled={cargando}
            onExportExcel={exportarExcel}
            onExportPdf={exportarPdf}
            titleExcel={`Exportar solo ${etiquetaTab} (CSV para Excel)`}
            titlePdf={`Reporte mensual de ${etiquetaTab} con gráficas`}
          />
          <button type="button" onClick={cargarRentas} className="btn-secondary" title="Recargar">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" className="btn-primary" onClick={abrirNueva}>
            <Plus className="h-4 w-4" />
            Agregar Nueva Renta
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

      <RentaFormModal
        open={mostrarFormulario}
        onClose={cerrarFormulario}
        renta={rentaEditando}
        onSubmit={rentaEditando ? handleActualizarRenta : handleCrearRenta}
      />

      <AbonoModal
        open={rentaAbono !== null}
        renta={rentaAbono}
        onClose={() => setRentaAbono(null)}
        onSubmit={guardarAbono}
      />

      <NotaOtraSituacionModal
        open={notaModal !== null}
        notaInicial={notaModal?.notaInicial ?? ''}
        onClose={() => cerrarNotaModal(null)}
        onGuardar={(nota) => cerrarNotaModal(nota)}
      />

      <div className="mb-4">
        <PaintToolbar
          lineaNegocio={lineaNegocio}
          modo={modoPintarEfectivo}
          onModoChange={setModoPintar}
          colorActivo={colorActivo}
          onColorChange={setColorActivo}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            {subtituloTabRentas(tabActiva)}
            {!cargando && (
              <span className="ml-2 font-normal text-gray-500">
                ({rentasFiltradas.length} en ventana
                {rentasArchivadas > 0 && (
                  <>
                    {' · '}
                    <Link to={rutaArchivo} className="text-brand-600 hover:underline">
                      {rentasArchivadas} en archivo
                    </Link>
                  </>
                )}
                )
              </span>
            )}
          </h3>
          <SearchInput value={search} onChange={setSearch} className="w-48" />
        </div>

        {cargando ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Cargando rentas…</div>
        ) : buscando && rentasFiltradas.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay rentas que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {semanasVisibles.map((semana) => (
                  <BloqueSemana
                    key={semana.key}
                    semana={semana}
                    rentas={rentasPorSemana.get(semana.key) ?? []}
                    columnasPrenda={colsPrenda}
                    totalCols={totalCols}
                    mostrarFilasVacias={!buscando}
                    {...filaProps}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-500">
            {buscando
              ? `${rentasFiltradas.length} coincidencias · solo semanas con resultados`
              : `${semanas.length} semanas en ventana · las vacías muestran ${FILAS_VACIAS_POR_SEMANA} filas en blanco`}
            {rentasArchivadas > 0 && (
              <>
                {' · '}
                <Link to={rutaArchivo} className="text-brand-600 hover:underline">
                  Ver archivo de rentas pasadas
                </Link>
              </>
            )}
          </p>
          <p className="text-sm font-medium text-gray-700">
            Total visible:{' '}
            <span className="text-brand-600">
              {total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
