import { AlertTriangle } from 'lucide-react'

const MENSAJE_DEFAULT = 'Atraso en liquidación de uso de sistema'

type Props = {
  mensaje?: string
}

export function GlobalTicker({ mensaje = MENSAJE_DEFAULT }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="ticker-wrap relative mb-3 h-9 overflow-hidden"
    >
      <p className="sr-only">{mensaje}</p>
      <span className="ticker-track absolute top-1/2 flex items-center gap-2 whitespace-nowrap text-amber-100/90">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{mensaje}</span>
      </span>
    </div>
  )
}
