import { apiRequest } from './client'

export interface PrecioReferencia {
  id: string
  nombre: string
  precioMxn: number
}

export interface FinanzasConfig {
  tipoCambioUsd: number
  multaPorDia: number
  fondoFeria: number
  preciosReferencia: PrecioReferencia[]
  usarCodigosNuevosPantalon?: boolean
  actualizadoEn?: string
}

function mapFinanzas(raw: FinanzasConfig): FinanzasConfig {
  return {
    tipoCambioUsd: Number(raw.tipoCambioUsd),
    multaPorDia: Number(raw.multaPorDia ?? 15),
    fondoFeria: Number(raw.fondoFeria ?? 2732),
    preciosReferencia: (raw.preciosReferencia ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precioMxn: Number(p.precioMxn),
    })),
    usarCodigosNuevosPantalon: Boolean(raw.usarCodigosNuevosPantalon),
    actualizadoEn: raw.actualizadoEn,
  }
}

export async function fetchFinanzas(): Promise<FinanzasConfig> {
  const data = await apiRequest<FinanzasConfig>('/finanzas/')
  return mapFinanzas(data)
}

export async function actualizarFinanzas(
  payload: Partial<
    Pick<
      FinanzasConfig,
      'tipoCambioUsd' | 'multaPorDia' | 'fondoFeria' | 'preciosReferencia' | 'usarCodigosNuevosPantalon'
    >
  >,
): Promise<FinanzasConfig> {
  const data = await apiRequest<FinanzasConfig>('/finanzas/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return mapFinanzas(data)
}

export type RubroIngresoId = 'trajes' | 'xv' | 'noche' | 'novia'

export interface RubroIngreso {
  id: RubroIngresoId
  label: string
  ingresoMxn: number
  hoyMxn: number
  movimientos: number
  porConcepto: {
    operacion: number
    abono: number
    multa: number
    danos: number
    otro: number
  }
}

export interface IngresosMes {
  anio: number
  mes: number
  mesLabel: string
  esMesActual: boolean
  desde: string
  hasta: string
  diasDelMes: number
  totalMxn: number
  hoyMxn: number
  movimientos: number
  rubros: RubroIngreso[]
}

export async function fetchIngresosMes(anio: number, mes: number): Promise<IngresosMes> {
  const q = new URLSearchParams({ anio: String(anio), mes: String(mes) })
  return apiRequest<IngresosMes>(`/finanzas/ingresos/?${q}`)
}

export interface RubroOcupacion {
  id: RubroIngresoId
  label: string
  actual: number
  anterior: number
  diferencia: number
}

export interface MesOcupacion {
  mes: number
  mesLabel: string
  esMesActual: boolean
  esFuturo: boolean
  rubros: RubroOcupacion[]
  totalActual: number
  totalAnterior: number
  diferencia: number
}

export interface OcupacionAnio {
  anio: number
  anioAnterior: number
  meses: MesOcupacion[]
  mesesMasOcupados: {
    mes: number
    mesLabel: string
    total: number
    actual: number
    anterior: number
    rubro: RubroIngresoId
    rubroLabel: string
  }[]
  totales: { actual: number; anterior: number }
}

export async function fetchOcupacionAnio(anio: number): Promise<OcupacionAnio> {
  const q = new URLSearchParams({ anio: String(anio) })
  return apiRequest<OcupacionAnio>(`/finanzas/ocupacion/?${q}`)
}

export interface AlertaReusoRenta {
  rentaId: number
  cliente: string
  fechaSalida: string
  fechaRegreso: string
  tipoOperacion: string
}

export interface AlertaReuso {
  codigo: string
  color: string
  descripcion: string
  piezaId: number | null
  vecesRentado: number
  diasEntre: number
  traslape: boolean
  severidad: 'alta' | 'media' | 'baja'
  anterior: AlertaReusoRenta
  siguiente: AlertaReusoRenta
}

export interface VestidoMasRentado {
  codigo: string
  color: string
  descripcion: string
  piezaId: number | null
  veces: number
}

export interface AlertasReuso {
  diasAlerta: number
  categoria: string
  alertas: AlertaReuso[]
  masRentados: VestidoMasRentado[]
}

export async function fetchAlertasReuso(
  categoria = 'quince',
  dias = 10,
): Promise<AlertasReuso> {
  const q = new URLSearchParams({ categoria, dias: String(dias) })
  return apiRequest<AlertasReuso>(`/finanzas/alertas-reuso/?${q}`)
}

export interface LimpiarDatosResult {
  rentas: number
  devoluciones: number
  abonos: number
}

export async function limpiarDatosTest(categoria?: string): Promise<LimpiarDatosResult> {
  return apiRequest<LimpiarDatosResult>('/test/limpiar/', {
    method: 'POST',
    body: JSON.stringify({ categoria }),
  })
}
