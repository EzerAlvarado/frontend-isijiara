import { useState } from 'react'
import { Printer, Trash2, X } from 'lucide-react'
import { eliminarAbono } from '../../api/rentas'
import { etiquetaMetodoPago, esPagoEnUsd } from '../../utils/metodoPago'
import type { Renta } from '../../types'
import { ReciboAbonoDocument } from './ReciboAbonoDocument'
import { SelectorTintaImpresion } from './SelectorTintaImpresion'

interface ReciboAbonoPreviewProps {
  open: boolean
  onClose: () => void
  renta: Renta
  onRentaActualizada?: (renta: Renta) => void
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ReciboAbonoPreview({
  open,
  onClose,
  renta,
  onRentaActualizada,
}: ReciboAbonoPreviewProps) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const abonos = [...(renta.abonos ?? [])].sort(
    (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
  )

  const handlePrint = () => {
    window.print()
  }

  const handleEliminar = async (abonoId: string, etiqueta: string) => {
    const ok = window.confirm(
      `¿Eliminar este abono?\n\n${etiqueta}\n\nTambién se anula en el corte del día.`,
    )
    if (!ok) return
    setGuardando(true)
    setError(null)
    try {
      const actualizada = await eliminarAbono(renta.id, abonoId)
      onRentaActualizada?.(actualizada)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el abono.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 print:hidden">
        <div className="relative my-4 w-full max-w-[8.5in]">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Recibo de Abonos — Folio #{renta.id}</h3>
              <p className="text-xs text-gray-500">
                {renta.cliente?.valor || 'Sin cliente'} — {(renta.abonos?.length ?? 0)} abono(s) ·
                Hoja carta
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SelectorTintaImpresion />
              <button type="button" onClick={handlePrint} className="btn-primary" disabled={guardando}>
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
                disabled={guardando}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {abonos.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase text-amber-900">
                Eliminar abono (si quedó duplicado)
              </p>
              <ul className="space-y-2">
                {abonos.map((abono, i) => {
                  const montoLabel = esPagoEnUsd(abono.metodoPago)
                    ? `$${fmt(abono.monto)} USD`
                    : `$${fmt(abono.montoMxn)}`
                  const etiqueta = `No. ${i + 1} · ${etiquetaMetodoPago(abono.metodoPago)} · ${montoLabel}`
                  return (
                    <li
                      key={abono.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="text-gray-800">{etiqueta}</span>
                      <button
                        type="button"
                        className="btn-secondary border-red-200 text-red-700 hover:bg-red-50"
                        disabled={guardando}
                        onClick={() => void handleEliminar(abono.id, etiqueta)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </li>
                  )
                })}
              </ul>
              {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
            </div>
          )}

          <ReciboAbonoDocument renta={renta} id="recibo-abono-preview" />
        </div>
      </div>

      <div className="hidden print:contents">
        <ReciboAbonoDocument renta={renta} id="recibo-abono-print" />
      </div>
    </>
  )
}
