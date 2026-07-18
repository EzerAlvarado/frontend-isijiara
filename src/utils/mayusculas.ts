import type { CeldaRenta, Prenda, Renta } from '../types'
import type { Pieza } from '../types/pieza'
import { CAMPOS_PRENDA, CAMPOS_INFO } from './rentasCampos'

export function aMayusculas(valor: string): string {
  return valor.toLocaleUpperCase('es-MX')
}

export function normalizarCelda(celda: CeldaRenta): CeldaRenta {
  if (!celda?.valor) return celda
  return { ...celda, valor: aMayusculas(celda.valor) }
}

const CAMPOS_CELDA = [...CAMPOS_PRENDA, ...CAMPOS_INFO] as const

export function normalizarRentaParcial(payload: Partial<Renta>): Partial<Renta> {
  const out: Partial<Renta> = { ...payload }

  for (const campo of CAMPOS_CELDA) {
    const celda = out[campo]
    if (celda && typeof celda === 'object' && 'valor' in celda) {
      out[campo] = normalizarCelda(celda)
    }
  }

  if (out.telefono !== undefined) out.telefono = aMayusculas(out.telefono)
  if (out.direccion !== undefined) out.direccion = aMayusculas(out.direccion)
  if (out.ajustes !== undefined) out.ajustes = aMayusculas(out.ajustes)
  if (out.marca !== undefined) out.marca = aMayusculas(out.marca)
  if (out.colorChaleco !== undefined) out.colorChaleco = aMayusculas(out.colorChaleco)
  if (out.colorPantalon !== undefined) out.colorPantalon = aMayusculas(out.colorPantalon)
  if (out.marcaChaleco !== undefined) out.marcaChaleco = aMayusculas(out.marcaChaleco)
  if (out.marcaPantalon !== undefined) out.marcaPantalon = aMayusculas(out.marcaPantalon)

  return out
}

export function normalizarRenta(renta: Renta): Renta {
  return { ...renta, ...normalizarRentaParcial(renta) } as Renta
}

const CAMPOS_PRENDA_TEXTO = [
  'talla',
  'color',
  'detalles',
  'marca',
  'saco',
  'chaleco',
  'pantalon',
  'codigoOld',
  'codigoNew',
  'ubicacion',
] as const satisfies readonly (keyof Prenda)[]

export function normalizarPrendaParcial(payload: Partial<Prenda>): Partial<Prenda> {
  const out: Partial<Prenda> = { ...payload }
  for (const campo of CAMPOS_PRENDA_TEXTO) {
    const valor = out[campo]
    if (typeof valor === 'string') {
      ;(out as Record<string, string>)[campo] = aMayusculas(valor)
    }
  }
  return out
}

export function normalizarPrenda(prenda: Prenda): Prenda {
  return { ...prenda, ...normalizarPrendaParcial(prenda) } as Prenda
}

const CAMPOS_PIEZA_TEXTO = [
  'color',
  'colorVestido',
  'talla',
  'marca',
  'detalles',
  'codigoOld',
  'codigoNew',
  'conjunto',
  'ubicacion',
] as const satisfies readonly (keyof Pieza)[]

export function normalizarPiezaParcial(payload: Partial<Pieza>): Partial<Pieza> {
  const out: Partial<Pieza> = { ...payload }
  for (const campo of CAMPOS_PIEZA_TEXTO) {
    const valor = out[campo]
    if (typeof valor === 'string') {
      ;(out as Record<string, string>)[campo] = aMayusculas(valor)
    }
  }
  return out
}

export function normalizarPieza(pieza: Pieza): Pieza {
  return { ...pieza, ...normalizarPiezaParcial(pieza) } as Pieza
}
