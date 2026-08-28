import type { Renta } from '../types'
import { multaEfectiva } from './multa'
import { anticipoEnPesos, getTipoCambioMxUsd } from './tipoCambio'
import { esPagoEnUsd } from './metodoPago'

export function totalCobrarRenta(renta: Renta): number {
  if (renta.totalCobrar != null) return renta.totalCobrar
  return renta.fondo + multaEfectiva(renta)
}

export function totalPagadoRenta(renta: Renta): number {
  if (renta.totalPagado != null) return renta.totalPagado
  const abonos = renta.abonos?.reduce((s, a) => s + a.montoMxn, 0) ?? 0
  const mxn = renta.pagoEfectivoMxn ?? 0
  const usd = renta.pagoEfectivoUsd ?? 0
  if (
    (renta.metodoPago === 'mixto' || esPagoEnUsd(renta.metodoPago)) &&
    (mxn > 0 || usd > 0)
  ) {
    const tc = getTipoCambioMxUsd()
    const inicial = mxn + usd * tc
    return inicial + abonos
  }
  const inicial = anticipoEnPesos(renta.anticipo, renta.metodoPago ?? 'pesos')
  return inicial + abonos
}

export function restanteRenta(renta: Renta): number {
  if (renta.restante != null) return renta.restante
  return Math.max(0, totalCobrarRenta(renta) - totalPagadoRenta(renta))
}

export function rentaEstaPagada(renta: Renta): boolean {
  if (renta.pagado != null) return renta.pagado
  // Misma tolerancia que el backend (redondeo de tipo de cambio).
  return restanteRenta(renta) <= 1
}
