import type { Renta } from '../types'
import { esCategoriaQuince, valorCamisaVestido } from './precioVestido'
import {
  DIAS_RENTA_DEFAULT,
  parseFechaDDMMYYYY,
  semanaKeyDesdeFechaSalida,
  sumarDiasFecha,
} from './semanasRentas'

/** Sufijo de filas virtuales de sesión derivadas de un Paquete Premium (XV). */
export const SUFIJO_SESION_VIRTUAL = '__sesion_fotos'

export function idRentaOrigen(id: string): string {
  return id.endsWith(SUFIJO_SESION_VIRTUAL)
    ? id.slice(0, -SUFIJO_SESION_VIRTUAL.length)
    : id
}

export function esFilaSesionVirtual(renta: Renta): boolean {
  return Boolean(renta.origenSesionRentaId) || renta.id.endsWith(SUFIJO_SESION_VIRTUAL)
}

/** Fecha de sesión válida distinta a la entrega, solo XV + Paquete Premium. */
export function fechaSesionPremium(renta: Renta): string | null {
  if (renta.cancelada) return null
  if (renta.tipoOperacion !== 'paquete_premium') return null
  if (!esCategoriaQuince(renta.categoriaVestido)) return null

  const cita = (renta.fechaCita?.valor ?? '').trim()
  if (!cita || !parseFechaDDMMYYYY(cita)) return null
  if (cita === (renta.fechaSalida || '').trim()) return null
  return cita
}

/**
 * Fila “Sesión de fotos” anclada a la fecha de sesión, con los mismos datos
 * del paquete premium (sin duplicar cobros en totales de semana).
 */
export function filaSesionDesdePremium(renta: Renta): Renta | null {
  const cita = fechaSesionPremium(renta)
  if (!cita) return null

  const semana = semanaKeyDesdeFechaSalida(cita)
  if (!semana) return null

  return {
    ...renta,
    id: `${renta.id}${SUFIJO_SESION_VIRTUAL}`,
    origenSesionRentaId: renta.id,
    tipoOperacion: 'sesion_fotos',
    estatusFila: 'sesion_fotos',
    camisa: { ...renta.camisa, valor: valorCamisaVestido('sesion_fotos') },
    fechaSalida: cita,
    fechaRegreso: sumarDiasFecha(cita, DIAS_RENTA_DEFAULT) || cita,
    semanaInicio: semana,
    fondo: 0,
    anticipo: 0,
    multa: 0,
    totalAbonado: 0,
    totalPagado: 0,
    totalCobrar: 0,
    restante: 0,
    pagado: true,
    abonos: [],
    excluirCorte: true,
  }
}

/** Incluye la renta original y, si aplica, su fila virtual de sesión. */
export function expandirSesionesDesdePremium(rentas: Renta[]): Renta[] {
  const out: Renta[] = []
  for (const r of rentas) {
    out.push(r)
    const sesion = filaSesionDesdePremium(r)
    if (sesion) out.push(sesion)
  }
  return out
}

/** Resuelve el registro real (paquete) a partir de una fila virtual o real. */
export function rentaRealDesdeLista(
  rentas: Renta[],
  rentaOId: Renta | string,
): Renta | undefined {
  const id = typeof rentaOId === 'string' ? rentaOId : rentaOId.id
  const realId = idRentaOrigen(id)
  return rentas.find((r) => r.id === realId)
}
