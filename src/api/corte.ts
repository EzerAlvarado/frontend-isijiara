import type {
  MetodoPago,
  MultaTardia,
  ResumenFinanciero,
  Transaccion,
  TurnoCorte,
  TurnoDiaEstado,
  ValeCorte,
} from '../types'
import type { ConteoFisico, TotalesConteo } from '../utils/conteoCaja'
import { normalizarConteo } from '../utils/conteoCaja'
import { apiRequest } from './client'

export interface CorteDiaResponse {
  fecha: string
  turno: TurnoCorte
  turnoLabel: string
  incluyeManana: boolean
  turnosDia: TurnoDiaEstado[]
  categoriaVestido?: string | null
  fondoInicial: number
  fondoFeriaConfig?: number
  cerrado: boolean
  omitido: boolean
  empleadoCorte: string | null
  cerradoEn: string | null
  conteoFondo?: ConteoFisico
  totalesFondo?: TotalesConteo & { equivalenteMxn: number }
  conteoCaja?: ConteoFisico
  totalesCaja?: TotalesConteo & { equivalenteMxn: number }
  conteoFisico?: ConteoFisico
  totalesConteo?: TotalesConteo
  resumen: ResumenFinanciero
  transacciones: Transaccion[]
  valesPendientes: ValeCorte[]
  multasTardias: MultaTardia[]
}

function mapTotalesConteo(raw: TotalesConteo & { equivalenteMxn?: number; tipoCambioUsd?: number; diferenciaMxn?: number | null }) {
  return {
    ...raw,
    mxnBilletes: Number(raw.mxnBilletes),
    mxnMonedas: Number(raw.mxnMonedas),
    mxnVales: Number(raw.mxnVales ?? 0),
    mxnTotal: Number(raw.mxnTotal),
    usdTotal: Number(raw.usdTotal),
    equivalenteMxn: Number(raw.equivalenteMxn ?? 0),
    ...(raw.tipoCambioUsd != null ? { tipoCambioUsd: Number(raw.tipoCambioUsd) } : {}),
    ...(raw.diferenciaMxn != null ? { diferenciaMxn: Number(raw.diferenciaMxn) } : {}),
  }
}

