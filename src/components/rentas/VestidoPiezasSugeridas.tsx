import type { Pieza } from '../../types/pieza'
import type { PrecioReferencia } from '../../api/finanzas'
import {
  calcularPrecioVestido,
  esCategoriaQuince,
  esPatrocinio,
  esPrecioOperacionManual,
  type TipoOperacion,
} from '../../utils/precioVestido'

function fmtPrecio(n: number) {
  if (!n) return '—'
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

function opcionesTipo(esVestidos: boolean, categoriaVestido?: string): {
  value: TipoOperacion
  label: string
  hint: string
}[] {
  const articulo = esVestidos ? 'vestido' : 'traje'
  const opciones: { value: TipoOperacion; label: string; hint: string }[] = [
    { value: 'renta', label: 'Renta', hint: 'Recoger en boutique' },
    { value: 'premier', label: 'Premier', hint: 'Entrega a domicilio' },
    { value: 'venta', label: 'Venta', hint: `Venta del ${articulo}` },
    { value: 'patrocinio', label: 'Patrocinio', hint: 'Renta patrocinada' },
  ]
  if (esVestidos && esCategoriaQuince(categoriaVestido)) {
    opciones.push(
      {
        value: 'sesion_fotos',
        label: 'Sesión de fotos',
        hint: 'Sesión fotográfica con vestido',
      },
      {
        value: 'paquete_premium',
        label: 'Paquete Premium',
        hint: 'Paquete premium de XV',
      },
    )
  }
  return opciones
}

interface SelectorTipoOperacionProps {
  value: TipoOperacion
  pieza?: Pieza
  preciosReferencia: PrecioReferencia[]
  esVestidos: boolean
  categoriaVestido?: string
  onChange: (tipo: TipoOperacion) => void
}

export function SelectorTipoOperacion({
  value,
  pieza,
  preciosReferencia,
  esVestidos,
  categoriaVestido,
  onChange,
}: SelectorTipoOperacionProps) {
  const opciones = opcionesTipo(esVestidos, categoriaVestido)
  const avisoPieza = esVestidos
    ? 'Completa color, marca o talla con una sugerencia del inventario para ver los precios.'
    : 'Elige el saco del inventario para ver los precios sugeridos.'
  const ocultarAvisoInventario = value === 'venta' || value === 'premier'
  const cols = opciones.length >= 6 ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">
        Tipo de operación *
      </p>
      {!pieza && !ocultarAvisoInventario && (
        <p className="mb-2 text-[11px] text-amber-700">{avisoPieza}</p>
      )}
      <div className={`grid gap-2 sm:grid-cols-2 ${cols}`}>
        {opciones.map((op) => {
          const esManual = esPrecioOperacionManual(op.value)
          const gratis = esPatrocinio(op.value)
          const precio = esManual || gratis ? 0 : calcularPrecioVestido(pieza, op.value, preciosReferencia)
          const activo = value === op.value
          return (
            <button
              key={op.value}
              type="button"
              onClick={() => onChange(op.value)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                activo
                  ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-200'
                  : 'border-gray-200 bg-white hover:border-brand-300'
              }`}
            >
              <span className="block text-xs font-bold uppercase text-gray-900">{op.label}</span>
              <span className="block text-[10px] text-gray-500">{op.hint}</span>
              <span
                className={`mt-1 block text-sm font-semibold ${esManual || gratis || precio ? 'text-brand-700' : 'text-gray-400'}`}
              >
                {gratis ? 'Gratis' : esManual ? 'Manual' : fmtPrecio(precio)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** @deprecated usar SelectorTipoOperacion */
export const SelectorTipoOperacionVestido = SelectorTipoOperacion
