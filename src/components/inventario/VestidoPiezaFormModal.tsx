import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import type { Pieza, TipoPiezaVestido } from '../../types/pieza'
import { etiquetaTipoVestido } from '../../types/pieza'
import type { EstatusInventario } from '../../types'
import {
  crearVestidoFormularioVacio,
  piezaAVestidoFormulario,
  vestidoFormularioAPieza,
  type VestidoPiezaFormValues,
} from '../../utils/vestidoPiezaForm'
import { aMayusculas } from '../../utils/mayusculas'

const TIPOS: { value: TipoPiezaVestido; label: string }[] = [
  { value: 'noche', label: 'Noche' },
  { value: 'quince', label: `${etiquetaTipoVestido('quince')} / Quinceañera` },
  { value: 'boda', label: 'Novia' },
]

interface VestidoPiezaFormModalProps {
  open: boolean
  onClose: () => void
  pieza?: Pieza | null
  tipoInicial?: TipoPiezaVestido
  bloquearTipo?: boolean
  /** Colores mero ya usados en inventario (autocompletado). */
  coloresSugeridos?: string[]
  onSubmit: (payload: Omit<Pieza, 'id'>) => Promise<void>
}

const CAMPOS_MAYUS: (keyof VestidoPiezaFormValues)[] = [
  'marca',
  'codigo',
  'colorMero',
  'colorVestido',
  'talla',
  'detalles',
]

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: 'text' | 'number'
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">{label}</span>
      <input
        type={type}
        className={`input-field ${type === 'text' ? 'uppercase' : ''}`}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? '0.01' : undefined}
      />
    </label>
  )
}

export function VestidoPiezaFormModal({
  open,
  onClose,
  pieza,
  tipoInicial = 'noche',
  bloquearTipo = false,
  coloresSugeridos = [],
  onSubmit,
}: VestidoPiezaFormModalProps) {
  const esEdicion = pieza != null
  const [values, setValues] = useState<VestidoPiezaFormValues>(crearVestidoFormularioVacio(tipoInicial))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(pieza ? piezaAVestidoFormulario(pieza) : crearVestidoFormularioVacio(tipoInicial))
    setError(null)
  }, [open, pieza, tipoInicial])

  const set = (key: keyof VestidoPiezaFormValues) => (v: string) => {
    const valor = CAMPOS_MAYUS.includes(key) ? aMayusculas(v) : v
    setValues((prev) => ({ ...prev, [key]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !values.marca.trim() ||
      !values.codigo.trim() ||
      !values.colorMero.trim() ||
      !values.talla.trim()
    ) {
      setError('Marca, código, color mero y talla son obligatorios.')
      return
    }

    setGuardando(true)
    setError(null)
    try {
      await onSubmit(vestidoFormularioAPieza(values))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const categoriaLabel = TIPOS.find((t) => t.value === values.tipo)?.label ?? 'vestido'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? `Editar ${categoriaLabel} #${pieza?.id}` : 'Agregar al inventario'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Categoría *</span>
            <select
              className="input-field"
              value={values.tipo}
              onChange={(e) => set('tipo')(e.target.value as TipoPiezaVestido)}
              disabled={esEdicion || bloquearTipo}
              required
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <Field label="Marca *" value={values.marca} onChange={set('marca')} required />
          <Field label="Código *" value={values.codigo} onChange={set('codigo')} placeholder="V-001" required />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
              Color mero *
            </span>
            <input
              type="text"
              className="input-field uppercase"
              value={values.colorMero}
              onChange={(e) => set('colorMero')(e.target.value)}
              placeholder="VERDE, ROSA…"
              required
              list={coloresSugeridos.length > 0 ? 'colores-mero-inventario' : undefined}
            />
            {coloresSugeridos.length > 0 && (
              <datalist id="colores-mero-inventario">
                {coloresSugeridos.map((color) => (
                  <option key={color} value={color} />
                ))}
              </datalist>
            )}
            {coloresSugeridos.length > 0 && (
              <span className="mt-1 block text-xs text-gray-500">
                Elige uno existente o escribe uno nuevo; se agregará al filtro.
              </span>
            )}
          </label>
          <Field
            label="Color vestido"
            value={values.colorVestido}
            onChange={set('colorVestido')}
            placeholder="VERDE SAGE CON BRILLOS"
          />
          <Field label="Talla *" value={values.talla} onChange={set('talla')} placeholder="8, 10, M…" required />
          <Field label="Precio renta $ MXN" value={values.precioRenta} onChange={set('precioRenta')} type="number" placeholder="900" />
          <Field label="Precio premier $ MXN" value={values.precioPremier} onChange={set('precioPremier')} type="number" placeholder="1050" />
          <Field label="Precio venta $ MXN" value={values.precioVenta} onChange={set('precioVenta')} type="number" placeholder="3500" />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Estatus</span>
            <select
              className="input-field"
              value={values.estatus}
              onChange={(e) => set('estatus')(e.target.value as EstatusInventario)}
            >
              <option value="disponible">Disponible</option>
              <option value="rentado">Rentado</option>
              <option value="mantenimiento">Mantenimiento / Ajustes</option>
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field
              label="Detalles"
              value={values.detalles}
              onChange={set('detalles')}
              placeholder="Ej. ajustado en cintura, manga larga…"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
