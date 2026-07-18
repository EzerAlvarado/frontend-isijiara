import type { EstatusInventario } from '../types'

export type TipoPiezaTraje = 'saco' | 'chaleco' | 'pantalon'
export type TipoPiezaVestido = 'quince' | 'boda' | 'noche'

/** Etiqueta visible; valores internos: `quince`, `boda`. */
export function etiquetaTipoVestido(tipo: TipoPiezaVestido): string {
  if (tipo === 'boda') return 'Novia'
  if (tipo === 'quince') return 'XV'
  return 'Noche'
}
export type TipoPieza = TipoPiezaTraje | TipoPiezaVestido

export interface Pieza {
  id: string
  tipo: TipoPieza
  color: string
  colorVestido?: string
  talla: string
  marca: string
  detalles: string
  codigoOld: string
  codigoNew: string
  conjunto: string
  estatus: EstatusInventario
  ubicacion?: string
  precioRenta?: number
  precioVenta?: number
  precioPremier?: number
}

export function esTipoTraje(tipo: TipoPieza): tipo is TipoPiezaTraje {
  return tipo === 'saco' || tipo === 'chaleco' || tipo === 'pantalon'
}

export function esTipoVestido(tipo: TipoPieza): tipo is TipoPiezaVestido {
  return tipo === 'quince' || tipo === 'boda' || tipo === 'noche'
}

export function normalizarTipoVestido(tipo: TipoPieza): TipoPiezaVestido {
  if (tipo === 'quince' || tipo === 'boda' || tipo === 'noche') return tipo
  return 'quince'
}
