import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { createPieza, deletePieza, fetchPiezas, updatePieza } from '../../api/piezas'
import { fetchRentas } from '../../api/rentas'
import { VestidoPiezaFormModal } from '../../components/inventario/VestidoPiezaFormModal'
import { AvisoDisponibilidadInventario } from '../../components/inventario/AvisoDisponibilidad'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { usePerfilVestido } from '../../context/PerfilVestidoContext'
import { coloresMeroUnicos } from '../../utils/inventarioSugerencias'
import { avisoInventarioPieza } from '../../utils/disponibilidadPieza'
import { fondoInventarioPorEstatus } from '../../utils/inventarioEstatus'
import { etiquetaPerfilLegible, slugDesdeTipoVestido } from '../../utils/perfilVestido'
import type { Renta } from '../../types'
import type { Pieza } from '../../types/pieza'

function formatMoney(n: number) {
  if (!n) return '—'
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

function ordenarTallas(a: string, b: string): number {
  const na = parseInt(a, 10)
  const nb = parseInt(b, 10)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  return a.localeCompare(b, 'es')
}

function toggleEnLista(lista: string[], valor: string, setter: (v: string[]) => void) {
  setter(lista.includes(valor) ? lista.filter((t) => t !== valor) : [...lista, valor])
}

const CELDA = 'border border-gray-400 bg-white px-2 py-1.5 text-xs font-medium uppercase text-gray-900'

export function InventarioVestidosPage() {
  const { tipoVestido } = usePerfilVestido()
  const [piezas, setPiezas] = useState<Pieza[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [search, setSearch] = useState('')
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
        fetchPiezas({ tipo: tipoVestido, ordering: 'marca,color,talla' }),
        fetchRentas({ categoria_vestido: tipoVestido }),
      ])
      setPiezas(data)
      setRentas(rentasData)
    } catch {
      setErrorCarga('No se pudo cargar el inventario.')
    } finally {
      setCargando(false)
    }
  }, [tipoVestido])

  useEffect(() => {
    cargarPiezas()
  }, [cargarPiezas])

  useEffect(() => {
    setColorSeleccionado(null)
    setMarcasFiltro([])
    setTallasFiltro([])
    setSearch('')
  }, [tipoVestido])

  const piezasTab = piezas

  const marcasDisponibles = useMemo(
    () =>
      [...new Set(piezasTab.map((p) => p.marca).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [piezasTab],
  )

  const coloresMeroDisponibles = useMemo(
    () => coloresMeroUnicos(piezasTab),
    [piezasTab],
  )

  const coloresMeroInventario = useMemo(() => coloresMeroUnicos(piezas), [piezas])

  const tallasDisponibles = useMemo(
    () =>
      [...new Set(piezasTab.map((p) => p.talla).filter(Boolean))].sort(ordenarTallas),
    [piezasTab],
  )

  useEffect(() => {
    if (colorSeleccionado && !coloresMeroDisponibles.includes(colorSeleccionado)) {
      setColorSeleccionado(null)
    }
  }, [tipoVestido, colorSeleccionado, coloresMeroDisponibles])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const colorFiltro = colorSeleccionado

    return piezasTab
      .filter((p) => {
        const texto = [
          p.marca,
          p.codigoNew,
          p.color,
          p.colorVestido,
          p.talla,
          p.detalles,
          p.estatus,
          String(p.precioRenta ?? ''),
          String(p.precioPremier ?? ''),
          String(p.precioVenta ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        const matchSearch = texto.includes(q)
        const colorMero = p.color.toUpperCase()
        const matchColor = !colorFiltro || colorMero === colorFiltro
        const matchMarca = marcasFiltro.length === 0 || marcasFiltro.includes(p.marca)
        const matchTalla = tallasFiltro.length === 0 || tallasFiltro.includes(p.talla)
        return matchSearch && matchColor && matchMarca && matchTalla
      })
      .sort(
        (a, b) =>
          a.marca.localeCompare(b.marca, 'es') ||
          a.color.localeCompare(b.color, 'es') ||
          ordenarTallas(a.talla, b.talla),
      )
  }, [piezasTab, search, colorSeleccionado, marcasFiltro, tallasFiltro])

  const tabLabel = etiquetaPerfilLegible(slugDesdeTipoVestido(tipoVestido))

  const avisosPorPieza = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of piezas) {
      const aviso = avisoInventarioPieza(p.id, rentas)
      if (aviso) map.set(p.id, aviso)
    }
    return map
  }, [piezas, rentas])

  const handleEliminar = async (pieza: Pieza) => {
    if (!window.confirm(`¿Eliminar vestido ${pieza.marca} ${pieza.codigoNew}?`)) return
    try {
      await deletePieza(pieza.id)
      setPiezas((prev) => prev.filter((p) => p.id !== pieza.id))
    } catch {
      setErrorCarga('No se pudo eliminar.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Inventario de Vestidos</h2>
          <p className="mt-1 text-sm text-gray-500">
            {cargando
              ? 'Cargando…'
              : `${filtered.length} en ${tabLabel}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={cargarPiezas} disabled={cargando} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setPiezaEditando(null)
              setMostrarFormulario(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Agregar vestido
          </button>
        </div>
      </div>

      {errorCarga && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorCarga}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="card space-y-5 p-4">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase text-gray-500">Color mero</h4>
            {coloresMeroDisponibles.length === 0 ? (
              <p className="text-xs text-gray-500">
                Sin colores en esta categoría. Al agregar vestidos aparecerán aquí.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coloresMeroDisponibles.map((color) => (
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
            <h4 className="mb-3 text-xs font-semibold uppercase text-gray-500">Talla</h4>
            {tallasDisponibles.length === 0 ? (
              <p className="text-xs text-gray-500">Sin tallas registradas en esta categoría.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tallasDisponibles.map((talla) => (
                  <label
                    key={talla}
                    className={`flex cursor-pointer items-center rounded border px-2 py-1 text-sm ${
                      tallasFiltro.includes(talla)
                        ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tallasFiltro.includes(talla)}
                      onChange={() => toggleEnLista(tallasFiltro, talla, setTallasFiltro)}
                      className="sr-only"
                    />
                    {talla}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase text-gray-500">Marca</h4>
            {marcasDisponibles.length === 0 ? (
              <p className="text-xs text-gray-500">Sin marcas registradas en esta categoría.</p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {marcasDisponibles.map((marca) => (
                  <label key={marca} className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={marcasFiltro.includes(marca)}
                      onChange={() => toggleEnLista(marcasFiltro, marca, setMarcasFiltro)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {marca}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{tabLabel}</h3>
            <SearchInput value={search} onChange={setSearch} className="w-56" placeholder="Buscar marca, código, color…" />
          </div>

          <div className="overflow-x-auto p-4">
            {cargando && piezas.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">Cargando inventario…</p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">
                {piezas.length === 0
                  ? 'Sin artículos. Agrega el primero con el botón de arriba.'
                  : 'Ningún vestido coincide con los filtros.'}
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-left text-xs font-bold uppercase text-white">
                    <th className="border border-gray-700 px-2 py-2 min-w-[56px]" />
                    <th className="border border-gray-700 px-2 py-2">Marca</th>
                    <th className="border border-gray-700 px-2 py-2">Código</th>
                    <th className="border border-gray-700 px-2 py-2">Color mero</th>
                    <th className="border border-gray-700 px-2 py-2">Color vestido</th>
                    <th className="border border-gray-700 px-2 py-2">Talla</th>
                    <th className="border border-gray-700 px-2 py-2">Precio renta</th>
                    <th className="border border-gray-700 px-2 py-2">Precio premier</th>
                    <th className="border border-gray-700 px-2 py-2">Precio venta</th>
                    <th className="border border-gray-700 px-2 py-2 min-w-[140px]">Detalles</th>
                    <th className="border border-gray-700 px-2 py-2">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((pieza) => {
                    const fondoFila = fondoInventarioPorEstatus(pieza.estatus)
                    return (
                    <tr key={pieza.id} className={fondoFila || undefined}>
                      <td className="border border-gray-400 bg-gray-50 px-1 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPiezaEditando(pieza)
                              setMostrarFormulario(true)
                            }}
                            className="rounded p-0.5 text-gray-500 hover:bg-white hover:text-brand-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(pieza)}
                            className="rounded p-0.5 text-gray-500 hover:bg-white hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className={CELDA}>{pieza.marca || '—'}</td>
                      <td className={`${CELDA} text-center font-semibold`}>{pieza.codigoNew || '—'}</td>
                      <td className={CELDA}>{pieza.color}</td>
                      <td className={CELDA}>{pieza.colorVestido || '—'}</td>
                      <td className={`${CELDA} text-center font-bold`}>{pieza.talla}</td>
                      <td className={`${CELDA} text-right normal-case`}>{formatMoney(pieza.precioRenta ?? 0)}</td>
                      <td className={`${CELDA} text-right normal-case`}>{formatMoney(pieza.precioPremier ?? 0)}</td>
                      <td className={`${CELDA} text-right normal-case`}>{formatMoney(pieza.precioVenta ?? 0)}</td>
                      <td className={CELDA}>{pieza.detalles || '—'}</td>
                      <td className={`${CELDA} text-center`}>
                        <StatusBadge status={pieza.estatus} variant="inventario" />
                        <AvisoDisponibilidadInventario texto={avisosPorPieza.get(pieza.id) ?? null} />
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <VestidoPiezaFormModal
        open={mostrarFormulario}
        onClose={() => setMostrarFormulario(false)}
        pieza={piezaEditando}
        tipoInicial={tipoVestido}
        bloquearTipo
        coloresSugeridos={coloresMeroInventario}
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
