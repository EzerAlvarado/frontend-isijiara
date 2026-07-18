import type { CeldaRenta, EstatusCelda } from '../../types'
import { estatusCeldaBg, estatusCeldaLabels } from '../../utils/estatusCelda'
import type { ModoPintar } from './PaintToolbar'

interface RentasCellProps {
  celda: CeldaRenta
  colorActivo: EstatusCelda | null
  modo: ModoPintar
  estatusFila?: EstatusCelda
  onApply?: (estatus: EstatusCelda, nota?: string) => void
  clasesTextoTipo?: string
}

function tituloCelda(
  estatus: EstatusCelda,
  colorActivo: EstatusCelda | null,
  puedePintar: boolean,
): string | undefined {
  if (puedePintar && colorActivo) {
    if (colorActivo === 'otra_situacion') {
      return `Pintar como: ${estatusCeldaLabels[colorActivo]} (se abrirá el editor de nota)`
    }
    return `Pintar como: ${estatusCeldaLabels[colorActivo]}`
  }
  if (estatus !== 'normal' && estatus !== 'otra_situacion') {
    return estatusCeldaLabels[estatus]
  }
  return undefined
}

function OtraSituacionTooltip({ nota }: { nota: string }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 opacity-0 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:-translate-y-0.5"
    >
      <div className="rounded-lg border border-purple-200 bg-white px-3 py-2.5 shadow-lg shadow-purple-900/10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
          {estatusCeldaLabels.otra_situacion}
        </p>
        <p className="mt-1 text-xs font-normal normal-case leading-relaxed text-gray-800">{nota}</p>
      </div>
      <div className="mx-auto h-2 w-2 -translate-y-px rotate-45 border-b border-r border-purple-200 bg-white" />
    </div>
  )
}

export function RentasCell({
  celda,
  colorActivo,
  modo,
  estatusFila,
  onApply,
  clasesTextoTipo = '',
}: RentasCellProps) {
  const estatus = celda.estatus ?? estatusFila ?? 'normal'
  const puedePintar = colorActivo !== null && modo === 'celda' && onApply
  const notaOtraSituacion = estatus === 'otra_situacion' ? celda.nota?.trim() : ''
  const mostrarTooltip = Boolean(notaOtraSituacion) && !puedePintar

  const handleClick = () => {
    if (!puedePintar || colorActivo === null) return
    onApply(colorActivo)
  }

  return (
    <td
      className={`group relative border border-gray-300 px-2 py-1.5 text-xs font-medium uppercase ${estatusCeldaBg[estatus]} ${
        estatus === 'normal' ? clasesTextoTipo : ''
      } ${
        puedePintar
          ? 'cursor-crosshair hover:outline hover:outline-2 hover:outline-brand-400 hover:outline-offset-[-2px]'
          : ''
      } ${mostrarTooltip ? 'cursor-help' : ''}`}
      onClick={handleClick}
      title={tituloCelda(estatus, colorActivo, Boolean(puedePintar))}
    >
      <span className="inline-flex items-center gap-1.5">
        <span>{celda.valor || '—'}</span>
        {notaOtraSituacion && (
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-purple-700 ring-2 ring-purple-300/60"
            aria-hidden
          />
        )}
      </span>
      {mostrarTooltip && notaOtraSituacion && <OtraSituacionTooltip nota={notaOtraSituacion} />}
    </td>
  )
}
