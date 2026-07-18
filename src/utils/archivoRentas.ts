import { parseFechaDDMMYYYY, semanaDesdeISO, semanaKeyDesdeFechaSalida, type SemanaRenta } from './semanasRentas'

const MESES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
] as const

export interface MesArchivo {
  /** Formato YYYY-MM */
  key: string
  label: string
  anio: number
  mes: number
}

export function mesKeyDesdeFechaSalida(fechaSalida: string): string {
  const fecha = parseFechaDDMMYYYY(fechaSalida)
  if (!fecha) return ''
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function etiquetaMesArchivo(key: string): string {
  const [anio, mes] = key.split('-')
  const idx = Number(mes) - 1
  if (idx < 0 || idx > 11 || !anio) return key
  return `${MESES[idx]} ${anio}`
}

export function parseMesArchivo(key: string): MesArchivo | null {
  const m = key.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const anio = Number(m[1])
  const mes = Number(m[2])
  if (mes < 1 || mes > 12) return null
  return { key, label: etiquetaMesArchivo(key), anio, mes: mes - 1 }
}

/** Meses con rentas archivadas, de más reciente a más antiguo */
export function mesesArchivo(
  rentas: { fechaSalida: string }[],
): MesArchivo[] {
  const keys = new Set<string>()
  for (const r of rentas) {
    const k = mesKeyDesdeFechaSalida(r.fechaSalida)
    if (k) keys.add(k)
  }
  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map((key) => parseMesArchivo(key)!)
}

export function conteoRentasPorMes(
  rentas: { fechaSalida: string }[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of rentas) {
    const k = mesKeyDesdeFechaSalida(r.fechaSalida)
    if (!k) continue
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return map
}

export function rentaEnMes(renta: { fechaSalida: string }, mesKey: string): boolean {
  return mesKeyDesdeFechaSalida(renta.fechaSalida) === mesKey
}

/** Ordena rentas por fecha de salida descendente */
export function ordenarRentasPorFechaDesc<T extends { fechaSalida: string }>(rentas: T[]): T[] {
  return [...rentas].sort((a, b) => {
    const fa = parseFechaDDMMYYYY(a.fechaSalida)
    const fb = parseFechaDDMMYYYY(b.fechaSalida)
    if (!fa || !fb) return 0
    return fb.getTime() - fa.getTime()
  })
}

/** Agrupa rentas por semana (lunes–domingo), de la más reciente a la más antigua */
export function agruparRentasPorSemana<T extends { fechaSalida: string }>(
  rentas: T[],
): { semana: SemanaRenta; rentas: T[] }[] {
  const porSemana = new Map<string, T[]>()
  for (const r of rentas) {
    const k = semanaKeyDesdeFechaSalida(r.fechaSalida)
    if (!k) continue
    const lista = porSemana.get(k)
    if (lista) lista.push(r)
    else porSemana.set(k, [r])
  }
  return [...porSemana.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      semana: semanaDesdeISO(key),
      rentas: ordenarRentasPorFechaDesc(porSemana.get(key)!),
    }))
}
