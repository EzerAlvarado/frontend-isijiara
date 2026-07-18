import type { LineaNegocio } from '../types/auth'
import type { Renta } from '../types'
import {
  COLUMNAS_INFO,
  columnasPrenda,
  subtituloTabRentas,
  type ColumnaRentaInfo,
  type ColumnaRentaPrenda,
  type TabRentas,
} from './rentasConfig'
import { multaEfectiva } from './multa'
import { formatearHorario } from './horario'
import { etiquetaMetodoPago } from './metodoPago'
import {
  etiquetaTipoOperacionVestido,
  tipoOperacionDesdeRenta,
} from './precioVestido'

function escCsv(valor: string | number): string {
  const s = String(valor ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function filaCsv(celdas: (string | number)[]): string {
  return celdas.map(escCsv).join(',')
}

function valorColumna(renta: Renta, col: ColumnaRentaPrenda): string {
  if (col.kind === 'texto') return renta[col.key] ?? ''
  return renta[col.key].valor ?? ''
}

function valorColumnaInfo(renta: Renta, col: ColumnaRentaInfo): string {
  if (col.kind === 'texto') return renta.ajustes ?? ''
  if (col.key === 'fechaCita') return renta.fechaCita.valor || renta.fechaSalida
  if (col.key === 'horario') return formatearHorario(renta.horario.valor)
  return renta[col.key].valor ?? ''
}

function encabezadosExport(linea: LineaNegocio): string[] {
  const prenda = columnasPrenda(linea).map((c) => c.label)
  const info = COLUMNAS_INFO.map((c) => c.label)
  return [
    'ID',
    'Tipo operación',
    ...prenda,
    'Fecha salida',
    'Fecha regreso',
    'Precio',
    'Anticipo',
    'Multa',
    'Restante',
    'Método pago',
    ...info,
  ]
}

function rentaAFila(renta: Renta, linea: LineaNegocio): (string | number)[] {
  const cols = columnasPrenda(linea)
  const precio = renta.fondo
  const multa = multaEfectiva(renta)
  const restante = precio + multa - (renta.anticipo ?? 0)

  return [
    renta.id,
    renta.cancelada
      ? 'Cancelada'
      : etiquetaTipoOperacionVestido(tipoOperacionDesdeRenta(renta, linea === 'vestidos')),
    ...cols.map((c) => valorColumna(renta, c)),
    renta.fechaSalida,
    renta.fechaRegreso,
    precio,
    renta.anticipo ?? 0,
    multa,
    restante,
    etiquetaMetodoPago(renta.metodoPago ?? 'pesos'),
    ...COLUMNAS_INFO.map((c) => valorColumnaInfo(renta, c)),
  ]
}

export function nombreArchivoExportRentas(
  tab: TabRentas,
  linea: LineaNegocio,
  prefijo: 'rentas' | 'archivo' = 'rentas',
): string {
  const hoy = new Date().toISOString().slice(0, 10)
  const slug =
    linea === 'trajes'
      ? 'tuxedos'
        : tab === 'quince'
          ? 'xv'
        : tab === 'boda'
          ? 'novia'
          : 'noche'
  return `${prefijo}-${slug}-${hoy}.csv`
}

export function rentasACsv(rentas: Renta[], linea: LineaNegocio): string {
  const lineas = [
    filaCsv(encabezadosExport(linea)),
    ...rentas.map((r) => filaCsv(rentaAFila(r, linea))),
  ]
  return '\uFEFF' + lineas.join('\r\n')
}

export function descargarCsv(contenido: string, nombreArchivo: string) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

export function exportarRentasTab(
  rentas: Renta[],
  tab: TabRentas,
  linea: LineaNegocio,
  prefijo: 'rentas' | 'archivo' = 'rentas',
): { nombre: string; filas: number } {
  const nombre = nombreArchivoExportRentas(tab, linea, prefijo)
  descargarCsv(rentasACsv(rentas, linea), nombre)
  return { nombre, filas: rentas.length }
}

export function etiquetaExportTab(tab: TabRentas, linea: LineaNegocio): string {
  if (linea === 'trajes') return 'Tuxedos'
  return subtituloTabRentas(tab)
}
