import type { EstatusInventario } from '../types'
import type { Pieza, TipoPiezaTraje } from '../types/pieza'

export interface PiezaFormValues {
  tipo: TipoPiezaTraje
  color: string
  talla: string
  marca: string
  detalles: string
  codigoOld: string
  codigoNew: string
  conjunto: string
  estatus: EstatusInventario
  ubicacion: string
}

export function crearPiezaFormularioVacio(tipo: TipoPiezaTraje = 'saco'): PiezaFormValues {
  return {
    tipo,
    color: '',
    talla: '',
    marca: '',
    detalles: '',
    codigoOld: '',
    codigoNew: '',
    conjunto: '',
    estatus: 'disponible',
    ubicacion: '',
  }
}

export function piezaAFormulario(pieza: Pieza): PiezaFormValues {
  const tipo: TipoPiezaTraje =
    pieza.tipo === 'saco' || pieza.tipo === 'chaleco' || pieza.tipo === 'pantalon'
      ? pieza.tipo
      : 'saco'
  return {
    tipo,
    color: pieza.color,
    talla: pieza.talla,
    marca: pieza.marca,
    detalles: pieza.detalles,
    codigoOld: pieza.codigoOld,
    codigoNew: pieza.codigoNew,
    conjunto: pieza.conjunto,
    estatus: pieza.estatus,
    ubicacion: pieza.ubicacion ?? '',
  }
}

export function formularioAPieza(values: PiezaFormValues): Omit<Pieza, 'id'> {
  return {
    tipo: values.tipo,
    color: values.color.trim(),
    talla: values.talla.trim(),
    marca: values.marca.trim(),
    detalles: values.detalles.trim(),
    codigoOld: values.codigoOld.trim(),
    codigoNew: values.codigoNew.trim(),
    conjunto: values.conjunto.trim(),
    estatus: values.estatus,
    ubicacion: values.ubicacion.trim(),
    precioRenta: 0,
    precioVenta: 0,
    precioPremier: 0,
  }
}
