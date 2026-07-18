import type { MetodoPago } from '../types'

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'pesos', label: 'Pesos (efectivo)' },
  { value: 'dlls', label: 'DLLS (efectivo)' },
  { value: 'mixto', label: 'Mixto MXN + USD' },
  { value: 'bbva', label: 'BBVA' },
  { value: 'zelle', label: 'Zelle' },
]

export const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  pesos: 'Pesos',
  dlls: 'DLLS',
  mixto: 'Mixto MXN + USD',
  bbva: 'BBVA',
  zelle: 'Zelle',
}

export function etiquetaMetodoPago(metodo: MetodoPago | string): string {
  return ETIQUETA_METODO_PAGO[metodo as MetodoPago] ?? String(metodo)
}
