import type { CampoPrendaCelda, CeldaRenta, Renta } from '../types'
import type { TipoOperacion } from './precioVestido'

/** Texto del traje para la columna Color (ej. TUX AZUL NAVY SS [211]). */
export function detalleTrajePrincipal(renta: Renta): string {
  return (renta.detallesSaco ?? '').trim()
}

export function celdaPrendaTrajes(renta: Renta, key: CampoPrendaCelda): CeldaRenta {
  const base = renta[key]
  if (key === 'color') {
    const detalle = detalleTrajePrincipal(renta)
    if (detalle) {
      return { ...base, valor: detalle }
    }
  }
  return base
}

/** Detalle del traje en negro en rentas; venta conserva el color por tipo de operación. */
export function clasesTextoCeldaTrajes(
  renta: Renta,
  key: CampoPrendaCelda,
  tipoOperacion: TipoOperacion,
  clasesTipoDefault: string,
): string {
  if (key === 'color' && detalleTrajePrincipal(renta) && tipoOperacion === 'renta') {
    return 'text-gray-900 font-semibold normal-case'
  }
  return clasesTipoDefault
}
