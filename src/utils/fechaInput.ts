/** Utilidades para capturar fechas dd/mm/aaaa con escritura flexible y calendario. */

export function fechaMxAIso(fechaMx: string): string {
  const m = fechaMx.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ''
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  if (!esFechaValida(y, mo, d)) return ''
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function isoAFechaMx(iso: string): string {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!esFechaValida(y, mo, d)) return ''
  return `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${y}`
}

function esFechaValida(y: number, mo: number, d: number): boolean {
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return false
  const dt = new Date(y, mo - 1, d, 12, 0, 0)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

/** Formatea mientras se escribe: acepta espacios, guiones o solo dígitos → dd/mm/aaaa */
export function formatearFechaMxMientrasEscribe(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** Normaliza al salir del campo (20 03 2004, 20032004, 20-03-2004, etc.). */
export function normalizarFechaMx(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const conBarras = formatearFechaMxMientrasEscribe(trimmed)
  const m = conBarras.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return conBarras

  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  if (!esFechaValida(y, mo, d)) return conBarras
  return `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${y}`
}
