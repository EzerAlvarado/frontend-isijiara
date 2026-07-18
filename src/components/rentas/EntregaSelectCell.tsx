import type { EstatusCelda, TipoEntrega } from '../../types'
import { estatusCeldaBg } from '../../utils/estatusCelda'

const OPCIONES: { value: TipoEntrega; label: string }[] = [
  { value: 'recoger', label: 'Recoger' },
  { value: 'premier', label: 'Premier' },
]

interface EntregaSelectCellProps {
  value: TipoEntrega
  onChange: (value: TipoEntrega) => void
  esPremier: boolean
  estatusFila?: EstatusCelda
  disabled?: boolean
}

export function EntregaSelectCell({
  value,
  onChange,
  esPremier,
  estatusFila,
  disabled = false,
}: EntregaSelectCellProps) {
  const estatus = estatusFila ?? 'normal'
  const fondoFila = estatus !== 'normal' ? estatusCeldaBg[estatus] : esPremier ? 'bg-purple-50' : 'bg-white'

  return (
    <td className={`border border-gray-300 px-1 py-1.5 text-center text-xs ${fondoFila}`}>
      <div className="inline-flex overflow-hidden rounded border border-gray-300">
        {OPCIONES.map(({ value: v, label }) => {
          const activo = value === v
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(v)}
              className={`whitespace-nowrap px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                activo
                  ? v === 'premier'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-900'
                  : 'bg-transparent text-gray-400 hover:bg-white/60 hover:text-gray-600'
              } ${esPremier && activo ? 'font-bold' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </td>
  )
}
