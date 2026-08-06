import { Printer, X } from 'lucide-react'
import { ReciboAbonoDocument } from './ReciboAbonoDocument'
import type { Renta } from '../../types'

interface ReciboAbonoPreviewProps {
  open: boolean
  onClose: () => void
  renta: Renta
}

export function ReciboAbonoPreview({ open, onClose, renta }: ReciboAbonoPreviewProps) {
  if (!open) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 print:bg-white print:p-0">
      <div className="relative my-4 w-full max-w-[8.5in] print:my-0 print:max-w-none">
        <div className="mb-4 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-lg print:hidden">
          <div>
            <h3 className="font-semibold text-gray-900">Recibo de Abonos — Folio #{renta.id}</h3>
            <p className="text-xs text-gray-500">
              {renta.cliente?.valor || 'Sin cliente'} — {(renta.abonos?.length ?? 0)} abono(s) · Hoja carta
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrint} className="btn-primary">
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ReciboAbonoDocument renta={renta} />
      </div>
    </div>
  )
}
