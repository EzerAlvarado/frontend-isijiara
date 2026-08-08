/** Valor para input type="datetime-local" (hora local). */
export function ahoraParaInputDatetime(): string {
  return fechaAInputDatetime(new Date())
}

export function fechaAInputDatetime(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
}

export function isoAInputDatetime(iso: string | undefined | null): string {
  if (!iso) return ahoraParaInputDatetime()
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ahoraParaInputDatetime()
  return fechaAInputDatetime(d)
}

/** Convierte datetime-local a ISO para la API. */
export function inputDatetimeAIso(valor: string): string | undefined {
  const v = valor.trim()
  if (!v) return undefined
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

/** Muestra en tabla: 08/08/2026 3:26 p.m. */
export function formatearFechaHoraRegistro(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  const fecha = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  let h = d.getHours()
  const m = pad(d.getMinutes())
  const periodo = h >= 12 ? 'p.m.' : 'a.m.'
  h = h % 12 || 12
  return `${fecha} ${h}:${m} ${periodo}`
}
