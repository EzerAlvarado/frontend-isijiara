import type { Devolucion } from '../types'
import {
  DIAS_RENTA_DEFAULT,
  parseFechaDDMMYYYY,
  sumarDiasFecha,
} from './semanasRentas'

/** Multa por día (ajustable desde Finanzas) */
let multaPorDiaActual = 15

export function getMultaPorDia(): number {
  return multaPorDiaActual
}

export function setMultaPorDia(valor: number) {
  if (valor >= 0) multaPorDiaActual = valor
}

/** @deprecated Usar getMultaPorDia() */
export const MULTA_POR_DIA_TARDE = multaPorDiaActual

function parseFechaLimiteISO(fecha: string): Date | null {
  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    d.setHours(12, 0, 0, 0)
    return d
  }
  return parseFechaDDMMYYYY(fecha)
}

/** Días de retraso después de la fecha límite (ISO o dd/mm/aaaa) */
export function diasRetrasoDesdeLimite(fechaLimite: string, fechaReferencia = new Date()): number {
  const limite = parseFechaLimiteISO(fechaLimite)
  if (!limite) return 0

  const ref = new Date(fechaReferencia)
  ref.setHours(12, 0, 0, 0)

  const msPorDia = 24 * 60 * 60 * 1000
  const diff = Math.floor((ref.getTime() - limite.getTime()) / msPorDia)
  return diff > 0 ? diff : 0
}

/** Días de retraso después de la fecha límite de regreso (salida + 3 días) */
export function diasRetraso(fechaSalida: string, fechaReferencia = new Date()): number {
  const limiteStr = sumarDiasFecha(fechaSalida, DIAS_RENTA_DEFAULT)
  const limite = parseFechaDDMMYYYY(limiteStr)
  if (!limite) return 0

  const ref = new Date(fechaReferencia)
  ref.setHours(12, 0, 0, 0)

  if (ref <= limite) return 0

  const msPorDia = 24 * 60 * 60 * 1000
  return Math.ceil((ref.getTime() - limite.getTime()) / msPorDia)
}

/** Multa automática si no regresó a tiempo (0 si aún está en plazo) */
export function calcularMultaAutomatica(
  fechaSalida: string,
  fechaReferencia = new Date(),
): number {
  return diasRetraso(fechaSalida, fechaReferencia) * getMultaPorDia()
}

/** Multa según fecha límite de devolución */
export function calcularMultaDesdeLimite(
  fechaLimite: string,
  fechaReferencia = new Date(),
): number {
  return diasRetrasoDesdeLimite(fechaLimite, fechaReferencia) * getMultaPorDia()
}

export function multaEfectiva(renta: {
  fechaSalida: string
  multa: number
}): number {
  if (renta.multa > 0) return renta.multa
  return calcularMultaAutomatica(renta.fechaSalida)
}

/** Monto a cobrar por atraso en devolución */
export function multaDevolucion(
  devolucion: Pick<Devolucion, 'estatus' | 'fechaLimite' | 'penalizacion'>,
): number {
  return detalleMultaDevolucion(devolucion)?.monto ?? 0
}

export function detalleMultaDevolucion(
  devolucion: Pick<Devolucion, 'estatus' | 'fechaLimite' | 'penalizacion'>,
): { monto: number; dias: number; tarifa: number } | null {
  if (devolucion.estatus === 'revisar_salida') return null

  const tarifa = getMultaPorDia()
  let dias = diasRetrasoDesdeLimite(devolucion.fechaLimite)

  if (dias <= 0 && devolucion.estatus === 'retrasado') {
    dias = 1
  }

  if (devolucion.penalizacion > 0) {
    const diasMostrar =
      dias > 0 ? dias : Math.max(1, Math.round(devolucion.penalizacion / tarifa))
    return { monto: devolucion.penalizacion, dias: diasMostrar, tarifa }
  }

  if (dias <= 0) return null

  return { monto: dias * tarifa, dias, tarifa }
}
