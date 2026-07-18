import type { Pieza, TipoPieza } from '../types/pieza'
import { apiRequest, type PaginatedResponse } from './client'
import { normalizarPieza, normalizarPiezaParcial } from '../utils/mayusculas'

type PiezaApi = Omit<Pieza, 'id'> & { id: number | string }

function mapPieza(raw: PiezaApi): Pieza {
  return normalizarPieza({
    ...raw,
    id: String(raw.id),
    ubicacion: raw.ubicacion ?? '',
    precioRenta: Number(raw.precioRenta ?? 0),
    precioVenta: Number(raw.precioVenta ?? 0),
    precioPremier: Number(raw.precioPremier ?? 0),
  })
}

export interface FetchPiezasParams {
  tipo?: TipoPieza
  color?: string
  talla?: string
  marca?: string
  estatus?: string
  ubicacion?: string
  conjunto?: string
  codigo?: string
  search?: string
  ordering?: string
}

export async function fetchPiezas(params?: FetchPiezasParams): Promise<Pieza[]> {
  const search = new URLSearchParams()
  if (params?.tipo) search.set('tipo', params.tipo)
  if (params?.talla) search.set('talla', params.talla)
  if (params?.color) search.set('color', params.color)
  if (params?.marca) search.set('marca', params.marca)
  if (params?.estatus) search.set('estatus', params.estatus)
  if (params?.ubicacion) search.set('ubicacion', params.ubicacion)
  if (params?.conjunto) search.set('conjunto', params.conjunto)
  if (params?.codigo) search.set('codigo', params.codigo)
  if (params?.search) search.set('search', params.search)
  if (params?.ordering) search.set('ordering', params.ordering)

  const query = search.toString()
  const todas: Pieza[] = []
  let page = 1

  while (true) {
    const pageQuery = query ? `${query}&page=${page}` : `page=${page}`
    const data = await apiRequest<PaginatedResponse<PiezaApi>>(`/piezas/?${pageQuery}`)
    todas.push(...data.results.map(mapPieza))
    if (!data.next) break
    page += 1
  }

  return todas
}

export async function createPieza(payload: Omit<Pieza, 'id'>): Promise<Pieza> {
  const data = await apiRequest<PiezaApi>('/piezas/', {
    method: 'POST',
    body: JSON.stringify(normalizarPiezaParcial(payload)),
  })
  return mapPieza(data)
}

export async function updatePieza(id: string, payload: Partial<Pieza>): Promise<Pieza> {
  const data = await apiRequest<PiezaApi>(`/piezas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(normalizarPiezaParcial(payload)),
  })
  return mapPieza(data)
}

export async function deletePieza(id: string): Promise<void> {
  await apiRequest<void>(`/piezas/${id}/`, { method: 'DELETE' })
}
