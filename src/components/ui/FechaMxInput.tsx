import { useRef } from 'react'
import { Calendar } from 'lucide-react'
import {
  fechaMxAIso,
  formatearFechaMxMientrasEscribe,
  isoAFechaMx,
  normalizarFechaMx,
} from '../../utils/fechaInput'

interface FechaMxInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  hint?: string
  placeholder?: string
}

export function FechaMxInput({
  label,
  value,
  onChange,
  required,
  hint,
  placeholder = 'dd/mm/aaaa',
}: FechaMxInputProps) {
  const dateRef = useRef<HTMLInputElement>(null)
  const iso = fechaMxAIso(value)

  const abrirCalendario = () => {
    const el = dateRef.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.click()
    }
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">{label}</span>
      <div className="flex gap-1">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="input-field min-w-0 flex-1 normal-case tracking-wide"
          value={value}
          onChange={(e) => onChange(formatearFechaMxMientrasEscribe(e.target.value))}
          onBlur={() => onChange(normalizarFechaMx(value))}
          placeholder={placeholder}
          required={required}
          title="Escribe 20032004 o 20 03 2004, o usa el calendario"
        />
        <input
          ref={dateRef}
          type="date"
          className="sr-only"
          tabIndex={-1}
          value={iso}
          onChange={(e) => {
            const mx = isoAFechaMx(e.target.value)
            if (mx) onChange(mx)
          }}
          aria-hidden
        />
        <button
          type="button"
          className="btn-secondary shrink-0 px-2.5"
          title="Abrir calendario"
          onClick={abrirCalendario}
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
      {hint ? (
        <span className="mt-0.5 block text-[11px] text-gray-500">{hint}</span>
      ) : (
        <span className="mt-0.5 block text-[11px] text-gray-500">
          Calendario o escribe sin / (ej. 20 03 2026)
        </span>
      )}
    </label>
  )
}
