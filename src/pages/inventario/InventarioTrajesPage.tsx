import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { createPieza, deletePieza, fetchPiezas, updatePieza } from '../../api/piezas'
import { fetchRentas } from '../../api/rentas'
import { PiezaFormModal } from '../../components/inventario/PiezaFormModal'
import { AvisoDisponibilidadInventario } from '../../components/inventario/AvisoDisponibilidad'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { avisoInventarioPieza } from '../../utils/disponibilidadPieza'
import { fondoInventarioPorEstatus } from '../../utils/inventarioEstatus'
import { TABS_INVENTARIO_TRAJES } from '../../utils/inventarioConfig'
import { coloresMeroUnicos } from '../../utils/inventarioSugerencias'
import { MARCAS_INVENTARIO, TALLAS_GENERAL } from '../../data/mockData'
import type { Renta } from '../../types'
import type { Pieza, TipoPiezaTraje } from '../../types/pieza'
import { REFERENCIA_TALLA_APROX, tallaAproxCoincide, tallaAproximada } from '../../utils/tallaAproximada'
import { formatearPantalonTraje } from '../../utils/pantalonCodigo'
import { useFinanzas } from '../../context/FinanzasContext'

const CELDA =
  'border border-gray-400 bg-white px-2 py-1.5 text-xs font-medium uppercase text-gray-900'

function FilaInventario({
  pieza,
  avisoRenta,
  onEditar,
  onEliminar,
  usarCodigosNuevosPantalon,
}: {
  pieza: Pieza
  avisoRenta?: string | null
  onEditar: (pieza: Pieza) => void
  onEliminar: (pieza: Pieza) => void
  usarCodigosNuevosPantalon: boolean
}) {
  const aprox = tallaAproximada(pieza.talla, pieza.tipo)
  const fondoFila = fondoInventarioPorEstatus(pieza.estatus)
  const tallaDisplay =
    pieza.tipo === 'pantalon'
      ? formatearPantalonTraje(pieza.talla, pieza, usarCodigosNuevosPantalon)
      : pieza.talla

  return (
    <tr className={fondoFila || undefined}>
      <td className="border border-gray-400 bg-gray-50 px-1 py-1.5 text-center">
        <div className="flex items-center justify-center gap-0.5">
          <button type="button" onClick={() => onEditar(pieza)} title="Editar pieza" className="rounded p-0.5 text-gray-500 hover:bg-white hover:text-brand-700">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onEliminar(pieza)} title="Eliminar pieza" className="rounded p-0.5 text-gray-500 hover:bg-white hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      <td className={CELDA}>{pieza.color}</td>
      <td className={`${CELDA} text-center font-bold`}>{tallaDisplay}</td>
      <td className={CELDA}>{pieza.marca || '—'}</td>
      <td className={CELDA}>{pieza.detalles || '—'}</td>
      <td className={`${CELDA} text-center`}>{pieza.conjunto || '—'}</td>
      <td className={`${CELDA} text-center`}>{pieza.codigoOld || '—'}</td>
      <td className={`${CELDA} text-center font-semibold`}>{pieza.codigoNew || '—'}</td>
      <td className={`${CELDA} text-center`}>
        <StatusBadge status={pieza.estatus} variant="inventario" />
        <AvisoDisponibilidadInventario texto={avisoRenta ?? null} />
      </td>
      <td className={`${CELDA} text-center font-bold text-brand-800`}>{aprox}</td>
    </tr>
  )
}

