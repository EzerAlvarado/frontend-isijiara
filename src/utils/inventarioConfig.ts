import { etiquetaTipoVestido, type TipoPiezaTraje, type TipoPiezaVestido } from '../types/pieza'

export const TABS_INVENTARIO_TRAJES: { tipo: TipoPiezaTraje; label: string }[] = [
  { tipo: 'saco', label: 'Sacos' },
  { tipo: 'chaleco', label: 'Chalecos' },
  { tipo: 'pantalon', label: 'Pantalones' },
]

export const TABS_INVENTARIO_VESTIDOS: { tipo: TipoPiezaVestido; label: string }[] = [
  { tipo: 'noche', label: 'Noche' },
  { tipo: 'quince', label: etiquetaTipoVestido('quince') },
  { tipo: 'boda', label: etiquetaTipoVestido('boda') },
]

export function esInventarioTrajes(linea: string | null | undefined): boolean {
  return linea !== 'vestidos'
}
