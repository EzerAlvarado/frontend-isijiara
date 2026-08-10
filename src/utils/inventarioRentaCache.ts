import { fetchPiezas } from '../api/piezas'
import { fetchRentas } from '../api/rentas'
import type { Renta } from '../types'
import type { Pieza } from '../types/pieza'

interface InventarioRentaCache {
  piezas: Pieza[]
  rentas: Renta[]
  cargadoEn: number
}

let cache: InventarioRentaCache | null = null
let cargaEnCurso: Promise<InventarioRentaCache> | null = null

const TTL_MS = 5 * 60 * 1000

function cacheVigente(data: InventarioRentaCache | null): data is InventarioRentaCache {
  if (!data) return false
  return Date.now() - data.cargadoEn < TTL_MS
}

async function cargarInventarioRenta(): Promise<InventarioRentaCache> {
  const [piezas, rentas] = await Promise.all([fetchPiezas(), fetchRentas()])
  const data = { piezas, rentas, cargadoEn: Date.now() }
  cache = data
  return data
}

/** Precarga inventario + rentas activas para evitar fallos en la primera acción del día. */
export function prefetchInventarioRenta(force = false): Promise<InventarioRentaCache> {
  if (!force && cacheVigente(cache)) {
    return Promise.resolve(cache)
  }
  if (!force && cargaEnCurso) {
    return cargaEnCurso
  }
  cargaEnCurso = cargarInventarioRenta()
    .catch((err) => {
      cargaEnCurso = null
      throw err
    })
    .then((data) => {
      cargaEnCurso = null
      return data
    })
  return cargaEnCurso
}

export function leerInventarioRentaCache(): InventarioRentaCache | null {
  return cacheVigente(cache) ? cache : null
}

export function invalidarInventarioRentaCache() {
  cache = null
  cargaEnCurso = null
}
