import type { Pieza, TipoPieza, TipoPiezaVestido } from '../types/pieza'
import { normalizarTipoVestido } from '../types/pieza'
import { formatearPantalonTraje, tallaSinCodigo } from './pantalonCodigo'

function normalizar(s: string): string {
  return s.trim().toUpperCase()
}

export function coloresCoinciden(a: string, b: string): boolean {
  const x = normalizar(a)
  const y = normalizar(b)
  if (!x || !y) return true
  return x === y || x.includes(y) || y.includes(x)
}

export function piezaValida(valor: string): boolean {
  const v = normalizar(valor)
  return Boolean(v) && !['X', '—', '-', 'NO', 'N/A'].includes(v)
}

function filtrarPool(
  piezas: Pieza[],
  tipo: TipoPieza,
  color: string,
  marca: string,
  talla?: string,
): Pieza[] {
  const tallaNorm = talla?.trim()
    ? tipo === 'pantalon'
      ? normalizar(tallaSinCodigo(talla))
      : normalizar(talla)
    : ''
  return piezas.filter((p) => {
    if (p.tipo !== tipo) return false
    if (p.estatus === 'mantenimiento') return false
    if (color.trim() && !coloresCoinciden(p.color, color)) return false
    if (marca.trim() && p.marca && normalizar(p.marca) !== normalizar(marca)) return false
    if (tallaNorm && piezaValida(tallaNorm) && normalizar(p.talla) !== tallaNorm) return false
    return true
  })
}

/** Valores únicos de marca para autocompletar según tipo, color y talla (opcional) */
export function sugerenciasMarca(
  piezas: Pieza[],
  tipo: TipoPieza,
  color: string,
  talla: string,
  texto: string,
  limite = 8,
): string[] {
  const q = normalizar(texto)
  const pool = filtrarPool(piezas, tipo, color, '', talla.trim() ? talla : undefined)
  const valores = new Set<string>()

  for (const p of pool) {
    const v = (p.marca ?? '').trim()
    if (!v) continue
    if (!q || normalizar(v).includes(q) || normalizar(v).startsWith(q)) {
      valores.add(v.toUpperCase())
    }
  }

  return [...valores]
    .sort((a, b) => {
      if (!q) return a.localeCompare(b, 'es')
      const aStarts = a.startsWith(q)
      const bStarts = b.startsWith(q)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return a.localeCompare(b, 'es')
    })
    .slice(0, limite)
}

/** Valores únicos de talla para autocompletar según tipo, color y marca */
export function sugerenciasTalla(
  piezas: Pieza[],
  tipo: TipoPieza,
  color: string,
  marca: string,
  texto: string,
  limite = 8,
  usarCodigosNuevosPantalon = false,
): string[] {
  const q = normalizar(texto)
  const qBase = tipo === 'pantalon' ? normalizar(tallaSinCodigo(texto)) : q
  const pool = filtrarPool(piezas, tipo, color, marca)
  const valores = new Set<string>()

  for (const p of pool) {
    const v =
      tipo === 'pantalon'
        ? formatearPantalonTraje(p.talla, p, usarCodigosNuevosPantalon)
        : (p.talla ?? '').trim()
    if (!piezaValida(v)) continue
    const vNorm = normalizar(v)
    const vBase = tipo === 'pantalon' ? normalizar(tallaSinCodigo(v)) : vNorm
    if (
      !q ||
      vNorm.includes(q) ||
      vNorm.startsWith(q) ||
      (tipo === 'pantalon' && (vBase.includes(qBase) || vBase.startsWith(qBase)))
    ) {
      valores.add(v.toUpperCase())
    }
  }

  return [...valores]
    .sort((a, b) => {
      if (!q) return a.localeCompare(b, 'es')
      const aStarts = a.startsWith(q) || (tipo === 'pantalon' && a.startsWith(qBase))
      const bStarts = b.startsWith(q) || (tipo === 'pantalon' && b.startsWith(qBase))
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return a.localeCompare(b, 'es')
    })
    .slice(0, limite)
}

export function buscarPieza(
  piezas: Pieza[],
  tipo: TipoPieza,
  color: string,
  marca: string,
  talla: string,
): Pieza | undefined {
  const v = tipo === 'pantalon' ? normalizar(tallaSinCodigo(talla)) : normalizar(talla)
  if (!v) return undefined
  const pool = filtrarPool(piezas, tipo, color, marca)
  return pool.find((p) => normalizar(p.talla) === v)
}

export interface PiezasResueltas {
  saco?: Pieza
  chaleco?: Pieza
  pantalon?: Pieza
}

