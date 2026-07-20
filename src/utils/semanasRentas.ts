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
]

export interface SemanaRenta {
  key: string
  label: string
  inicio: Date
  fin: Date
}

/** Semana lunes → domingo (ISO) */
export function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export function finDeSemana(inicio: Date): Date {
  const fin = new Date(inicio)
  fin.setDate(fin.getDate() + 6)
  return fin
}

export function formatRangoSemana(inicio: Date, fin: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const mesIni = MESES[inicio.getMonth()]
  const mesFin = MESES[fin.getMonth()]
  return `DEL ${pad(inicio.getDate())} ${mesIni} AL ${pad(fin.getDate())} ${mesFin}`
}

export function semanaDesdeISO(iso: string): SemanaRenta {
  const inicio = inicioDeSemana(new Date(iso + 'T12:00:00'))
  const fin = finDeSemana(inicio)
  const key = toISO(inicio)
  return { key, label: formatRangoSemana(inicio, fin), inicio, fin }
}

export function toISO(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Genera semanas consecutivas a partir de una fecha de inicio */
export function generarSemanas(inicioISO: string, cantidad: number): SemanaRenta[] {
  const semanas: SemanaRenta[] = []
  let cursor = inicioDeSemana(new Date(inicioISO + 'T12:00:00'))
  for (let i = 0; i < cantidad; i++) {
    const fin = finDeSemana(cursor)
    semanas.push({
      key: toISO(cursor),
      label: formatRangoSemana(cursor, fin),
      inicio: new Date(cursor),
      fin,
    })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
  }
  return semanas
}

/** Añade semanas de rentas que queden fuera del catálogo fijo */
export function combinarSemanas(base: SemanaRenta[], semanaKeys: string[]): SemanaRenta[] {
  const porKey = new Map(base.map((s) => [s.key, s]))
  for (const key of semanaKeys) {
    if (!key || porKey.has(key)) continue
    porKey.set(key, semanaDesdeISO(key))
  }
  return [...porKey.values()].sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
}

export function parseFechaDDMMYYYY(str: string): Date | null {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0)
}

export function formatFechaMX(fecha: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
}

/** Suma días a una fecha dd/mm/aaaa y devuelve el mismo formato */
export function sumarDiasFecha(fechaStr: string, dias: number): string {
  const fecha = parseFechaDDMMYYYY(fechaStr)
  if (!fecha) return ''
  fecha.setDate(fecha.getDate() + dias)
  return formatFechaMX(fecha)
}

export const DIAS_RENTA_DEFAULT = 3

export function semanaKeyDesdeFechaSalida(fechaSalida: string): string {
  const fecha = parseFechaDDMMYYYY(fechaSalida)
  if (!fecha) return ''
  return toISO(inicioDeSemana(fecha))
}

/** Lunes de la semana actual */
export function inicioCatalogoDinamico(): string {
  return toISO(inicioDeSemana(new Date()))
}

export const MESES_VENTANA_ADELANTE = 2
export const SEMANAS_VENTANA_ATRAS = 4

/** Semanas pasadas + semana actual + N meses hacia adelante (lunes a domingo) */
export function semanasVentanaActual(
  mesesAdelante = MESES_VENTANA_ADELANTE,
  semanasAtras = SEMANAS_VENTANA_ATRAS,
): SemanaRenta[] {
  const hoy = inicioDeSemana(new Date())
  
  const inicio = new Date(hoy)
  inicio.setDate(inicio.getDate() - semanasAtras * 7)
  
  const limite = new Date()
  limite.setMonth(limite.getMonth() + mesesAdelante)
  limite.setHours(23, 59, 59, 999)

  const semanas: SemanaRenta[] = []
  const cursor = new Date(inicio)

  while (cursor <= limite) {
    const fin = finDeSemana(cursor)
    semanas.push({
      key: toISO(cursor),
      label: formatRangoSemana(cursor, fin),
      inicio: new Date(cursor),
      fin: new Date(fin),
    })
    cursor.setDate(cursor.getDate() + 7)
  }

  return semanas
}

/** ¿La fecha de salida cae en la ventana visible (semanas atrás → +2 meses)? */
export function estaEnVentanaActual(
  fechaSalida: string,
  mesesAdelante = MESES_VENTANA_ADELANTE,
  semanasAtras = SEMANAS_VENTANA_ATRAS,
): boolean {
  const fecha = parseFechaDDMMYYYY(fechaSalida)
  if (!fecha) return false

  const hoy = inicioDeSemana(new Date())
  const inicio = new Date(hoy)
  inicio.setDate(inicio.getDate() - semanasAtras * 7)
  inicio.setHours(0, 0, 0, 0)

  const limite = new Date()
  limite.setMonth(limite.getMonth() + mesesAdelante)
  limite.setHours(23, 59, 59, 999)

  return fecha >= inicio && fecha <= limite
}

/** Rentas con fecha de salida anterior a la semana en curso */
export function esRentaPasada(fechaSalida: string): boolean {
  const fecha = parseFechaDDMMYYYY(fechaSalida)
  if (!fecha) return false

  const inicio = inicioDeSemana(new Date())
  inicio.setHours(0, 0, 0, 0)

  return fecha < inicio
}

/** Semanas únicas de rentas pasadas, de la más reciente a la más antigua */
export function semanasArchivo(
  rentas: { semanaInicio: string; fechaSalida: string }[],
): SemanaRenta[] {
  const keys = new Set<string>()
  for (const r of rentas) {
    const k = semanaKeyDesdeFechaSalida(r.fechaSalida) || r.semanaInicio
    if (k) keys.add(k)
  }
  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map(semanaDesdeISO)
}

/** @deprecated usar semanasVentanaActual() */
export function semanasVisibles(
  rentas: { semanaInicio: string; fechaSalida: string }[],
  cantidadMinima = CANTIDAD_SEMANAS,
): SemanaRenta[] {
  const hoy = inicioCatalogoDinamico()
  const keys = new Set<string>([hoy])

  for (const r of rentas) {
    const k = semanaKeyDesdeFechaSalida(r.fechaSalida) || r.semanaInicio
    if (k) keys.add(k)
  }

  const sorted = [...keys].sort()
  const inicio = sorted[0]
  const fin = sorted[sorted.length - 1]

  const startDate = inicioDeSemana(new Date(inicio + 'T12:00:00'))
  const endDate = inicioDeSemana(new Date(fin + 'T12:00:00'))
  const span =
    Math.floor((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1

  return generarSemanas(inicio, Math.max(cantidadMinima, span))
}

/** @deprecated usar inicioCatalogoDinamico() o semanasVentanaActual() */
export const SEMANA_INICIO_CATALOGO = '2025-06-22'
export const CANTIDAD_SEMANAS = 10
export const FILAS_VACIAS_POR_SEMANA = 2
