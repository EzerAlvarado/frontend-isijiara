import type { Pieza } from '../types/pieza'
import type { PrecioReferencia } from '../api/finanzas'
import type { EstatusCelda } from '../types'

export type TipoOperacionVestido =
  | 'renta'
  | 'venta'
  | 'premier'
  | 'sesion_fotos'
  | 'patrocinio'

export type TipoOperacion = TipoOperacionVestido

export function esPatrocinio(tipo: TipoOperacionVestido): boolean {
  return tipo === 'patrocinio'
}

export function esPrecioOperacionManual(tipo: TipoOperacionVestido): boolean {
  return tipo === 'sesion_fotos'
}

export function calcularPrecioVestido(
  pieza: Pieza | undefined,
  tipo: TipoOperacionVestido,
  preciosReferencia: PrecioReferencia[] = [],
): number {
  if (!pieza) return 0
  if (tipo === 'venta') return pieza.precioVenta ?? 0
  if (tipo === 'sesion_fotos' || tipo === 'patrocinio') return 0
  if (tipo === 'renta') return pieza.precioRenta ?? 0
  if ((pieza.precioPremier ?? 0) > 0) return pieza.precioPremier ?? 0

  const base = pieza.precioRenta ?? 0
  const recoger = preciosReferencia.find((p) => p.id === 'recoger')?.precioMxn ?? 0
  const premier = preciosReferencia.find((p) => p.id === 'premier')?.precioMxn ?? 0
  if (recoger > 0 && premier > recoger) {
    return base + (premier - recoger)
  }
  return base
}

export function etiquetaTipoOperacionVestido(tipo: TipoOperacionVestido): string {
  if (tipo === 'venta') return 'Venta'
  if (tipo === 'premier') return 'Premier'
  if (tipo === 'sesion_fotos') return 'Sesión de fotos'
  if (tipo === 'patrocinio') return 'Patrocinio'
  return 'Renta'
}

export function parseTipoOperacionVestido(valor: string | undefined): TipoOperacionVestido {
  const v = (valor ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  if (v === 'VENTA') return 'venta'
  if (v === 'PREMIER') return 'premier'
  if (v === 'SESION_FOTOS' || v === 'SESION_DE_FOTOS') return 'sesion_fotos'
  if (v === 'PATROCINIO' || v === 'PATROCION') return 'patrocinio'
  return 'renta'
}

/** Estatus de fila sugerido al crear o cambiar tipo de operación. */
export function estatusFilaDesdeTipoOperacion(tipo: TipoOperacionVestido): EstatusCelda | undefined {
  if (tipo === 'venta') return 'venta'
  if (tipo === 'premier') return 'premier'
  if (tipo === 'sesion_fotos') return 'sesion_fotos'
  return undefined
}

/** Etiqueta corta para la celda camisa en vestidos. */
export function valorCamisaVestido(tipo: TipoOperacionVestido): string {
  if (tipo === 'sesion_fotos') return 'SESION FOTOS'
  if (tipo === 'patrocinio') return 'PATROCINIO'
  return tipo.toUpperCase()
}

/** Tipo de operación guardado en la renta (campo API o valores legacy). */
export function tipoOperacionDesdeRenta(
  renta: {
    tipoOperacion?: string
    camisa?: { valor?: string }
    tipoEntrega?: string
  },
  esVestidos: boolean,
): TipoOperacion {
  const directo = (renta.tipoOperacion ?? '').trim().toLowerCase()
  if (
    directo === 'venta' ||
    directo === 'premier' ||
    directo === 'renta' ||
    directo === 'sesion_fotos' ||
    directo === 'patrocinio'
  ) {
    return directo
  }
  if (esVestidos) return parseTipoOperacionVestido(renta.camisa?.valor)
  if (renta.tipoEntrega === 'premier') return 'premier'
  return 'renta'
}

/** Color de texto por tipo cuando no hay estatus pintado manualmente. */
export function clasesTextoTipoOperacion(tipo: TipoOperacion): string {
  if (tipo === 'venta') return 'text-blue-600 font-semibold'
  if (tipo === 'premier') return 'text-purple-700 font-semibold'
  if (tipo === 'patrocinio') return 'text-teal-700 font-semibold'
  return ''
}