/** Encuentra piezas en inventario según color/marca/talla de cada prenda */
export function resolverPiezasDesdeFormulario(
  piezas: Pieza[],
  saco: { color: string; marca: string; talla: string },
  chaleco: { color: string; marca: string; talla: string },
  pantalon: { color: string; marca: string; talla: string },
): PiezasResueltas {
  const out: PiezasResueltas = {}

  if (piezaValida(saco.talla)) {
    out.saco = buscarPieza(piezas, 'saco', saco.color, saco.marca, saco.talla)
  }
  if (piezaValida(chaleco.talla)) {
    out.chaleco = buscarPieza(piezas, 'chaleco', chaleco.color, chaleco.marca, chaleco.talla)
  }
  if (piezaValida(pantalon.talla)) {
    out.pantalon = buscarPieza(piezas, 'pantalon', pantalon.color, pantalon.marca, pantalon.talla)
  }

  return out
}

function codigoPieza(p: Pieza): string {
  return normalizar(p.codigoNew || p.codigoOld || '')
}

export interface FiltrosVestido {
  color?: string
  marca?: string
  talla?: string
  codigo?: string
}

export function piezasVestidoFiltradas(
  piezas: Pieza[],
  tipo: TipoPieza,
  filtros: FiltrosVestido,
  incluirNoDisponibles = false,
): Pieza[] {
  return piezas.filter((p) => {
    if (p.tipo !== tipo) return false
    if (!incluirNoDisponibles && p.estatus === 'mantenimiento') return false
    if (filtros.color?.trim() && !coloresCoinciden(p.color, filtros.color)) return false
    if (filtros.marca?.trim() && p.marca && normalizar(p.marca) !== normalizar(filtros.marca)) {
      if (!normalizar(p.marca).includes(normalizar(filtros.marca))) return false
    }
    if (filtros.talla?.trim() && piezaValida(filtros.talla)) {
      if (normalizar(p.talla) !== normalizar(filtros.talla)) return false
    }
    if (filtros.codigo?.trim()) {
      const cod = normalizar(filtros.codigo)
      if (codigoPieza(p) !== cod && !codigoPieza(p).includes(cod)) return false
    }
    return true
  })
}