export function InventarioTrajesPage() {
  const { usarCodigosNuevosPantalon } = useFinanzas()
  const [piezas, setPiezas] = useState<Pieza[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tabActiva, setTabActiva] = useState<TipoPiezaTraje>('saco')
  const [colorSeleccionado, setColorSeleccionado] = useState<string | null>(null)
  const [marcasFiltro, setMarcasFiltro] = useState<string[]>([])
  const [tallasFiltro, setTallasFiltro] = useState<string[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [piezaEditando, setPiezaEditando] = useState<Pieza | null>(null)
  const [rentas, setRentas] = useState<Renta[]>([])

  const cargarPiezas = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const [data, rentasData] = await Promise.all([
        fetchPiezas({ ordering: 'color,talla' }),
        fetchRentas(),
      ])
      setPiezas(data)
      setRentas(rentasData)
    } catch {
      setErrorCarga('No se pudo cargar el inventario. Verifica que el servidor esté activo.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarPiezas()
  }, [cargarPiezas])

  const piezasTab = useMemo(
    () => piezas.filter((p) => p.tipo === tabActiva),
    [piezas, tabActiva],
  )

  const coloresDisponibles = useMemo(() => coloresMeroUnicos(piezasTab), [piezasTab])

  useEffect(() => {
    if (colorSeleccionado && !coloresDisponibles.includes(colorSeleccionado)) {
      setColorSeleccionado(null)
    }
  }, [tabActiva, colorSeleccionado, coloresDisponibles])

  const marcasDisponibles = useMemo(() => {
    const delApi = [
      ...new Set(piezasTab.map((p) => p.marca).filter(Boolean)),
    ].sort()
    return delApi.length > 0 ? delApi : [...MARCAS_INVENTARIO]
  }, [piezasTab])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const colorFiltro = colorSeleccionado

    return piezasTab
      .filter((p) => {
        const aprox = tallaAproximada(p.talla, p.tipo)
        const texto = [p.color, p.talla, aprox, p.marca, p.detalles, p.conjunto, p.codigoOld, p.codigoNew, p.estatus]
          .join(' ')
          .toLowerCase()
        const matchSearch = texto.includes(q)
        const colorMero = p.color.toUpperCase()
        const matchColor = !colorFiltro || colorMero === colorFiltro
        const matchMarca = marcasFiltro.length === 0 || marcasFiltro.includes(p.marca)
        const matchTalla = tallaAproxCoincide(aprox, tallasFiltro)
        return matchSearch && matchColor && matchMarca && matchTalla
      })
      .sort((a, b) => a.color.localeCompare(b.color, 'es') || a.talla.localeCompare(b.talla, 'es'))
  }, [piezasTab, search, colorSeleccionado, marcasFiltro, tallasFiltro])

  const conteoPorTipo = useMemo(() => {
    const counts: Record<TipoPiezaTraje, number> = { saco: 0, chaleco: 0, pantalon: 0 }
    for (const p of piezas) {
      if (p.tipo in counts) counts[p.tipo as TipoPiezaTraje] += 1
    }
    return counts
  }, [piezas])

  const avisosPorPieza = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of piezas) {
      const aviso = avisoInventarioPieza(p.id, rentas)
      if (aviso) map.set(p.id, aviso)
    }
    return map
  }, [piezas, rentas])

  const toggleEnLista = (lista: string[], valor: string, setter: (v: string[]) => void) => {
    setter(lista.includes(valor) ? lista.filter((t) => t !== valor) : [...lista, valor])
  }

  const handleEliminar = async (pieza: Pieza) => {
    if (!window.confirm(`¿Eliminar ${pieza.tipo} ${pieza.color} ${pieza.talla}?`)) return
    try {
      await deletePieza(pieza.id)
      setPiezas((prev) => prev.filter((p) => p.id !== pieza.id))
    } catch {
      setErrorCarga('No se pudo eliminar la pieza.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Inventario de Trajes</h2>
          <p className="mt-1 text-sm text-gray-500">
            {cargando
              ? 'Cargando…'
              : `${filtered.length} piezas en ${TABS_INVENTARIO_TRAJES.find((t) => t.tipo === tabActiva)?.label} · ${piezas.length} total`}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={cargarPiezas} disabled={cargando} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" className="btn-primary" onClick={() => { setPiezaEditando(null); setMostrarFormulario(true) }}>
            <Plus className="h-4 w-4" />
            Agregar pieza
          </button>
        </div>
      </div>

      {errorCarga && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorCarga}</p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS_INVENTARIO_TRAJES.map((tab) => (
          <button
            key={tab.tipo}
            type="button"
            onClick={() => setTabActiva(tab.tipo)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold uppercase transition-colors ${
              tabActiva === tab.tipo ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">{conteoPorTipo[tab.tipo]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="card space-y-5 p-4">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase text-gray-500">Color</h4>
            {coloresDisponibles.length === 0 ? (
              <p className="text-xs text-gray-500">
                Sin colores en esta categoría. Al agregar piezas aparecerán aquí.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coloresDisponibles.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorSeleccionado(color === colorSeleccionado ? null : color)}
                    className={`rounded border px-2 py-1 text-xs font-semibold uppercase ${
                      colorSeleccionado === color
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase text-gray-500">Talla aprox.</h4>
            <div className="flex flex-wrap gap-2">
              {TALLAS_GENERAL.map((talla) => (
                <label key={talla} className={`flex cursor-pointer items-center rounded border px-2 py-1 text-sm ${tallasFiltro.includes(talla) ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700' : 'border-gray-200 text-gray-700'}`}>
                  <input type="checkbox" checked={tallasFiltro.includes(talla)} onChange={() => toggleEnLista(tallasFiltro, talla, setTallasFiltro)} className="sr-only" />
                  {talla}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
              {tabActiva === 'pantalon' ? REFERENCIA_TALLA_APROX.pantalon : REFERENCIA_TALLA_APROX.saco}
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase text-gray-500">Marca</h4>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {marcasDisponibles.map((marca) => (
                <label key={marca} className="flex items-center gap-2 text-xs text-gray-700">
                  <input type="checkbox" checked={marcasFiltro.includes(marca)} onChange={() => toggleEnLista(marcasFiltro, marca, setMarcasFiltro)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                  {marca}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              {TABS_INVENTARIO_TRAJES.find((t) => t.tipo === tabActiva)?.label}
            </h3>
            <SearchInput value={search} onChange={setSearch} className="w-56" />
          </div>
          <div className="overflow-x-auto p-4">
            {cargando && piezas.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">Cargando inventario…</p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">
                {piezas.length === 0 ? 'No hay piezas. Agrega la primera con el botón de arriba.' : 'Ninguna pieza coincide con los filtros.'}
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-left text-xs font-bold uppercase text-white">
                    <th className="border border-gray-700 px-2 py-2 min-w-[56px]" />
                    <th className="border border-gray-700 px-2 py-2">Color</th>
                    <th className="border border-gray-700 px-2 py-2">Talla</th>
                    <th className="border border-gray-700 px-2 py-2">Marca</th>
                    <th className="border border-gray-700 px-2 py-2">Detalles</th>
                    <th className="border border-gray-700 px-2 py-2">Conjunto</th>
                    <th className="border border-gray-700 px-2 py-2">Cód. Old</th>
                    <th className="border border-gray-700 px-2 py-2">Cód. New</th>
                    <th className="border border-gray-700 px-2 py-2">Estatus</th>
                    <th className="border border-gray-700 px-2 py-2">Talla aprox.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((pieza) => (
                    <FilaInventario
                      key={pieza.id}
                      pieza={pieza}
                      avisoRenta={avisosPorPieza.get(pieza.id)}
                      onEditar={(p) => { setPiezaEditando(p); setMostrarFormulario(true) }}
                      onEliminar={handleEliminar}
                      usarCodigosNuevosPantalon={usarCodigosNuevosPantalon}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <PiezaFormModal
        open={mostrarFormulario}
        onClose={() => setMostrarFormulario(false)}
        pieza={piezaEditando}
        tipoInicial={tabActiva}
        onSubmit={async (payload) => {
          if (piezaEditando) {
            const actualizada = await updatePieza(piezaEditando.id, payload)
            setPiezas((prev) => prev.map((p) => (p.id === piezaEditando.id ? actualizada : p)))
          } else {
            const nueva = await createPieza(payload)
            setPiezas((prev) => [...prev, nueva])
          }
        }}
      />
    </div>
  )
}
