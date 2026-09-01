/** Interpreta montos en MXN: 5000, 5,000, 5000.00 o 5000,00. */
export function parseMontoMxn(valor: string | number | null | undefined): number {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0
  }
  if (valor == null) return 0
  let s = String(valor).trim().replace(/\$/g, '').replace(/\s/g, '')
  if (!s) return 0

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = s.split(',')
    const dec = parts[1] ?? ''
    if (dec.length > 0 && dec.length <= 2) {
      s = `${parts[0].replace(/\./g, '')}.${dec}`
    } else {
      s = s.replace(/,/g, '')
    }
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
