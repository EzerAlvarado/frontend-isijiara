import { Printer, X } from 'lucide-react'
import { NotaVentaDocument } from './NotaVentaDocument'
import type { DocumentoRenta } from '../../types/documentoRenta'

interface NotaVentaPreviewProps {
  open: boolean
  onClose: () => void
  doc: DocumentoRenta
}

export function NotaVentaPreview({ open, onClose, doc }: NotaVentaPreviewProps) {
  if (!open) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* UI en pantalla: se oculta al imprimir */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 print:hidden">
        <div className="relative my-4 w-full max-w-[8.5in]">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Recibo y Pagaré — Folio #{doc.folio}</h3>
              <p className="text-xs text-gray-500">
                {doc.cliente.nombre} — Formato hoja carta (8.5 × 11 in)
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

          {/* Vista previa en pantalla (sin el id de impresión) */}
          <NotaVentaDocument doc={doc} id="nota-venta-preview" />
        </div>
      </div>

      {/*
        Copia solo para imprimir, fuera del modal fixed/relative,
        para que quede arriba de la hoja sin hueco.
      */}
      <div className="hidden print:contents">
        <NotaVentaDocument doc={doc} id="nota-venta-print" />
      </div>
    </>
  )
}
