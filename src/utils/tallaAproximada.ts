import type { TipoPieza } from '../types/pieza'

/** Extrae el número principal de tallas como 44R, 38S o 34R#129 */
export function numeroTalla(talla: string): number | null {
  const match = talla.trim().match(/(\d{2})/)
  return match ? parseInt(match[1], 10) : null
}

/** Saco / chaleco — medida de pecho (36=S, 38 entre S y M, etc.) */
export function tallaAproximadaSacoChaleco(num: number): string {
  if (num <= 36) return 'S'
  if (num === 37) return 'S'
  if (num === 38) return 'S→M'
  if (num === 39) return 'M'
  if (num <= 41) return 'M'
  if (num === 42) return 'M→L'
  if (num <= 44) return 'L'
  if (num === 45) return 'L→XL'
  return 'XL'
}

/** Pantalón — cintura (30=S, 32 entre S y M, 34=M, 36=L, etc.) */
export function tallaAproximadaPantalon(num: number): string {
  if (num <= 30) return 'S'
  if (num === 32) return 'S→M'
  if (num <= 34) return 'M'
  if (num === 36) return 'M→L'
  if (num <= 38) return 'L'
  return 'XL'
}

export function tallaAproximada(talla: string, tipo: TipoPieza): string {
  const num = numeroTalla(talla)
  if (num == null) return '—'
  if (tipo === 'pantalon') return tallaAproximadaPantalon(num)
  return tallaAproximadaSacoChaleco(num)
}

/** Para filtrar: ¿la talla aproximada corresponde a S, M, L o XL? */
export function tallaAproxCoincide(aprox: string, filtros: string[]): boolean {
  if (filtros.length === 0) return true
  const u = aprox.toUpperCase()
  return filtros.some((f) => {
    const letra = f.toUpperCase()
    return u === letra || u.startsWith(`${letra}→`) || u.startsWith(`${letra}/`)
  })
}

export const REFERENCIA_TALLA_APROX = {
  saco: '36=S · 38=S→M · 40=M · 42=M→L · 44=L · 46=XL',
  pantalon: '30=S · 32=S→M · 34=M · 36=M→L · 38=L · 40+=XL',
} as const
