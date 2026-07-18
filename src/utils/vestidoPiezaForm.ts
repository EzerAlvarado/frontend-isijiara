import type { EstatusInventario } from '../types'
import type { Pieza, TipoPiezaVestido } from '../types/pieza'
import { normalizarTipoVestido } from '../types/pieza'

export interface VestidoPiezaFormValues {
  tipo: TipoPiezaVestido
  marca: string
  codigo: string
  colorMero: string
  colorVestido: string
  talla: string
  precioRenta: string
  precioVenta: string
  precioPremier: string
  detalles: string
  estatus: EstatusInventario
}

export function crearVestidoFormularioVacio(tipo: TipoPiezaVestido = 'noche'): VestidoPiezaFormValues {
  return {
    tipo,
    marca: '',
    codigo: '',
    colorMero: '',
    colorVestido: '',
    talla: '',
    precioRenta: '',
    precioVenta: '',
    precioPremier: '',
    detalles: '',
    estatus: 'disponible',
  }
}

export function piezaAVestidoFormulario(pieza: Pieza): VestidoPiezaFormValues {
  return {
    tipo: normalizarTipoVestido(pieza.tipo),
    marca: pieza.marca,
    codigo: pieza.codigoNew || pieza.codigoOld,
    colorMero: pieza.color,
    colorVestido: pieza.colorVestido ?? '',
    talla: pieza.talla,
    precioRenta: pieza.precioRenta ? String(pieza.precioRenta) : '',
    precioVenta: pieza.precioVenta ? String(pieza.precioVenta) : '',
    precioPremier: pieza.precioPremier ? String(pieza.precioPremier) : '',
    detalles: pieza.detalles,
    estatus: pieza.estatus,
  }
}

export function vestidoFormularioAPieza(values: VestidoPiezaFormValues): Omit<Pieza, 'id'> {
  return {
    tipo: values.tipo,
    marca: values.marca.trim(),
    codigoOld: '',
    codigoNew: values.codigo.trim(),
    color: values.colorMero.trim(),
    colorVestido: values.colorVestido.trim(),
    talla: values.talla.trim(),
    detalles: values.detalles.trim(),
    conjunto: '',
    estatus: values.estatus,
    ubicacion: '',
    precioRenta: Number(values.precioRenta) || 0,
    precioVenta: Number(values.precioVenta) || 0,
    precioPremier: Number(values.precioPremier) || 0,
  }
}
