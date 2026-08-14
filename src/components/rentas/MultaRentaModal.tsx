import { useEffect, useState } from 'react'
import type { Renta } from '../../types'
import { Modal } from '../ui/Modal'
import { fmtMoneyMxn } from '../../utils/tipoCambio'

interface MultaRentaModalProps {
  open: boolean
  renta: Renta | null
  onClose: () => void
  onSubmit: (payload: { cargoDanos: number; notaDanos: string }) => Promise<void>
}

export function MultaRentaModal({ open, renta, onClose, onSubmit }: MultaRentaModalProps) {
  const [cargo, setCargo] = useState('')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !renta) return
    setCargo(renta.cargoDanos ? String(renta.cargoDanos) : '')
    setNota(renta.notaDanos ?? '')
    setError(null)
  }, [open, renta?.id])

  const cargoNumerico = Number.parseFloat(cargo.replace(',', '.')) || 0
  const hayCargo = cargoNumerico > 0 || nota.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renta) return
    if (!hayCargo) {
      setError('Indica el monto de la multa o una nota.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await onSubmit({
        cargoDanos: cargoNumerico > 0 ? cargoNumerico : 0,
        notaDanos: nota.trim(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la multa.')
    } finally {
      setGuardando(false)
    }
  }

  if (!renta) return null

  return (
    <Modal open={open} onClose={() => !guardando && onClose()} title="Agregar multa">
      <p className="mb-4 text-sm text-gray-600">
        Renta <strong>#{renta.id}</strong> — {renta.cliente.valor}
      </p>
      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Úsalo si ya marcaste entregado y después viste daños. El monto entra al corte de hoy y las
        piezas pasan a mantenimiento.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Monto de la multa</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={cargo}
            disabled={guardando}
            onChange={(e) => setCargo(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Nota (opcional)</span>
          <textarea
            rows={2}
            placeholder="Ej. mancha, cierre roto, pedrería faltante…"
            value={nota}
            disabled={guardando}
            onChange={(e) => setNota(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        {hayCargo && cargoNumerico > 0 && (
          <p className="text-xs text-amber-700">
            Se registrará {fmtMoneyMxn(cargoNumerico)} en el corte.
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Registrar multa'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
