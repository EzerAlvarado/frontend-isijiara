import type { EstatusDevolucion, EstatusInventario, EstatusRenta } from '../../types'
import { etiquetaInventario, estiloBadgeInventario } from '../../utils/inventarioEstatus'

const devolucionLabels: Record<EstatusDevolucion, string> = {
  revisar_salida: 'Revisar si salió',
  afuera: 'Afuera',
  retrasado: 'Retrasado',
  regresado: 'Regresado',
}

const devolucionStyles: Record<EstatusDevolucion, string> = {
  revisar_salida: 'bg-amber-100 text-amber-800',
  afuera: 'bg-blue-100 text-blue-700',
  retrasado: 'bg-red-100 text-red-700',
  regresado: 'bg-green-100 text-green-700',
}

const rentaLabels: Record<EstatusRenta, string> = {
  salio: 'Salió',
  listo_para_entregar: 'Listo para entregar',
  mojado: 'Mojado',
  en_ajustes: 'En Ajustes',
  sucio: 'Sucio',
  retrasado: 'Retrasado',
}

const rentaStyles: Record<EstatusRenta, string> = {
  salio: 'bg-white text-green-700 border border-green-200',
  listo_para_entregar: 'bg-[#2699e6] text-gray-900',
  mojado: 'bg-white text-cyan-500',
  en_ajustes: 'bg-pink-200 text-gray-900',
  sucio: 'bg-white text-yellow-600',
  retrasado: 'bg-orange-100 text-red-600',
}

interface StatusBadgeProps {
  status: EstatusRenta | EstatusInventario | EstatusDevolucion
  variant?: 'renta' | 'inventario' | 'devolucion'
}

export function StatusBadge({ status, variant = 'renta' }: StatusBadgeProps) {
  if (variant === 'inventario') {
    const s = status as EstatusInventario
    return (
      <span
        className={`inline-flex rounded px-1.5 py-0.5 text-xs uppercase ${estiloBadgeInventario(s)}`}
      >
        {etiquetaInventario(s)}
      </span>
    )
  }

  if (variant === 'devolucion') {
    const s = status as EstatusDevolucion
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${devolucionStyles[s]}`}>
        {devolucionLabels[s]}
      </span>
    )
  }

  const s = status as EstatusRenta
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${rentaStyles[s]}`}>
      {rentaLabels[s]}
    </span>
  )
}
