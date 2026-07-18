import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import type { Pieza, TipoPiezaTraje } from '../../types/pieza'
import type { EstatusInventario } from '../../types'
import {
  crearPiezaFormularioVacio,
  formularioAPieza,
  piezaAFormulario,
  type PiezaFormValues,
} from '../../utils/piezaForm'
import { aMayusculas } from '../../utils/mayusculas'

const TIPOS: { value: TipoPiezaTraje; label: string }[] = [
  { value: 'saco', label: 'Saco' },
  { value: 'chaleco', label: 'Chaleco' },
  { value: 'pantalon', label: 'Pantalón' },
]

interface PiezaFormModalProps {
  open: boolean
  onClose: () => void
  pieza?: Pieza | null
  tipoInicial?: TipoPiezaTraje
  onSubmit: (payload: Omit<Pieza, 'id'>) => Promise<void>
}

const CAMPOS_MAYUS: (keyof PiezaFormValues)[] = [
  'color',
  'talla',
  'marca',
  'detalles',
  'codigoOld',
  'codigoNew',
  'conjunto',
]

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">{label}</span>
      <input
        type="text"
        className="input-field uppercase"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
      />
    </label>
  )
}

export function PiezaFormModal({
  open,
  onClose,
  pieza,
  tipoInicial = 'saco',
  onSubmit,
}: PiezaFormModalProps) {
  const esEdicion = pieza != null
  const [values, setValues] = useState<PiezaFormValues>(crearPiezaFormularioVacio(tipoInicial))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(pieza ? piezaAFormulario(pieza) : crearPiezaFormularioVacio(tipoInicial))
    setError(null)
  }, [open, pieza, tipoInicial])

  const set = (key: keyof PiezaFormValues) => (v: string) => {
    const valor = CAMPOS_MAYUS.includes(key) ? aMayusculas(v) : v
    setValues((prev) => ({ ...prev, [key]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.color.trim()) {
      setError('El color es obligatorio.')
      return
    }
    if (!values.talla.trim()) {
      setError('La talla es obligatoria.')
      return
    }

    setGuardando(true)
    setError(null)
    try {
      await onSubmit(formularioAPieza(values))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la pieza.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? `Editar pieza #${pieza?.id}` : 'Agregar pieza al inventario'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
              Tipo *
            </span>
            <select
              className="input-field"
              value={values.tipo}
              onChange={(e) => set('tipo')(e.target.value as TipoPiezaTraje)}
              disabled={esEdicion}
              required
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Color *" value={values.color} onChange={set('color')} required />
          <Field label="Talla *" value={values.talla} onChange={set('talla')} placeholder="40R" required />
          <Field label="Marca" value={values.marca} onChange={set('marca')} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Estatus</span>
            <select
              className="input-field"
              value={values.estatus}
              onChange={(e) => set('estatus')(e.target.value as EstatusInventario)}
            >
              <option value="disponible">Disponible</option>
              <option value="rentado">Rentado</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </label>
          <Field label="Conjunto origen" value={values.conjunto} onChange={set('conjunto')} placeholder="Código del traje" />
          <Field label="Detalles" value={values.detalles} onChange={set('detalles')} />
          <Field label="Código Old" value={values.codigoOld} onChange={set('codigoOld')} />
          <Field label="Código New" value={values.codigoNew} onChange={set('codigoNew')} />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar pieza'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
