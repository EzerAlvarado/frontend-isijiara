import type { MetodoPago } from './index'

export interface LineaDetalle {
  descripcion: string
  precio?: number
}

export interface ArticuloRenta {
  cantidad: number
  tipo: string
  descripcion: string
  importe: number
}

export interface PagoRenta {
  fecha: string
  monto: number
  formaPago: string
}

export interface DocumentoRenta {
  folio: string
  /** Fecha/hora en que se registró la factura (columna Registrada) */
  fechaRenta: string
  fechaFactura?: string
  /** Renta, venta, premier, etc. — para encabezados del recibo */
  etiquetaOperacion?: string
  cliente: {
    nombre: string
    telefono: string
    direccion: string
  }
  fechas: {
    evento: string
    entrega: string
    regreso: string
    cita?: string
  }
  pagos: PagoRenta[]
  /** Artículo principal en tabla formal */
  articulos: ArticuloRenta[]
  /** Detalle estilo nota (saco, camisa, moño…) */
  lineasDetalle: LineaDetalle[]
  recogera: string
  accesorio: string
  ajustes: string
  depositoReembolsable: string
  atendidaPor: string
  garantia: number
  total: number
  anticipo: number
  /** Anticipo + abonos posteriores, en MXN */
  totalPagado?: number
  /** Solo abonos posteriores (sin anticipo), en MXN */
  totalAbonado?: number
  /** Moneda en que se registró el anticipo (pesos, dlls o mixto) */
  metodoPago?: MetodoPago
  pagoEfectivoMxn?: number
  pagoEfectivoUsd?: number
  feriaMxn?: number
  pagaré: {
    estado: string
    fechaEmision: string
    ordenDe: string
    lugarPago: string
    fechaPago: string
    cantidadLetra: string
    buenoPor: number
  }
  pagado?: boolean
  /** Si es venta, no mostrar pagaré ni términos */
  esVenta?: boolean
}

export const TERMINOS_RENTA = [
  'Las prendas deben manejarse con sumo cuidado, ya que son confeccionadas con telas y materiales delicados.',
  'En caso de manchas, no intente removerlas por su cuenta; acuda a la boutique para recibir asesoría.',
  'La entrega debe realizarse en la fecha indicada. En caso de no entregarse se cobrarán $100 pesos por día.',
  'Acepto que en caso de cancelaciones no hay devoluciones.',
  'Se requiere identificación oficial y vigente al momento de recoger.',
  'Cualquier daño, rotura o pérdida será evaluado y se aplicará un cargo de $100 a $500 MXN según correspondan los daños.',
]
