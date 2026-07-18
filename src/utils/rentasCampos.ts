import type { CampoPrendaCelda, CampoRentaCelda } from '../types'

export const CAMPOS_PRENDA: CampoPrendaCelda[] = [
  'color',
  'saco',
  'chaleco',
  'pantalon',
  'camisa',
  'corbataMono',
  'cinto',
  'accesorio',
]

export const CAMPOS_INFO: CampoRentaCelda[] = [
  'empleado',
  'cliente',
  'fechaCita',
  'horario',
  'detalles',
]

/** Todas las celdas pintables (prendas + info) */
export const CAMPOS_RENTA_CELDA: CampoRentaCelda[] = [...CAMPOS_PRENDA, ...CAMPOS_INFO]
