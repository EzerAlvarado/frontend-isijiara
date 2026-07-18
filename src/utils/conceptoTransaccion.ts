/** Etiqueta de concepto para transacciones del corte (fallback si la API no envía concepto). */
export function conceptoDesdeReferencia(referencia: string): string {
  const ref = referencia.toUpperCase()
  if (ref.startsWith('G')) return 'Vale'
  if (ref.startsWith('M')) return 'Multa'
  if (ref.startsWith('D')) return 'Daños'
  if (ref.startsWith('R')) return 'Renta'
  if (ref.startsWith('A')) return 'Abono'
  return 'Otro'
}

export function conceptoTransaccion(tx: { referencia: string; concepto?: string }): string {
  return tx.concepto || conceptoDesdeReferencia(tx.referencia)
}

export function conceptoBadgeClass(concepto: string): string {
  const c = concepto.toLowerCase()
  if (c.includes('multa')) return 'bg-amber-100 text-amber-900'
  if (c.includes('daño') || c.includes('dano')) return 'bg-orange-100 text-orange-900'
  if (c.includes('abono')) return 'bg-sky-100 text-sky-900'
  if (c.includes('vale')) return 'bg-amber-100 text-amber-800'
  if (c.includes('venta')) return 'bg-violet-100 text-violet-900'
  if (c.includes('premier')) return 'bg-purple-100 text-purple-900'
  if (c.includes('patrocinio') || c.includes('patrocion')) return 'bg-teal-100 text-teal-900'
  if (c.includes('renta')) return 'bg-emerald-100 text-emerald-900'
  return 'bg-gray-100 text-gray-700'
}
