import type { Abono, Renta } from '../types'
import { apiRequest, type PaginatedResponse } from './client'
import { normalizarRenta, normalizarRentaParcial } from '../utils/mayusculas'

type RentaApi = Omit<
  Renta,
  | 'fondo'
  | 'anticipo'
  | 'multa'
  | 'estatusFila'
  | 'piezaSacoId'
  | 'piezaChalecoId'
  | 'piezaPantalonId'
> & {
  fondo: number | string
  anticipo?: number | string
  multa: number | string
  piezaSacoId?: number | string | null
  piezaChalecoId?: number | string | null
  piezaPantalonId?: number | string | null
  estatusFila?: string
  cancelada?: boolean
  tipoOperacion?: string
  totalCobrar?: number | string
  totalPagado?: number | string
  totalAbonado?: number | string
  restante?: number | string
  pagado?: boolean
  abonos?: AbonoApi[]
}

type AbonoApi = Omit<Abono, 'id' | 'monto' | 'montoMxn'> & {
  id: number | string
  monto: number | string
  montoMxn: number | string
}

function mapAbono(raw: AbonoApi): Abono {
  return {
    id: String(raw.id),
    monto: Number(raw.monto),
    metodoPago: raw.metodoPago,
    pagoEfectivoMxn: Number(raw.pagoEfectivoMxn ?? 0),
    pagoEfectivoUsd: Number(raw.pagoEfectivoUsd ?? 0),
    montoMxn: Number(raw.montoMxn),
    creadoEn: raw.creadoEn,
  }
}

function mapRenta(raw: RentaApi): Renta {
  const renta: Renta = {
    ...raw,
    id: String(raw.id),
    fondo: Number(raw.fondo),
    anticipo: Number(raw.anticipo ?? 0),
    multa: Number(raw.multa),
    telefono: raw.telefono ?? '',
    direccion: raw.direccion ?? '',
    piezaSacoId: raw.piezaSacoId != null ? String(raw.piezaSacoId) : null,
    piezaChalecoId: raw.piezaChalecoId != null ? String(raw.piezaChalecoId) : null,
    piezaPantalonId: raw.piezaPantalonId != null ? String(raw.piezaPantalonId) : null,
    ajustes: raw.ajustes ?? '',
    marca: raw.marca ?? '',
    colorChaleco: raw.colorChaleco ?? '',
    colorPantalon: raw.colorPantalon ?? '',
    marcaChaleco: raw.marcaChaleco ?? '',
    marcaPantalon: raw.marcaPantalon ?? '',
    categoriaVestido: raw.categoriaVestido ?? '',
    cancelada: Boolean(raw.cancelada),
    tipoOperacion: raw.tipoOperacion ?? '',
    totalCobrar: raw.totalCobrar != null ? Number(raw.totalCobrar) : undefined,
    totalPagado: raw.totalPagado != null ? Number(raw.totalPagado) : undefined,
    totalAbonado: raw.totalAbonado != null ? Number(raw.totalAbonado) : undefined,
    restante: raw.restante != null ? Number(raw.restante) : undefined,
    pagado: raw.pagado != null ? Boolean(raw.pagado) : undefined,
    abonos: raw.abonos?.map(mapAbono),
    metodoPago: (raw.metodoPago as Renta['metodoPago']) ?? 'pesos',
    pagoEfectivoMxn: Number(raw.pagoEfectivoMxn ?? 0),
    pagoEfectivoUsd: Number(raw.pagoEfectivoUsd ?? 0),
    feriaMxn: Number(raw.feriaMxn ?? 0),
    estatusFila: raw.estatusFila ? (raw.estatusFila as Renta['estatusFila']) : undefined,
  }
  if (!renta.fechaCita?.valor && renta.fechaSalida) {
    renta.fechaCita = { valor: renta.fechaSalida }
  }
  return normalizarRenta(renta)
}

export async function fetchRentas(params?: {
  semana_inicio?: string
  categoria_vestido?: string
}): Promise<Renta[]> {
  const search = new URLSearchParams()
  if (params?.semana_inicio) search.set('semana_inicio', params.semana_inicio)
  if (params?.categoria_vestido) search.set('categoria_vestido', params.categoria_vestido)
  const query = search.toString()
  const data = await apiRequest<PaginatedResponse<RentaApi>>(
    `/rentas/${query ? `?${query}` : ''}`,
  )
  return data.results.map(mapRenta)
}

export async function createRenta(payload: Omit<Renta, 'id'>): Promise<Renta> {
  const data = await apiRequest<RentaApi>('/rentas/', {
    method: 'POST',
    body: JSON.stringify(normalizarRentaParcial(payload)),
  })
  return mapRenta(data)
}

export async function updateRenta(id: string, payload: Partial<Renta>): Promise<Renta> {
  const data = await apiRequest<RentaApi>(`/rentas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(normalizarRentaParcial(payload)),
  })
  return mapRenta(data)
}

export async function cancelRenta(id: string): Promise<Renta> {
  const data = await apiRequest<RentaApi>(`/rentas/${id}/cancelar/`, {
    method: 'POST',
  })
  return mapRenta(data)
}

export async function registrarAbono(
  id: string,
  payload: {
    monto?: number
    metodoPago?: Renta['metodoPago']
    pagoPesos?: number
    pagoDlls?: number
  },
): Promise<Renta> {
  const data = await apiRequest<{ renta: RentaApi }>(`/rentas/${id}/abono/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapRenta(data.renta)
}
