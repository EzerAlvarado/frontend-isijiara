import type { Prenda } from '../types'

/** Rellena campos de renta desde una prenda del inventario */
export function valoresDesdePrenda(prenda: Prenda) {
  return {
    prendaId: prenda.id,
    color: prenda.color,
    marca: prenda.marca,
    saco: prenda.saco,
    chaleco: prenda.chaleco,
    pantalon: prenda.pantalon,
    detalles: prenda.detalles,
  }
}

export function etiquetaPrenda(prenda: Prenda): string {
  const codigo = prenda.codigoNew || prenda.codigoOld || `#${prenda.id}`
  const piezas = [prenda.saco, prenda.chaleco, prenda.pantalon].filter((p) => p && p !== 'X').join('/')
  return `${codigo} — ${prenda.color}${piezas ? ` (${piezas})` : ''}`
}
