import { AlertTriangle, CalendarClock } from 'lucide-react'
import { etiquetaAvisoDisponibilidad, type ConflictoPieza } from '../../utils/disponibilidadPieza'

export interface AvisoDisponibilidadItem {
  conflicto: ConflictoPieza
  /** Etiqueta opcional de prenda (Saco, Chaleco, Pantalón, etc.) */
  prenda?: string
}

export function AvisoDisponibilidadInventario({ texto }: { texto: string | null }) {
  if (!texto) return null
  return (
    <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium normal-case leading-tight text-amber-700">
      <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
      {texto}
    </p>
  )
}

function ItemAvisoDisponibilidad({ item }: { item: AvisoDisponibilidadItem }) {
  const { conflicto, prenda } = item
  const esBloqueo = conflicto.estado === 'ocupada_misma_semana'

  return (
    <li
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${
        esBloqueo
          ? 'border-red-200 bg-red-50/80'
          : 'border-amber-200/80 bg-white/70'
      }`}
    >
      <CalendarClock
        className={`mt-0.5 h-4 w-4 shrink-0 ${esBloqueo ? 'text-red-600' : 'text-amber-600'}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1 text-xs leading-relaxed">
        {prenda && (
          <span
            className={`mr-1.5 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              esBloqueo
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {prenda}
          </span>
        )}
        <span className={esBloqueo ? 'font-medium text-red-900' : 'font-medium text-amber-950'}>
          {etiquetaAvisoDisponibilidad(conflicto)}
        </span>
      </div>
    </li>
  )
}

export function ListaAvisosDisponibilidad({ items }: { items: AvisoDisponibilidadItem[] }) {
  if (!items.length) return null
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <ItemAvisoDisponibilidad
          key={`${item.prenda ?? 'pieza'}-${item.conflicto.rentaId}`}
          item={item}
        />
      ))}
    </ul>
  )
}

export function BannerAvisoDisponibilidad({ items }: { items: AvisoDisponibilidadItem[] }) {
  if (!items.length) return null

  const hayBloqueo = items.some((i) => i.conflicto.estado === 'ocupada_misma_semana')
  const esProximaSemana = !hayBloqueo

  return (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-sm ${
        hayBloqueo
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100/60'
          : 'border-amber-300 bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50/80'
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          hayBloqueo ? 'bg-red-500' : 'bg-amber-500'
        }`}
        aria-hidden
      />
      <div className="flex gap-3 p-4 pl-5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            hayBloqueo
              ? 'bg-red-100 text-red-700 ring-2 ring-red-200/80'
              : 'bg-amber-100 text-amber-700 ring-2 ring-amber-200/80'
          }`}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h4
            className={`text-sm font-bold tracking-tight ${
              hayBloqueo ? 'text-red-950' : 'text-amber-950'
            }`}
          >
            {hayBloqueo ? 'Pieza no disponible' : 'Semana cercana entre rentas'}
          </h4>
          <p
            className={`mt-0.5 text-xs leading-relaxed ${
              hayBloqueo ? 'text-red-800/90' : 'text-amber-800/90'
            }`}
          >
            {esProximaSemana
              ? 'Estas piezas tienen otra renta la semana siguiente. Puedes continuar, pero coordina fechas con el cliente.'
              : 'Una o más piezas están ocupadas en la misma semana. Elige otra pieza o cambia la fecha de salida.'}
          </p>
          <div className="mt-3">
            <ListaAvisosDisponibilidad items={items} />
          </div>
        </div>
      </div>
    </div>
  )
}
