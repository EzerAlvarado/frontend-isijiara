import type { Renta } from '../types'
import type { Pieza } from '../types/pieza'
import type { RentaFormValues } from './rentaForm'
import { resolverPiezasDesdeFormulario } from './inventarioSugerencias'
import {
  DIAS_RENTA_DEFAULT,
  formatFechaMX,
  inicioDeSemana,
  parseFechaDDMMYYYY,
  semanaKeyDesdeFechaSalida,
  sumarDiasFecha,
  toISO,
} from './semanasRentas'

export type EstadoDisponibilidadPieza =
  | 'disponible'
  | 'ocupada_misma_semana'
  | 'reservada_semana_siguiente'

export interface ConflictoPieza {
  estado: Exclude<EstadoDisponibilidadPieza, 'disponible'>
  rentaId: string
  fechaSalida: string
  fechaRegreso: string
  cliente: string
}

export function idsPiezasEnRenta(renta: Renta): string[] {
  return [renta.piezaSacoId, renta.piezaChalecoId, renta.piezaPantalonId].filter(
    Boolean,
  ) as string[]
}

export function semanaDesplazada(semanaKey: string, semanas: number): string {
  const base = new Date(semanaKey + 'T12:00:00')
  base.setDate(base.getDate() + semanas * 7)
  return toISO(inicioDeSemana(base))
}

function fechasSeSolapan(
  salidaA: string,
  regresoA: string,
  salidaB: string,
  regresoB: string,
): boolean {
  const a0 = parseFechaDDMMYYYY(salidaA)
  const a1 = parseFechaDDMMYYYY(regresoA)
  const b0 = parseFechaDDMMYYYY(salidaB)
  const b1 = parseFechaDDMMYYYY(regresoB)
  if (!a0 || !a1 || !b0 || !b1) return false
  return a0 <= b1 && b0 <= a1
}

/** Conflicto de una pieza respecto a la fecha de salida de una renta nueva (o hoy en inventario). */
export function conflictoPieza(
  piezaId: string,
  fechaReferencia: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): ConflictoPieza | null {
  if (!piezaId || !fechaReferencia.trim()) return null

  const semanaRef = semanaKeyDesdeFechaSalida(fechaReferencia)
  if (!semanaRef) return null

  const semanaSig = semanaDesplazada(semanaRef, 1)
  const regresoNuevo = sumarDiasFecha(fechaReferencia, DIAS_RENTA_DEFAULT)

  let avisoSiguiente: ConflictoPieza | null = null

  for (const r of rentas) {
    if (r.cancelada) continue
    if (excluirRentaId && r.id === excluirRentaId) continue
    if (!idsPiezasEnRenta(r).includes(piezaId)) continue

    const semR = semanaKeyDesdeFechaSalida(r.fechaSalida) || r.semanaInicio
    const cliente = r.cliente?.valor ?? ''
    const base = {
      rentaId: r.id,
      fechaSalida: r.fechaSalida,
      fechaRegreso: r.fechaRegreso,
      cliente,
    }

    const solapan = fechasSeSolapan(
      r.fechaSalida,
      r.fechaRegreso,
      fechaReferencia,
      regresoNuevo,
    )

    if (solapan || semR === semanaRef) {
      return { ...base, estado: 'ocupada_misma_semana' }
    }

    if (semR === semanaSig && !avisoSiguiente) {
      avisoSiguiente = { ...base, estado: 'reservada_semana_siguiente' }
    }
  }

  return avisoSiguiente
}

export function piezaSeleccionableEnRenta(
  pieza: Pieza,
  fechaSalida: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): boolean {
  if (pieza.estatus === 'mantenimiento') return false
  const c = conflictoPieza(pieza.id, fechaSalida, rentas, excluirRentaId)
  return c?.estado !== 'ocupada_misma_semana'
}

export function piezasParaSeleccionRenta(
  piezas: Pieza[],
  fechaSalida: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): Pieza[] {
  if (!fechaSalida.trim()) {
    return piezas.filter((p) => p.estatus !== 'mantenimiento')
  }
  return piezas.filter((p) => piezaSeleccionableEnRenta(p, fechaSalida, rentas, excluirRentaId))
}

export function etiquetaAvisoDisponibilidad(c: ConflictoPieza): string {
  if (c.estado === 'ocupada_misma_semana') {
    const extra = c.cliente ? ` · ${c.cliente}` : ''
    return `Rentado esta semana · sale ${c.fechaSalida}${extra}`
  }
  const extra = c.cliente ? ` · ${c.cliente}` : ''
  return `Sale ${c.fechaSalida} (próxima semana)${extra}`
}

