import type { Pieza } from '../types/pieza'
import { esTipoVestido, etiquetaTipoVestido } from '../types/pieza'
import type { RentaFormValues } from './rentaForm'
import { formatearPantalonTraje } from './pantalonCodigo'

/** Solo vincula la pieza del inventario y rellena campos según tipo */
export function valoresDesdePieza(
  pieza: Pieza,
  usarCodigosNuevosPantalon = false,
): Partial<RentaFormValues> {
  if (esTipoVestido(pieza.tipo)) {
    return {
      piezaSacoId: pieza.id,
      categoriaVestido: pieza.tipo,
      color: pieza.color,
      marca: pieza.marca,
      chaleco: pieza.colorVestido ?? '',
      saco: pieza.codigoNew || pieza.codigoOld,
      pantalon: pieza.talla,
    }
  }
  if (pieza.tipo === 'saco') {
    return {
      piezaSacoId: pieza.id,
      color: pieza.color ?? '',
      marca: pieza.marca ?? '',
      saco: pieza.talla ?? '',
    }
  }
  if (pieza.tipo === 'chaleco') {
    return {
      piezaChalecoId: pieza.id,
      colorChaleco: pieza.color ?? '',
      marcaChaleco: pieza.marca ?? '',
      chaleco: pieza.talla ?? '',
    }
  }
  return {
    piezaPantalonId: pieza.id,
    colorPantalon: pieza.color ?? '',
    marcaPantalon: pieza.marca ?? '',
    pantalon: formatearPantalonTraje(pieza.talla, pieza, usarCodigosNuevosPantalon),
  }
}

export function etiquetaPieza(pieza: Pieza): string {
  const codigo = pieza.codigoNew || pieza.codigoOld || `#${pieza.id}`
  if (esTipoVestido(pieza.tipo)) {
    const cat = etiquetaTipoVestido(pieza.tipo)
    return `${cat} ${codigo} — ${pieza.marca} ${pieza.color} ${pieza.talla}`
  }
  const tipo =
    pieza.tipo === 'saco' ? 'Saco' : pieza.tipo === 'chaleco' ? 'Chaleco' : 'Pantalón'
  return `${tipo} ${codigo} — ${pieza.color} ${pieza.talla}`
}
