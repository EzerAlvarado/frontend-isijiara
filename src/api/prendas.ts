import type { Prenda } from '../types'
import { apiRequest, type PaginatedResponse } from './client'
import { normalizarPrenda, normalizarPrendaParcial } from '../utils/mayusculas'

type PrendaApi = Omit<Prenda, 'id'> & { id: number | string }

function mapPrenda(raw: PrendaApi): Prenda {
  return normalizarPrenda({
    ...raw,
    id: String(raw.id),
    ubicacion: raw.ubicacion ?? '',
  })
}

export interface FetchPrendasParams {
  talla?: string
  color?: string
  marca?: string
  estatus?: string
  ubicacion?: string
  codigo?: string
  search?: string
  ordering?: string
}

export async function fetchPrendas(params?: FetchPrendasParams): Promise<Prenda[]> {
  const search = new URLSearchParams()
  if (params?.talla) search.set('talla', params.talla)
  if (params?.color) search.set('color', params.color)
  if (params?.marca) search.set('marca', params.marca)
  if (params?.estatus) search.set('estatus', params.estatus)
  if (params?.ubicacion) search.set('ubicacion', params.ubicacion)
  if (params?.codigo) search.set('codigo', params.codigo)
  if (params?.search) search.set('search', params.search)
  if (params?.ordering) search.set('ordering', params.ordering)

  const query = search.toString()
  const todas: Prenda[] = []
  let page = 1

  while (true) {
    const pageQuery = query ? `${query}&page=${page}` : `page=${page}`
    const data = await apiRequest<PaginatedResponse<PrendaApi>>(`/prendas/?${pageQuery}`)
    todas.push(...data.results.map(mapPrenda))
    if (!data.next) break
    page += 1
  }

  return todas
}

export async function createPrenda(payload: Omit<Prenda, 'id'>): Promise<Prenda> {
  const data = await apiRequest<PrendaApi>('/prendas/', {
    method: 'POST',
    body: JSON.stringify(normalizarPrendaParcial(payload)),
  })
  return mapPrenda(data)
}

export async function updatePrenda(id: string, payload: Partial<Prenda>): Promise<Prenda> {
  const data = await apiRequest<PrendaApi>(`/prendas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(normalizarPrendaParcial(payload)),
  })
  return mapPrenda(data)
}

export async function deletePrenda(id: string): Promise<void> {
  await apiRequest<void>(`/prendas/${id}/`, { method: 'DELETE' })
}
