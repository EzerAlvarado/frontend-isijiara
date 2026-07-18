/** Convierte horario guardado (HH:mm o "5:00 PM") al formato del input type="time" */
export function horarioParaInput(valor: string): string {
  if (!valor) return ''

  const hhmm = valor.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (hhmm) {
    return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}`
  }

  const doce = valor.trim().match(/^(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)$/i)
  if (doce) {
    let horas = parseInt(doce[1], 10)
    const minutos = doce[2]
    const esPm = /^p/i.test(doce[3].replace(/\./g, ''))
    if (esPm && horas < 12) horas += 12
    if (!esPm && horas === 12) horas = 0
    return `${String(horas).padStart(2, '0')}:${minutos}`
  }

  return ''
}

/** Muestra HH:mm como "5:00 p.m." en la tabla */
export function formatearHorario(valor: string): string {
  if (!valor) return ''

  const hhmm = valor.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!hhmm) return valor

  let horas = parseInt(hhmm[1], 10)
  const minutos = hhmm[2]
  const periodo = horas >= 12 ? 'p.m.' : 'a.m.'
  horas = horas % 12 || 12
  return `${horas}:${minutos} ${periodo}`
}

/** Normaliza el valor del input time antes de guardar */
export function horarioDesdeInput(valor: string): string {
  if (!valor) return ''
  const [h, m] = valor.split(':')
  return `${h.padStart(2, '0')}:${m}`
}
