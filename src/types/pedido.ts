export type TipoPedido = 'tuxedo' | 'noche' | 'xv' | 'novia'

export type EstatusPedido =
  | 'pendiente'
  | 'en_proceso'
  | 'en_boutique'
  | 'en_camino'
  | 'con_kayla'
  | 'no_hay'
  | 'entregado'
  | 'cancelado'

export type ServicioPedido = 'venta' | 'premier' | 'faltante'

export interface Pedido {
  id: string
  cliente: string
  tipoPedido: TipoPedido
  estatus: EstatusPedido
  estiloPiezas: string
  servicio: ServicioPedido
  fechaEntrega: string
  comentarios: string
  mesEtiqueta: string
  orden: number
  creadoEn?: string
  actualizadoEn?: string
}

export const TIPOS_PEDIDO: { value: TipoPedido; label: string }[] = [
  { value: 'tuxedo', label: 'TUXEDO' },
  { value: 'noche', label: 'NOCHE' },
  { value: 'xv', label: 'XV' },
  { value: 'novia', label: 'NOVIA' },
]

export const ESTATUS_PEDIDO: { value: EstatusPedido; label: string; className: string }[] = [
  { value: 'pendiente', label: 'PENDIENTE', className: 'bg-gray-200 text-gray-800' },
  { value: 'en_proceso', label: 'EN PROCESO', className: 'bg-sky-500 text-white' },
  { value: 'en_boutique', label: 'EN BOUTIQUE', className: 'bg-pink-400 text-white' },
  { value: 'en_camino', label: 'EN CAMINO', className: 'bg-violet-600 text-white' },
  { value: 'con_kayla', label: 'CON KAYLA', className: 'bg-indigo-300 text-indigo-950' },
  { value: 'no_hay', label: 'NO HAY', className: 'bg-red-600 text-white' },
  { value: 'entregado', label: 'ENTREGADO', className: 'bg-emerald-600 text-white' },
  { value: 'cancelado', label: 'CANCELADO', className: 'bg-stone-500 text-white' },
]

export const SERVICIOS_PEDIDO: { value: ServicioPedido; label: string }[] = [
  { value: 'venta', label: 'VENTA' },
  { value: 'premier', label: 'PREMIER' },
  { value: 'faltante', label: 'FALTANTE BOUTIQUE' },
]

export function etiquetaTipoPedido(tipo: TipoPedido): string {
  return TIPOS_PEDIDO.find((t) => t.value === tipo)?.label ?? tipo.toUpperCase()
}

export function estiloEstatusPedido(estatus: EstatusPedido): string {
  return ESTATUS_PEDIDO.find((e) => e.value === estatus)?.className ?? 'bg-gray-200 text-gray-800'
}

export function etiquetaEstatusPedido(estatus: EstatusPedido): string {
  return ESTATUS_PEDIDO.find((e) => e.value === estatus)?.label ?? estatus.toUpperCase()
}
