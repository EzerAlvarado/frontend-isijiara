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
  fechaRenta: string
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
}

export const TERMINOS_RENTA = [
  'Las prendas deben manejarse con sumo cuidado, ya que son confeccionadas con telas y materiales delicados.',
  'Se recomienda no utilizar perfumes ni desodorantes en las áreas que entren en contacto directo con la prenda.',
  'En caso de manchas, no intente removerlas por su cuenta; acuda a la boutique para recibir asesoría.',
  'La renta incluye el tiempo acordado. La entrega debe realizarse en la fecha indicada.',
  'En caso de no recoger la prenda en la fecha acordada, se aplicará un cargo adicional por almacenaje.',
  'Se requiere identificación oficial al momento de la renta y entrega.',
  'Cualquier daño, rotura o pérdida será evaluado y se aplicará un cargo de $100 a $500 MXN según corresponda.',
]
