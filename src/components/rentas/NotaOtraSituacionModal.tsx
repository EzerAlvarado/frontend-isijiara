import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { estatusCeldaLabels } from '../../utils/estatusCelda'

interface NotaOtraSituacionModalProps {
  open: boolean
  notaInicial?: string
  onClose: () => void
  onGuardar: (nota: string) => void
}

export function NotaOtraSituacionModal({
  open,
  notaInicial = '',
  onClose,
  onGuardar,
}: NotaOtraSituacionModalProps) {
  const [nota, setNota] = useState(notaInicial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setNota(notaInicial)
      setError(null)
    }
  }, [open, notaInicial])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = nota.trim()
    if (!trimmed) {
      setError('Debes agregar una nota para «Otra situación».')
      return
    }
    onGuardar(trimmed)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={estatusCeldaLabels.otra_situacion}
      headerClass="bg-purple-600"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm leading-relaxed text-gray-600">
          Describe la situación. La nota se mostrará al pasar el cursor sobre la celda pintada.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-purple-800">
            Nota
          </span>
          <textarea
            className="input-field min-h-[108px] resize-y normal-case focus:border-purple-500 focus:ring-purple-500"
            value={nota}
            onChange={(event) => {
              setNota(event.target.value)
              if (error) setError(null)
            }}
            placeholder="Ej. Pieza en reparación, cliente pidió cambio de fecha…"
            autoFocus
            rows={4}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}
