import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import type { EstatusInventario, Prenda } from '../../types'
import { TALLAS_GENERAL } from '../../data/mockData'
import {
  crearPrendaFormularioVacio,
  formularioAPrenda,
  prendaAFormulario,
  type PrendaFormValues,
} from '../../utils/prendaForm'
import { aMayusculas } from '../../utils/mayusculas'

interface PrendaFormModalProps {
  open: boolean
  onClose: () => void
  prenda?: Prenda | null
  onSubmit: (payload: Omit<Prenda, 'id'>) => Promise<void>
}

const CAMPOS_MAYUS: (keyof PrendaFormValues)[] = [
  'color',
  'detalles',
  'marca',
  'saco',
  'chaleco',
  'pantalon',
  'codigoOld',
  'codigoNew',
  'ubicacion',
]

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  readOnly,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  required?: boolean
  readOnly?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">{label}</span>
      <input
        type="text"
        className={`input-field uppercase ${readOnly ? 'bg-gray-50 text-gray-600' : ''}`}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
      />
    </label>
  )
}

export function PrendaFormModal({ open, onClose, prenda, onSubmit }: PrendaFormModalProps) {
  const esEdicion = prenda != null
  const [values, setValues] = useState<PrendaFormValues>(crearPrendaFormularioVacio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(prenda ? prendaAFormulario(prenda) : crearPrendaFormularioVacio())
    setError(null)
  }, [open, prenda])

  const set = (key: keyof PrendaFormValues) => (v: string) => {
    const valor = CAMPOS_MAYUS.includes(key) ? aMayusculas(v) : v
    setValues((prev) => ({ ...prev, [key]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.color.trim()) {
      setError('El color es obligatorio.')
      return
    }
    if (!values.codigoNew.trim()) {
      setError('El código new es obligatorio.')
      return
    }

    setGuardando(true)
    setError(null)
    try {
      await onSubmit(formularioAPrenda(values))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la prenda.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? `Editar prenda #${prenda?.id}` : 'Agregar nueva prenda'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">
            Identificación
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Talla *
              </span>
              <select
                className="input-field"
                value={values.talla}
                onChange={(e) => set('talla')(e.target.value)}
                required
              >
                {TALLAS_GENERAL.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Color *" value={values.color} onChange={set('color')} required />
            <Field label="Marca" value={values.marca} onChange={set('marca')} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Estatus
              </span>
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
            <Field label="Detalles" value={values.detalles} onChange={set('detalles')} />
            <Field label="Ubicación" value={values.ubicacion} onChange={set('ubicacion')} />
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">
            Piezas
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Saco" value={values.saco} onChange={set('saco')} placeholder="38R" />
            <Field label="Chaleco" value={values.chaleco} onChange={set('chaleco')} placeholder="38R o X" />
            <Field label="Pantalón" value={values.pantalon} onChange={set('pantalon')} placeholder="32R" />
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">Códigos</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código Old" value={values.codigoOld} onChange={set('codigoOld')} placeholder="Opcional" />
            <Field label="Código New *" value={values.codigoNew} onChange={set('codigoNew')} required />
          </div>
        </section>

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
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar prenda'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
