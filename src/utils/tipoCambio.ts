import type { MetodoPago } from '../types'

export interface CalculoPagoEfectivo {
  totalCobrar: number
  recibidoMxn: number
  recibidoUsd: number
  recibidoTotalMxn: number
  aplicadoMxn: number
  feriaMxn: number
  faltaMxn: number
}

export function esPagoEfectivo(metodo: MetodoPago): boolean {
  return metodo === 'pesos' || metodo === 'dlls' || metodo === 'mixto'
}

export function calcularPagoEfectivo(
  totalCobrar: number,
  recibidoMxn: number,
  recibidoUsd: number,
): CalculoPagoEfectivo {
  const tc = getTipoCambioMxUsd()
  const mxn = Math.max(0, recibidoMxn)
  const usd = Math.max(0, recibidoUsd)
  const recibidoTotalMxn = Math.round((mxn + usd * tc) * 100) / 100
  const total = Math.max(0, totalCobrar)
  const aplicadoMxn = Math.min(recibidoTotalMxn, total)
  const feriaMxn = Math.max(0, Math.round((recibidoTotalMxn - total) * 100) / 100)
  const faltaMxn = Math.max(0, Math.round((total - recibidoTotalMxn) * 100) / 100)
  return {
    totalCobrar: total,
    recibidoMxn: mxn,
    recibidoUsd: usd,
    recibidoTotalMxn,
    aplicadoMxn,
    feriaMxn,
    faltaMxn,
  }
}

export function inferirMetodoEfectivo(recibidoMxn: number, recibidoUsd: number): MetodoPago {
  const mxn = recibidoMxn > 0
  const usd = recibidoUsd > 0
  if (mxn && usd) return 'mixto'
  if (usd) return 'dlls'
  return 'pesos'
}

/** Tipo de cambio MXN por 1 USD (ajustable desde Finanzas) */
let tipoCambioActual = 18.5

export function getTipoCambioMxUsd(): number {
  return tipoCambioActual
}

export function setTipoCambioMxUsd(valor: number) {
  if (valor > 0) tipoCambioActual = valor
}

/** @deprecated Usar getTipoCambioMxUsd() */
export const TIPO_CAMBIO_MXN_USD = tipoCambioActual

export function pesosADolares(pesos: number): number {
  const tc = getTipoCambioMxUsd()
  if (!pesos || tc <= 0) return 0
  return Math.round((pesos / tc) * 100) / 100
}

export function dllsAPesos(dlls: number): number {
  const tc = getTipoCambioMxUsd()
  if (!dlls || tc <= 0) return 0
  return Math.round(dlls * tc * 100) / 100
}

/** Convierte el anticipo a pesos según cómo se cobró */
export function anticipoEnPesos(anticipo: number, metodoPago: MetodoPago = 'pesos'): number {
  if (metodoPago === 'dlls') return dllsAPesos(anticipo)
  return anticipo
}

export function calcularRestante(
  precio: number,
  anticipo: number,
  multa = 0,
  metodoPago: MetodoPago = 'pesos',
): number {
  return Math.max(0, precio + multa - anticipoEnPesos(anticipo, metodoPago))
}

/** Restante usando desglose de efectivo recibido */
export function calcularRestanteEfectivo(
  precio: number,
  multa: number,
  recibidoMxn: number,
  recibidoUsd: number,
): number {
  const total = Math.max(0, precio + multa)
  const pago = calcularPagoEfectivo(total, recibidoMxn, recibidoUsd)
  return pago.faltaMxn
}

/** Ej: 1400 → "1400 / 76 Dlls" */
export function fmtMontoConDlls(pesos: number): string {
  const entero = Math.round(pesos)
  const dlls = Math.round(pesosADolares(pesos))
  return `${entero} / ${dlls} Dlls`
}

export function fmtDlls(pesos: number): string {
  return `${Math.round(pesosADolares(pesos))} Dlls`
}

export function fmtMoneyMxn(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

/** Muestra anticipo según moneda del método de pago */
export function fmtAnticipo(anticipo: number, metodoPago: MetodoPago = 'pesos'): string {
  if (!anticipo) return '0'
  if (metodoPago === 'dlls') {
    const usd = Math.round(anticipo * 100) / 100
    const mxn = Math.round(dllsAPesos(anticipo))
    return `${usd} DLLS (${mxn} MXN)`
  }
  if (metodoPago === 'mixto') {
    return fmtMoneyMxn(anticipo)
  }
  return fmtMontoConDlls(anticipo)
}

export function esAnticipoDlls(metodoPago: MetodoPago | undefined): boolean {
  return metodoPago === 'dlls'
}
