import type { EstatusInventario, Prenda } from '../types'

export interface PrendaFormValues {
  talla: string
  color: string
  detalles: string
  marca: string
  saco: string
  chaleco: string
  pantalon: string
  codigoOld: string
  codigoNew: string
  estatus: EstatusInventario
  ubicacion: string
}

export function crearPrendaFormularioVacio(): PrendaFormValues {
  return {
    talla: 'M',
    color: '',
    detalles: '',
    marca: '',
    saco: '',
    chaleco: '',
    pantalon: '',
    codigoOld: '',
    codigoNew: '',
    estatus: 'disponible',
    ubicacion: '',
  }
}

export function prendaAFormulario(prenda: Prenda): PrendaFormValues {
  return {
    talla: prenda.talla,
    color: prenda.color,
    detalles: prenda.detalles,
    marca: prenda.marca,
    saco: prenda.saco,
    chaleco: prenda.chaleco,
    pantalon: prenda.pantalon,
    codigoOld: prenda.codigoOld,
    codigoNew: prenda.codigoNew,
    estatus: prenda.estatus,
    ubicacion: prenda.ubicacion ?? '',
  }
}

export function formularioAPrenda(values: PrendaFormValues): Omit<Prenda, 'id'> {
  return {
    talla: values.talla.trim(),
    color: values.color.trim(),
    detalles: values.detalles.trim(),
    marca: values.marca.trim(),
    saco: values.saco.trim(),
    chaleco: values.chaleco.trim(),
    pantalon: values.pantalon.trim(),
    codigoOld: values.codigoOld.trim(),
    codigoNew: values.codigoNew.trim(),
    estatus: values.estatus,
    ubicacion: values.ubicacion.trim(),
  }
}