function mapTransaccion(raw: Transaccion & { id: number | string }): Transaccion {
  return {
    ...raw,
    id: String(raw.id),
    monto: Number(raw.monto),
    timestamp: formatTimestamp(raw.timestamp),
  }
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  const fecha = d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${fecha} ${hora}`
}

function mapVale(raw: ValeCorte & { id: number | string }): ValeCorte {
  return {
    ...raw,
    id: String(raw.id),
    monto: Number(raw.monto),
    montoMxn: Number(raw.montoMxn),
  }
}

function mapTurnoDia(raw: TurnoDiaEstado): TurnoDiaEstado {
  return {
    ...raw,
    cerrado: Boolean(raw.cerrado),
    omitido: Boolean(raw.omitido),
    existe: Boolean(raw.existe),
    empleadoCorte: raw.empleadoCorte ?? null,
  }
}

function mapCorte(raw: CorteDiaResponse): CorteDiaResponse {
  const totalEnCaja = Number(raw.resumen.totalEnCaja ?? raw.resumen.efectivoEnCaja)
  const fondoFisico = Number(raw.resumen.fondoFisico ?? raw.resumen.fondoInicial)
  const cajaDelDia = Number(raw.resumen.cajaDelDia ?? totalEnCaja - fondoFisico)
  return {
    ...raw,
    turno: raw.turno ?? 'manana',
    turnoLabel: raw.turnoLabel ?? 'Mañana',
    incluyeManana: Boolean(raw.incluyeManana),
    turnosDia: (raw.turnosDia ?? []).map(mapTurnoDia),
    fondoInicial: Number(raw.fondoInicial),
    fondoFeriaConfig: raw.fondoFeriaConfig != null ? Number(raw.fondoFeriaConfig) : undefined,
    omitido: Boolean(raw.omitido),
    empleadoCorte: raw.empleadoCorte ?? null,
    conteoFondo: raw.conteoFondo ? normalizarConteo(raw.conteoFondo) : undefined,
    totalesFondo: raw.totalesFondo ? mapTotalesConteo(raw.totalesFondo) : undefined,
    conteoCaja: raw.conteoCaja ? normalizarConteo(raw.conteoCaja) : undefined,
    totalesCaja: raw.totalesCaja ? mapTotalesConteo(raw.totalesCaja) : undefined,
    conteoFisico: raw.conteoFisico ? normalizarConteo(raw.conteoFisico) : undefined,
    totalesConteo: raw.totalesConteo ? mapTotalesConteo(raw.totalesConteo) : undefined,
    resumen: {
      ...raw.resumen,
      ingresosTotales: Number(raw.resumen.ingresosTotales),
      cajaDelDia,
      totalEnCaja,
      efectivoEnCaja: totalEnCaja,
      gastosDelFondo: Number(raw.resumen.gastosDelFondo ?? raw.resumen.gastosDiarios),
      gastosDiarios: Number(raw.resumen.gastosDiarios),
      valesPendientesTotal: Number(raw.resumen.valesPendientesTotal ?? 0),
      valesEsperadosFondo:
        raw.resumen.valesEsperadosFondo != null
          ? Number(raw.resumen.valesEsperadosFondo)
          : undefined,
      ingresosTarjeta: Number(raw.resumen.ingresosTarjeta),
      fondoInicial: Number(raw.resumen.fondoInicial),
      fondoFisico,
    },
    transacciones: raw.transacciones.map((t) =>
      mapTransaccion(t as Transaccion & { id: number | string }),
    ),
    multasTardias: raw.multasTardias.map((m) => ({ ...m, monto: Number(m.monto) })),
    valesPendientes: (raw.valesPendientes ?? []).map((v) =>
      mapVale(v as ValeCorte & { id: number | string }),
    ),
  }
}

function corteQuery(fecha: string, turno?: TurnoCorte, categoria?: string) {
  const params = new URLSearchParams({ fecha })
  if (turno) params.set('turno', turno)
  if (categoria) params.set('categoria', categoria)
  return params.toString()
}

function corteBody(payload: Record<string, unknown>, turno?: TurnoCorte, categoria?: string) {
  const body: Record<string, unknown> = { ...payload }
  if (turno) body.turno = turno
  if (categoria) body.categoria = categoria
  return body
}

export function hoyISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function fetchCorte(fecha: string, turno?: TurnoCorte, categoria?: string): Promise<CorteDiaResponse> {
  const data = await apiRequest<CorteDiaResponse>(`/corte/?${corteQuery(fecha, turno, categoria)}`)
  return mapCorte(data)
}

export async function actualizarFondoInicial(
  fecha: string,
  fondoInicial: number,
  conteoFondo?: ConteoFisico,
  turno?: TurnoCorte,
  categoria?: string,
): Promise<CorteDiaResponse> {
  const data = await apiRequest<CorteDiaResponse>(`/corte/?${corteQuery(fecha, turno, categoria)}`, {
    method: 'PATCH',
    body: JSON.stringify(corteBody({ fondoInicial, ...(conteoFondo ? { conteoFondo } : {}) }, turno, categoria)),
  })
  return mapCorte(data)
}

export async function cerrarCorte(
  fecha: string,
  conteoFondo: ConteoFisico,
  conteoCaja: ConteoFisico,
  empleado: string,
  turno?: TurnoCorte,
  categoria?: string,
): Promise<CorteDiaResponse> {
  const data = await apiRequest<CorteDiaResponse>('/corte/cierre/', {
    method: 'POST',
    body: JSON.stringify(
      corteBody({ fecha, conteoFondo, conteoCaja, empleado: empleado.trim() }, turno, categoria),
    ),
  })
  return mapCorte(data)
}

export async function registrarGasto(payload: {
  fecha: string
  cliente: string
  monto: number
  pago?: MetodoPago
  turno?: TurnoCorte
  categoria?: string
}): Promise<CorteDiaResponse> {
  const { turno, categoria, ...rest } = payload
  const data = await apiRequest<CorteDiaResponse & { transaccion?: Transaccion }>(
    '/corte/gasto/',
    {
      method: 'POST',
      body: JSON.stringify(corteBody(rest, turno, categoria)),
    },
  )
  return mapCorte(data)
}

export async function reponerVale(
  valeId: string,
  fecha: string,
  desdeConteo = false,
  turno?: TurnoCorte,
  categoria?: string,
): Promise<CorteDiaResponse> {
  const data = await apiRequest<CorteDiaResponse>(`/corte/vales/${valeId}/reponer/`, {
    method: 'POST',
    body: JSON.stringify(corteBody({ fecha, desdeConteo }, turno, categoria)),
  })
  return mapCorte(data)
}

export function fechaCorteDisplay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  return fecha
    .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase()
}

export function diaAnterior(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  fecha.setDate(fecha.getDate() - 1)
  return fecha.toISOString().slice(0, 10)
}

export function diaSiguiente(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  fecha.setDate(fecha.getDate() + 1)
  return fecha.toISOString().slice(0, 10)
}

export function turnoLabel(turno: TurnoCorte): string {
  return turno === 'tarde' ? 'Tarde' : 'Mañana'
}
