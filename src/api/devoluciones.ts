import type { Devolucion, EstatusDevolucion } from '../types'
import { apiRequest, type PaginatedResponse } from './client'

type DevolucionApi = Omit<
  Devolucion,
  'id' | 'rentaId' | 'prendaId' | 'penalizacion' | 'cargoDanos'
> & {
  id: number | string
  rentaId: number | string
  prendaId?: number | string | null
  penalizacion: number | string
  cargoDanos?: number | string
}

function mapDevolucion(raw: DevolucionApi): Devolucion {
  return {
    ...raw,
    id: String(raw.id),
    rentaId: String(raw.rentaId),
    prendaId: raw.prendaId != null ? String(raw.prendaId) : null,
    penalizacion: Number(raw.penalizacion),
    fechaSalioReal: raw.fechaSalioReal ?? null,
    multaPerdonada: Boolean(raw.multaPerdonada),
    cargoDanos: raw.cargoDanos != null ? Number(raw.cargoDanos) : 0,
    notaDanos: raw.notaDanos ?? '',
    estatus: raw.estatus as EstatusDevolucion,
  }
}

export interface FetchDevolucionesParams {
  estatus?: EstatusDevolucion
  renta_id?: string
  search?: string
  /** Filtra por categoría de vestido (noche, quince, boda) — solo línea vestidos */
  categoria_vestido?: string
}

export async function fetchDevoluciones(params?: FetchDevolucionesParams): Promise<Devolucion[]> {
  const search = new URLSearchParams()
  if (params?.estatus) search.set('estatus', params.estatus)
  if (params?.renta_id) search.set('renta_id', params.renta_id)
  if (params?.search) search.set('search', params.search)
  if (params?.categoria_vestido) search.set('categoria_vestido', params.categoria_vestido)

  const query = search.toString()
  const todas: Devolucion[] = []
  let page = 1

  while (true) {
    const pageQuery = query ? `${query}&page=${page}` : `page=${page}`
    const data = await apiRequest<PaginatedResponse<DevolucionApi>>(
      `/devoluciones/?${pageQuery}`,
    )
    todas.push(...data.results.map(mapDevolucion))
    if (!data.next) break
    page += 1
  }

  return todas
}

export interface UpdateDevolucionPayload {
  estatus?: EstatusDevolucion
  penalizacion?: number
  multaPerdonada?: boolean
  cargoDanos?: number
  notaDanos?: string
  confirmarSalio?: boolean
}

export async function updateDevolucion(
  id: string,
  payload: UpdateDevolucionPayload,
): Promise<Devolucion> {
  const data = await apiRequest<DevolucionApi>(`/devoluciones/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return mapDevolucion(data)
}

export function fechaLimiteDisplay(fecha: string): string {
  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return fecha
}

export function esDevolucionPendiente(estatus: EstatusDevolucion): boolean {
  return estatus === 'revisar_salida' || estatus === 'afuera' || estatus === 'retrasado'
}

export const ETIQUETAS_DEVOLUCION: Record<EstatusDevolucion, string> = {
  revisar_salida: 'Revisar si salió',
  afuera: 'Afuera',
  retrasado: 'Retrasado',
  regresado: 'Regresado',
}

export function fechaLimiteDevolucionDisplay(devolucion: Pick<Devolucion, 'estatus' | 'fechaLimite'>): string {
  if (devolucion.estatus === 'revisar_salida') {
    return 'Al marcar salió + 3 días'
  }
  return fechaLimiteDisplay(devolucion.fechaLimite)
}
