import { AlertTriangle } from 'lucide-react'

const MENSAJE_DEFAULT = 'Atraso en liquidación de uso de sistema'

type Props = {
  mensaje?: string
}

export function GlobalTicker({ mensaje = MENSAJE_DEFAULT }: Props) {
  const bloque = (
    <span className="flex shrink-0 items-center gap-8 px-8">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="flex items-center gap-2.5 whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em]">{mensaje}</span>
        </span>
      ))}
    </span>
  )

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden border-b border-amber-400/40 bg-amber-500 text-slate-950 shadow-md"
    >
      <p className="sr-only">{mensaje}</p>
      <div className="ticker-track py-2">
        {bloque}
        {bloque}
      </div>
    </div>
  )
}
