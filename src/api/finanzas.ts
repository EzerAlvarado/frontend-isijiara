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
