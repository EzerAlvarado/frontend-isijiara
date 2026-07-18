import type { CampoPrendaCelda, CampoRentaCelda } from '../types'
import type { LineaNegocio } from '../types/auth'
import { etiquetaTipoVestido, type TipoPiezaVestido } from '../types/pieza'

export type TabRentasTrajes = 'tuxedos'
export type TabRentas = TabRentasTrajes | TipoPiezaVestido

export type ColumnaRentaTextoKey = 'marca'

export type CampoRentaCeldaInfo = 'empleado' | 'cliente' | 'fechaCita' | 'horario' | 'detalles'

export type ColumnaRentaInfo =
  | { kind: 'celda'; key: CampoRentaCeldaInfo; label: string; minW?: string }
  | { kind: 'texto'; key: 'ajustes'; label: string; minW?: string }

export type ColumnaRentaPrenda =
  | { kind: 'celda'; key: CampoPrendaCelda; label: string; minW?: string }
  | { kind: 'texto'; key: ColumnaRentaTextoKey; label: string; minW?: string }

export const COLUMNAS_PRENDA_TRAJES: ColumnaRentaPrenda[] = [
  { kind: 'celda', key: 'color', label: 'Color', minW: 'min-w-[140px]' },
  { kind: 'celda', key: 'saco', label: 'Saco', minW: 'min-w-[56px]' },
  { kind: 'celda', key: 'chaleco', label: 'Chaleco', minW: 'min-w-[56px]' },
  { kind: 'celda', key: 'pantalon', label: 'Pantalón', minW: 'min-w-[80px]' },
  { kind: 'celda', key: 'camisa', label: 'Camisa', minW: 'min-w-[100px]' },
  { kind: 'celda', key: 'corbataMono', label: 'Corbata/Moño', minW: 'min-w-[120px]' },
  { kind: 'celda', key: 'cinto', label: 'Cinto', minW: 'min-w-[80px]' },
  { kind: 'celda', key: 'accesorio', label: 'Accesorio', minW: 'min-w-[140px]' },
]

export const COLUMNAS_PRENDA_VESTIDOS: ColumnaRentaPrenda[] = [
  { kind: 'celda', key: 'color', label: 'Color mero', minW: 'min-w-[100px]' },
  { kind: 'celda', key: 'chaleco', label: 'Color vestido', minW: 'min-w-[140px]' },
  { kind: 'texto', key: 'marca', label: 'Marca', minW: 'min-w-[100px]' },
  { kind: 'celda', key: 'saco', label: 'Código', minW: 'min-w-[72px]' },
  { kind: 'celda', key: 'pantalon', label: 'Talla', minW: 'min-w-[56px]' },
  { kind: 'celda', key: 'accesorio', label: 'Accesorios', minW: 'min-w-[140px]' },
]

export const COLUMNAS_INFO: ColumnaRentaInfo[] = [
  { kind: 'celda', key: 'empleado', label: 'Empleado', minW: 'min-w-[80px]' },
  { kind: 'celda', key: 'cliente', label: 'Cliente', minW: 'min-w-[140px]' },
  {
    kind: 'celda',
    key: 'fechaCita',
    label: 'Fecha',
    minW: 'w-[88px] min-w-0 max-w-[100px]',
  },
  { kind: 'celda', key: 'horario', label: 'Horario', minW: 'min-w-[72px]' },
  { kind: 'texto', key: 'ajustes', label: 'Ajustes', minW: 'min-w-[120px]' },
  { kind: 'celda', key: 'detalles', label: 'Detalles', minW: 'min-w-[100px]' },
]

export const TABS_RENTAS_TRAJES: { tab: TabRentasTrajes; label: string }[] = [
  { tab: 'tuxedos', label: 'Tuxedos' },
]

export const TABS_RENTAS_VESTIDOS: { tab: TipoPiezaVestido; label: string }[] = [
  { tab: 'noche', label: 'Noche' },
  { tab: 'quince', label: etiquetaTipoVestido('quince') },
  { tab: 'boda', label: etiquetaTipoVestido('boda') },
]

export function tabsRentas(linea: LineaNegocio) {
  return linea === 'vestidos' ? TABS_RENTAS_VESTIDOS : TABS_RENTAS_TRAJES
}

export function tabInicialRentas(linea: LineaNegocio): TabRentas {
  return linea === 'vestidos' ? 'noche' : 'tuxedos'
}

export function columnasPrenda(linea: LineaNegocio): ColumnaRentaPrenda[] {
  return linea === 'vestidos' ? COLUMNAS_PRENDA_VESTIDOS : COLUMNAS_PRENDA_TRAJES
}

export function tituloRentas(linea: LineaNegocio, tab?: TabRentas): string {
  if (linea === 'trajes') return 'Rentas Tuxedos'
  if (tab === 'quince') return `Rentas ${etiquetaTipoVestido('quince')}`
  if (tab === 'boda') return `Rentas ${etiquetaTipoVestido('boda')}`
  return 'Rentas Noche'
}

export function subtituloTabRentas(tab: TabRentas): string {
  if (tab === 'tuxedos') return 'Tuxedos'
  if (tab === 'quince') return `${etiquetaTipoVestido('quince')} / Quinceañera`
  if (tab === 'boda') return etiquetaTipoVestido('boda')
  return 'Noche'
}

export function camposRentaCelda(linea: LineaNegocio): CampoRentaCelda[] {
  const prenda = columnasPrenda(linea)
    .filter((c): c is Extract<ColumnaRentaPrenda, { kind: 'celda' }> => c.kind === 'celda')
    .map((c) => c.key)
  const info = COLUMNAS_INFO.filter(
    (c): c is Extract<ColumnaRentaInfo, { kind: 'celda' }> => c.kind === 'celda',
  ).map((c) => c.key)
  return [...prenda, ...info]
}

export function rentaCoincideTab(
  renta: { categoriaVestido?: string | null },
  tab: TabRentas,
  linea: LineaNegocio,
): boolean {
  if (linea === 'trajes') return true
  return (renta.categoriaVestido || 'noche') === tab
}