export function avisoInventarioPieza(piezaId: string, rentas: Renta[]): string | null {
  const hoy = formatFechaMX(new Date())
  const c = conflictoPieza(piezaId, hoy, rentas)
  return c ? etiquetaAvisoDisponibilidad(c) : null
}

export function validarPiezasParaRenta(
  piezaIds: string[],
  fechaSalida: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): string | null {
  for (const id of piezaIds) {
    const c = conflictoPieza(id, fechaSalida, rentas, excluirRentaId)
    if (c?.estado === 'ocupada_misma_semana') {
      return `${etiquetaAvisoDisponibilidad(c)}. Elige otra pieza o cambia la fecha de salida.`
    }
  }
  return null
}

export function avisosPiezasVinculadas(
  piezaIds: string[],
  fechaSalida: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): ConflictoPieza[] {
  const avisos: ConflictoPieza[] = []
  for (const id of piezaIds) {
    const c = conflictoPieza(id, fechaSalida, rentas, excluirRentaId)
    if (c?.estado === 'reservada_semana_siguiente') avisos.push(c)
  }
  return avisos
}

export type PrendaTraje = 'saco' | 'chaleco' | 'pantalon'

export const ETIQUETA_PRENDA_TRAJE: Record<PrendaTraje, string> = {
  saco: 'Saco',
  chaleco: 'Chaleco',
  pantalon: 'Pantalón',
}

export interface PrendaTrajeVinculada {
  prenda: PrendaTraje
  piezaId: string
  pieza?: Pieza
}

/** Piezas de traje detectadas en el formulario (por ID o color/marca/talla). */
export function piezasTrajeEnFormulario(
  values: RentaFormValues,
  piezasPool: Pieza[],
): PrendaTrajeVinculada[] {
  const resueltas = resolverPiezasDesdeFormulario(
    piezasPool,
    { color: values.color, marca: values.marca, talla: values.saco },
    { color: values.colorChaleco, marca: values.marcaChaleco, talla: values.chaleco },
    { color: values.colorPantalon, marca: values.marcaPantalon, talla: values.pantalon },
  )

  const items: PrendaTrajeVinculada[] = []
  const push = (prenda: PrendaTraje, id: string, pieza?: Pieza) => {
    if (id) items.push({ prenda, piezaId: id, pieza })
  }

  push('saco', values.piezaSacoId || resueltas.saco?.id || '', resueltas.saco)
  push('chaleco', values.piezaChalecoId || resueltas.chaleco?.id || '', resueltas.chaleco)
  push('pantalon', values.piezaPantalonId || resueltas.pantalon?.id || '', resueltas.pantalon)

  return items
}

export function conflictosTrajePorPrenda(
  values: RentaFormValues,
  piezasPool: Pieza[],
  fechaSalida: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): Partial<Record<PrendaTraje, ConflictoPieza>> {
  const out: Partial<Record<PrendaTraje, ConflictoPieza>> = {}
  for (const { prenda, piezaId } of piezasTrajeEnFormulario(values, piezasPool)) {
    const c = conflictoPieza(piezaId, fechaSalida, rentas, excluirRentaId)
    if (c) out[prenda] = c
  }
  return out
}

export function validarTrajeParaRenta(
  values: RentaFormValues,
  piezasPool: Pieza[],
  fechaSalida: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): string | null {
  for (const { prenda, piezaId } of piezasTrajeEnFormulario(values, piezasPool)) {
    const c = conflictoPieza(piezaId, fechaSalida, rentas, excluirRentaId)
    if (c?.estado === 'ocupada_misma_semana') {
      return `${ETIQUETA_PRENDA_TRAJE[prenda]}: ${etiquetaAvisoDisponibilidad(c)}. Elige otra pieza o cambia la fecha de salida.`
    }
  }
  return null
}

export function avisosTrajeProximaSemana(
  values: RentaFormValues,
  piezasPool: Pieza[],
  fechaSalida: string,
  rentas: Renta[],
  excluirRentaId?: string | null,
): ConflictoPieza[] {
  const avisos: ConflictoPieza[] = []
  for (const { piezaId } of piezasTrajeEnFormulario(values, piezasPool)) {
    const c = conflictoPieza(piezaId, fechaSalida, rentas, excluirRentaId)
    if (c?.estado === 'reservada_semana_siguiente') avisos.push(c)
  }
  return avisos
}
