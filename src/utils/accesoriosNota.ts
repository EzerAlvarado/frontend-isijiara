import { aMayusculas } from './mayusculas'

/** Valores vacíos o equivalentes a "no" en cinto/accesorio */
function esNoAplica(valor: string): boolean {
  const v = valor.trim().toLowerCase()
  return !v || v === 'no' || v === '—' || v === '-' || v === 'x' || v === 'n/a'
}

function textoCinto(valor: string): string {
  const v = aMayusculas(valor.trim())
  if (esNoAplica(v)) return ''
  return v.startsWith('CINTO') ? v : `CINTO ${v}`
}

/**
 * Combina cinto y accesorio para la nota impresa.
 * Ej: cinto "negro 42" + accesorio "cadena dorada y reloj" → "CINTO NEGRO 42 Y CADENA DORADA Y RELOJ"
 * Si ambos son "no", devuelve "NO" una sola vez.
 */
export function formatearAccesoriosNota(cinto: string, accesorio: string): string {
  const c = cinto.trim()
  const a = accesorio.trim()
  const cNo = esNoAplica(c)
  const aNo = esNoAplica(a)

  if (cNo && aNo) return 'NO'
  if (cNo) return aMayusculas(a)
  if (aNo) return textoCinto(c)

  const cintoTexto = textoCinto(c)
  return `${cintoTexto} Y ${aMayusculas(a)}`
}
