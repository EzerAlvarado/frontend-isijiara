import type { EstatusCelda, EstatusInventario } from '../types'
import { estatusCeldaBg, estatusCeldaLabels } from './estatusCelda'

export const ESTATUS_INVENTARIO_PINTURA = [
  'salio',
  'sucio',
  'mojado',
  'en_ajustes',
  'listo_para_entregar',
] as const satisfies readonly EstatusInventario[]

export function esEstatusPinturaInventario(
  estatus: EstatusInventario,
): estatus is Exclude<EstatusInventario, 'rentado' | 'disponible' | 'mantenimiento'> {
  return (ESTATUS_INVENTARIO_PINTURA as readonly string[]).includes(estatus)
}

export function etiquetaInventario(estatus: EstatusInventario): string {
  if (estatus === 'rentado') return 'Rentado'
  if (estatus === 'disponible') return 'Disponible'
  if (estatus === 'mantenimiento') return 'Mantenimiento'
  return estatusCeldaLabels[estatus as EstatusCelda] ?? estatus
}

/** Fondo de fila/celda en inventario según estatus (mismos colores que rentas). */
export function fondoInventarioPorEstatus(estatus: EstatusInventario): string {
  if (esEstatusPinturaInventario(estatus)) {
    return estatusCeldaBg[estatus as EstatusCelda]
  }
  if (estatus === 'mantenimiento') return 'bg-amber-50'
  if (estatus === 'rentado') return 'bg-red-50/40'
  return ''
}

export function estiloBadgeInventario(estatus: EstatusInventario): string {
  if (esEstatusPinturaInventario(estatus)) {
    return `${estatusCeldaBg[estatus as EstatusCelda]} text-gray-900 font-semibold`
  }
  if (estatus === 'rentado') return 'text-red-600 font-medium'
  if (estatus === 'disponible') return 'text-green-600 font-medium'
  return 'text-amber-700 font-medium'
}
