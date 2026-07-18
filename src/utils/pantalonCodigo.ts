import type { Pieza } from '../types/pieza'

/** Talla sin sufijo #código (p. ej. "32R#129" → "32R"). */
export function tallaSinCodigo(valor: string): string {
  const idx = valor.indexOf('#')
  return (idx >= 0 ? valor.slice(0, idx) : valor).trim()
}

export function codigoPantalonPieza(pieza: Pieza, usarCodigosNuevos: boolean): string {
  if (usarCodigosNuevos) {
    return (pieza.codigoNew || pieza.codigoOld || '').trim()
  }
  return (pieza.codigoOld || pieza.codigoNew || '').trim()
}

/** Formato trajes: `{talla}#{codigo}`; sin código solo la talla. */
export function formatearPantalonTraje(
  talla: string,
  pieza: Pieza | undefined,
  usarCodigosNuevos: boolean,
): string {
  const base = tallaSinCodigo(talla).toUpperCase()
  if (!base || base === 'X') return base
  const codigo = pieza ? codigoPantalonPieza(pieza, usarCodigosNuevos) : ''
  if (!codigo) return base
  return `${base}#${codigo}`
}
