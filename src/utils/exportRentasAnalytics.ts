import type { LineaNegocio } from '../types/auth'
import type { Renta } from '../types'
import { multaEfectiva } from './multa'
import { tipoOperacionDesdeRenta } from './precioVestido'
import type { TipoOperacionVestido } from './precioVestido'

export interface TopItem {
  valor: string
  count: number
}

export interface RentasReportAnalytics {
  totalOperaciones: number
  totalActivas: number
  totalCanceladas: number
  porTipo: Record<TipoOperacionVestido, number>
  totalIngresos: number
  topSaco: TopItem[]
  topChaleco: TopItem[]
  topColor: TopItem[]
  labels: {
    saco: string
    chaleco: string
    color: string
  }
}

function contarTop(rentas: Renta[], getter: (r: Renta) => string, limit = 5): TopItem[] {
  const map = new Map<string, { display: string; count: number }>()
  for (const r of rentas) {
    if (r.cancelada) continue
    const raw = getter(r).trim()
    if (!raw) continue
    const key = raw.toLowerCase()
    const prev = map.get(key)
    if (prev) prev.count += 1
    else map.set(key, { display: raw, count: 1 })
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ display, count }) => ({ valor: display, count }))
}

export function analizarRentasParaReporte(
  rentas: Renta[],
  linea: LineaNegocio,
): RentasReportAnalytics {
  const esVestidos = linea === 'vestidos'
  const activas = rentas.filter((r) => !r.cancelada)

  const porTipo: Record<TipoOperacionVestido, number> = {
    renta: 0,
    venta: 0,
    premier: 0,
    sesion_fotos: 0,
    patrocinio: 0,
  }

  for (const r of activas) {
    const tipo = tipoOperacionDesdeRenta(r, esVestidos)
    porTipo[tipo] += 1
  }

  const totalIngresos = activas.reduce(
    (sum, r) => sum + r.fondo + multaEfectiva(r),
    0,
  )

  const labels = esVestidos
    ? { saco: 'Código', chaleco: 'Color vestido', color: 'Color mero' }
    : { saco: 'Saco', chaleco: 'Chaleco', color: 'Color' }

  return {
    totalOperaciones: rentas.length,
    totalActivas: activas.length,
    totalCanceladas: rentas.length - activas.length,
    porTipo,
    totalIngresos,
    topSaco: contarTop(activas, (r) => r.saco.valor),
    topChaleco: contarTop(activas, (r) => r.chaleco.valor),
    topColor: contarTop(activas, (r) => r.color.valor),
    labels,
  }
}