/** Colores mero únicos ya registrados en inventario (orden alfabético). */
export function coloresMeroUnicos(
  piezas: Pieza[],
  tipo?: TipoPiezaVestido,
): string[] {
  const pool = tipo
    ? piezas.filter((p) => normalizarTipoVestido(p.tipo) === tipo)
    : piezas
  const valores = new Set<string>()
  for (const p of pool) {
    const v = (p.color ?? '').trim()
    if (v) valores.add(v.toUpperCase())
  }
  return [...valores].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Valores únicos de color mero en inventario */
export function sugerenciasColorMero(
  piezas: Pieza[],
  tipo: TipoPieza,
  filtros: Omit<FiltrosVestido, 'color'>,
  texto: string,
  limite = 8,
): string[] {
  const q = normalizar(texto)
  const pool = piezasVestidoFiltradas(piezas, tipo, filtros)
  const valores = new Set<string>()

  for (const p of pool) {
    const v = (p.color ?? '').trim()
    if (!v) continue
    if (!q || normalizar(v).includes(q) || normalizar(v).startsWith(q)) {
      valores.add(v.toUpperCase())
    }
  }

  return [...valores]
    .sort((a, b) => {
      if (!q) return a.localeCompare(b, 'es')
      const aStarts = a.startsWith(q)
      const bStarts = b.startsWith(q)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return a.localeCompare(b, 'es')
    })
    .slice(0, limite)
}

/** Valores únicos de código en inventario */
export function sugerenciasCodigo(
  piezas: Pieza[],
  tipo: TipoPieza,
  filtros: Omit<FiltrosVestido, 'codigo'>,
  texto: string,
  limite = 8,
): string[] {
  const q = normalizar(texto)
  const pool = piezasVestidoFiltradas(piezas, tipo, filtros)
  const valores = new Set<string>()

  for (const p of pool) {
    const v = (p.codigoNew || p.codigoOld || '').trim()
    if (!v) continue
    if (!q || normalizar(v).includes(q) || normalizar(v).startsWith(q)) {
      valores.add(v.toUpperCase())
    }
  }

  return [...valores]
    .sort((a, b) => {
      if (!q) return a.localeCompare(b, 'es')
      const aStarts = a.startsWith(q)
      const bStarts = b.startsWith(q)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return a.localeCompare(b, 'es')
    })
    .slice(0, limite)
}

/** Piezas completas que coinciden (para elegir y llenar todo el formulario) */
export function piezasVestidoCoincidentes(
  piezas: Pieza[],
  tipo: TipoPieza,
  filtros: FiltrosVestido,
  limite = 12,
): Pieza[] {
  const qColor = filtros.color?.trim()
  const qMarca = filtros.marca?.trim()
  const qCodigo = filtros.codigo?.trim()
  const qTalla = filtros.talla?.trim()

  if (!qColor && !qMarca && !qCodigo && !qTalla) return []

  return piezasVestidoFiltradas(piezas, tipo, filtros)
    .sort((a, b) => {
      const cmpMarca = a.marca.localeCompare(b.marca, 'es')
      if (cmpMarca) return cmpMarca
      return a.color.localeCompare(b.color, 'es')
    })
    .slice(0, limite)
}

export function buscarPiezaVestido(
  piezas: Pieza[],
  tipo: TipoPieza,
  color: string,
  marca: string,
  talla: string,
  codigo: string,
): Pieza | undefined {
  const pool = piezasVestidoFiltradas(piezas, tipo, { color, marca, talla, codigo })
  if (pool.length === 0) return undefined
  if (pool.length === 1) return pool[0]

  const cod = normalizar(codigo)
  if (cod) {
    const porCodigo = pool.find((p) => codigoPieza(p) === cod)
    if (porCodigo) return porCodigo
  }
  if (piezaValida(talla)) {
    const porTalla = pool.find((p) => normalizar(p.talla) === normalizar(talla))
    if (porTalla) return porTalla
  }
  if (marca.trim()) {
    const porMarca = pool.filter((p) => normalizar(p.marca) === normalizar(marca))
    if (porMarca.length === 1) return porMarca[0]
  }
  if (color.trim()) {
    const porColor = pool.filter((p) => coloresCoinciden(p.color, color))
    if (porColor.length === 1) return porColor[0]
  }
  return undefined
}

/** Valores únicos de color vestido (descripción) en inventario */
export function sugerenciasColorVestido(
  piezas: Pieza[],
  tipo: TipoPieza,
  filtros: FiltrosVestido,
  texto: string,
  limite = 8,
): string[] {
  const q = normalizar(texto)
  const pool = piezasVestidoFiltradas(piezas, tipo, filtros)
  const valores = new Set<string>()

  for (const p of pool) {
    const v = (p.colorVestido ?? '').trim()
    if (!v) continue
    if (!q || normalizar(v).includes(q) || normalizar(v).startsWith(q)) {
      valores.add(v.toUpperCase())
    }
  }

  return [...valores]
    .sort((a, b) => {
      if (!q) return a.localeCompare(b, 'es')
      const aStarts = a.startsWith(q)
      const bStarts = b.startsWith(q)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return a.localeCompare(b, 'es')
    })
    .slice(0, limite)
}

/** Valores únicos de detalles (nombre descriptivo) en inventario de trajes */
export function sugerenciasDetalles(
  piezas: Pieza[],
  texto: string,
  limite = 10,
): string[] {
  const q = normalizar(texto)
  const valores = new Set<string>()

  for (const p of piezas) {
    if (p.estatus === 'mantenimiento') continue
    const v = (p.detalles ?? '').trim()
    if (!v) continue
    const vNorm = normalizar(v)
    if (!q || vNorm.includes(q) || q.split(/\s+/).every((palabra) => vNorm.includes(palabra))) {
      valores.add(v.toUpperCase())
    }
  }

  return [...valores]
    .sort((a, b) => {
      if (!q) return a.localeCompare(b, 'es')
      const aNorm = normalizar(a)
      const bNorm = normalizar(b)
      const aStarts = aNorm.startsWith(q)
      const bStarts = bNorm.startsWith(q)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return a.localeCompare(b, 'es')
    })
    .slice(0, limite)
}

/** Busca pieza por detalles (nombre descriptivo) */
export function buscarPiezaPorDetalles(
  piezas: Pieza[],
  tipo: TipoPieza,
  detalles: string,
): Pieza | undefined {
  const d = normalizar(detalles)
  if (!d) return undefined
  return piezas.find(
    (p) => p.tipo === tipo && p.estatus !== 'mantenimiento' && normalizar(p.detalles) === d,
  )
}

/** Busca conjunto completo de piezas (saco, chaleco, pantalon) por campo detalles */
export function buscarConjuntoPorDetalles(
  piezas: Pieza[],
  detalles: string,
): { saco?: Pieza; chaleco?: Pieza; pantalon?: Pieza } {
  const d = normalizar(detalles)
  if (!d) return {}

  const piezasCoincidentes = piezas.filter(
    (p) => p.estatus !== 'mantenimiento' && normalizar(p.detalles) === d,
  )

  const saco = piezasCoincidentes.find((p) => p.tipo === 'saco')
  const chaleco = piezasCoincidentes.find(
    (p) => p.tipo === 'chaleco' && (!saco || p.conjunto === saco.conjunto),
  )
  const pantalon = piezasCoincidentes.find(
    (p) => p.tipo === 'pantalon' && (!saco || p.conjunto === saco.conjunto),
  )

  return { saco, chaleco, pantalon }
}

/** @deprecated usar sugerenciasTalla */
export type CampoPiezaInventario = 'saco' | 'chaleco' | 'pantalon'
