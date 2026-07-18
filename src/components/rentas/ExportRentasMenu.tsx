import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react'

interface ExportRentasMenuProps {
  disabled?: boolean
  onExportExcel: () => void
  onExportPdf: () => void | Promise<void>
  titleExcel?: string
  titlePdf?: string
}

export function ExportRentasMenu({
  disabled,
  onExportExcel,
  onExportPdf,
  titleExcel = 'Exportar CSV para Excel',
  titlePdf = 'Reporte mensual en PDF',
}: ExportRentasMenuProps) {
  const [abierto, setAbierto] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [abierto])

  const elegirExcel = () => {
    setAbierto(false)
    onExportExcel()
  }

  const elegirPdf = async () => {
    setAbierto(false)
    setGenerandoPdf(true)
    try {
      await onExportPdf()
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="btn-secondary"
        disabled={disabled || generandoPdf}
        aria-expanded={abierto}
        aria-haspopup="menu"
      >
        <Download className="h-4 w-4" />
        {generandoPdf ? 'Generando PDF…' : 'Exportar'}
        <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={elegirExcel}
            title={titleExcel}
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-700" />
            Excel (CSV)
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={elegirPdf}
            title={titlePdf}
          >
            <FileText className="h-4 w-4 shrink-0 text-red-700" />
            PDF reporte
          </button>
        </div>
      )}
    </div>
  )
}
