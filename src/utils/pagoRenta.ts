import type { Renta } from '../types'
import { multaEfectiva } from './multa'
import { anticipoEnPesos, getTipoCambioMxUsd } from './tipoCambio'

export function totalCobrarRenta(renta: Renta): number {
  if (renta.totalCobrar != null) return renta.totalCobrar
  return renta.fondo + multaEfectiva(renta)
}

export function totalPagadoRenta(renta: Renta): number {
  if (renta.totalPagado != null) return renta.totalPagado
  const abonos = renta.abonos?.reduce((s, a) => s + a.montoMxn, 0) ?? 0
  if (renta.metodoPago === 'mixto' && ((renta.pagoEfectivoMxn ?? 0) > 0 || (renta.pagoEfectivoUsd ?? 0) > 0)) {
    const tc = getTipoCambioMxUsd()
    const inicial = (renta.pagoEfectivoMxn ?? 0) + (renta.pagoEfectivoUsd ?? 0) * tc
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
  return restanteRenta(renta) <= 0.01
}
