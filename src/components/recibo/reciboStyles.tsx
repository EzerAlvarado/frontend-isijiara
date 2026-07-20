import type { ReactNode } from 'react'

function LogoIsijara() {
  return (
    <img
      src="/logo-isijara.png"
      alt="Isijara Boutique"
      className="h-[60px] w-auto shrink-0 object-contain"
    />
  )
}

export function EncabezadoIsijara() {
  return (
    <div className="flex gap-3 border-b border-gray-900 pb-2">
      <LogoIsijara />
      <div className="flex-1 text-center text-[9px] leading-tight">
        <h1 className="text-base font-bold tracking-wide text-gray-900">ISIJARA BOUTIQUE</h1>
        <p className="font-semibold uppercase">Vestidos de Gala, XV &amp; Tuxedos</p>
        <p>Campestre, Ave. Colima y calle 26, Plaza Elisa</p>
        <p>Ave. Colima y 26 · San Luis Río Colorado, Son.</p>
        <p className="font-medium">Tel. (653) 291-2297 · (653) 690-7058 · (653) 130-3882</p>
        <p className="italic text-gray-600">
          Horario: Lun–Sáb 10:00 a.m. – 7:00 p.m. · Dom 10:00 a.m. – 2:00 p.m.
        </p>
        <p className="text-gray-600">Facebook: Isijara Boutique · Instagram: @IsijaraBoutique</p>
      </div>
    </div>
  )
}

export function Celda({
  label,
  value,
  className = '',
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={`border border-gray-900 px-1.5 py-0.5 ${className}`}>
      <span className="font-bold">{label}: </span>
      <span>{value}</span>
    </div>
  )
}
