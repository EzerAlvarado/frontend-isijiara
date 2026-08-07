import type { Pedido } from '../types/pedido'
import { apiRequest, type PaginatedResponse } from './client'

type PedidoApi = Omit<Pedido, 'id' | 'orden'> & {
  id: number | string
  orden?: number
}

function mapPedido(raw: PedidoApi): Pedido {
  return {
    id: String(raw.id),
    cliente: raw.cliente ?? '',
    tipoPedido: raw.tipoPedido,
    estatus: raw.estatus,
    estiloPiezas: raw.estiloPiezas ?? '',
    servicio: raw.servicio,
    fechaEntrega: raw.fechaEntrega ?? '',
    comentarios: raw.comentarios ?? '',
    mesEtiqueta: raw.mesEtiqueta ?? '',
    orden: Number(raw.orden ?? 0),
    creadoEn: raw.creadoEn,
    actualizadoEn: raw.actualizadoEn,
  }
}

export type PedidoPayload = Omit<Pedido, 'id' | 'creadoEn' | 'actualizadoEn'>

export async function fetchPedidos(params?: {
  search?: string
  tipo_pedido?: string
  estatus?: string
}): Promise<Pedido[]> {
  const search = new URLSearchParams()
  if (params?.search) search.set('search', params.search)
  if (params?.tipo_pedido) search.set('tipo_pedido', params.tipo_pedido)
  if (params?.estatus) search.set('estatus', params.estatus)
  const base = search.toString()
  const all: Pedido[] = []
  let page = 1
  for (;;) {
    const query = base ? `${base}&page=${page}` : `page=${page}`
    const data = await apiRequest<PaginatedResponse<PedidoApi>>(`/pedidos/?${query}`)
    all.push(...data.results.map(mapPedido))
    if (!data.next) break
    page += 1
  }
  return all
}

export async function createPedido(payload: PedidoPayload): Promise<Pedido> {
  const data = await apiRequest<PedidoApi>('/pedidos/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapPedido(data)
}

export async function updatePedido(id: string, payload: Partial<PedidoPayload>): Promise<Pedido> {
  const data = await apiRequest<PedidoApi>(`/pedidos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return mapPedido(data)
}

export async function deletePedido(id: string): Promise<void> {
  await apiRequest(`/pedidos/${id}/`, { method: 'DELETE' })
}
