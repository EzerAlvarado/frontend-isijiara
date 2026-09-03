import type { MetodoPago } from '../types'

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'pesos', label: 'Pesos (efectivo)' },
  { value: 'dlls', label: 'DLLS (efectivo)' },
  { value: 'mixto', label: 'Mixto MXN + USD' },
  { value: 'bbva', label: 'BBVA' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
]

export const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  pesos: 'Pesos',
  dlls: 'DLLS',
  mixto: 'Mixto MXN + USD',
  bbva: 'BBVA',
  zelle: 'Zelle',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
}

const PAGOS_DIGITALES: readonly MetodoPago[] = ['bbva', 'zelle', 'transferencia', 'tarjeta']

export function esPagoDigital(metodo: MetodoPago | string | undefined): boolean {
  return PAGOS_DIGITALES.includes((metodo || '') as MetodoPago)
}

/** Zelle y DLLS guardan el anticipo en dólares. */
export function esPagoEnUsd(metodo: MetodoPago | undefined): boolean {
  return metodo === 'dlls' || metodo === 'zelle'
}

export function etiquetaMetodoPago(metodo: MetodoPago | string): string {
  return ETIQUETA_METODO_PAGO[metodo as MetodoPago] ?? String(metodo)
}
