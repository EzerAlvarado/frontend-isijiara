import type { Renta } from '../../types'
import { EncabezadoIsijara } from './reciboStyles'
import { totalCobrarRenta, restanteRenta } from '../../utils/pagoRenta'

interface ReciboAbonoDocumentProps {
  renta: Renta
  id?: string
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFecha(fechaISO: string): string {
  try {
    const d = new Date(fechaISO)
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return fechaISO
  }
}

function etiquetaMetodoPago(metodo: string): string {
  const map: Record<string, string> = {
    pesos: 'Pesos',
    dlls: 'Dólares',
    mixto: 'Mixto',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
  }
  return map[metodo] || metodo
}

export function ReciboAbonoDocument({ renta, id = 'recibo-abono-print' }: ReciboAbonoDocumentProps) {
  const abonos = renta.abonos ?? []
  const totalCobrar = totalCobrarRenta(renta)
  const totalAbonado = abonos.reduce((sum, a) => sum + a.montoMxn, 0)
  const anticipo = renta.anticipo ?? 0
  const restante = restanteRenta(renta)
  const pagado = restante <= 0

  return (
    <div
      id={id}
      className="mx-auto w-full max-w-[816px] border border-gray-400 bg-white p-4 font-serif text-[11px] uppercase leading-tight text-gray-900 shadow-lg print:max-w-none print:border-none print:p-2 print:shadow-none"
    >
      <EncabezadoIsijara />

      <div className="mt-3 text-center">
        <h2 className="text-lg font-bold">Recibo de Abonos</h2>
      </div>

      {/* Datos del cliente y renta */}
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Folio Renta: </span>#{renta.id}
          </div>
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Cliente: </span>
            <span className="uppercase">{renta.cliente?.valor || '—'}</span>
          </div>
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Teléfono: </span>
            {renta.telefono || '—'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Fecha Salida: </span>
            {renta.fechaSalida}
          </div>
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Fecha Regreso: </span>
            {renta.fechaRegreso}
          </div>
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Total a Cobrar: </span>
            <span className="font-bold">${fmt(totalCobrar)}</span>
          </div>
        </div>
      </div>

      {/* Tabla de pagos */}
      <div className="mt-4 border border-gray-900">
        <div className="border-b border-gray-900 bg-gray-100 px-2 py-1 text-center text-xs font-bold">
          Historial de Pagos
        </div>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-gray-900 bg-gray-50">
              <th className="border-r border-gray-300 px-2 py-1 text-left">No.</th>
              <th className="border-r border-gray-300 px-2 py-1 text-left">Fecha</th>
              <th className="border-r border-gray-300 px-2 py-1 text-left">Forma de Pago</th>
              <th className="border-r border-gray-300 px-2 py-1 text-right">Monto</th>
              <th className="px-2 py-1 text-right">Equiv. MXN</th>
            </tr>
          </thead>
          <tbody>
            {/* Anticipo inicial */}
            {anticipo > 0 && (
              <tr className="border-b border-gray-200">
                <td className="border-r border-gray-200 px-2 py-1">—</td>
                <td className="border-r border-gray-200 px-2 py-1">Anticipo inicial</td>
                <td className="border-r border-gray-200 px-2 py-1">
                  {etiquetaMetodoPago(renta.metodoPago ?? 'pesos')}
                </td>
                <td className="border-r border-gray-200 px-2 py-1 text-right">${fmt(anticipo)}</td>
                <td className="px-2 py-1 text-right">${fmt(anticipo)}</td>
              </tr>
            )}
            {/* Abonos */}
            {abonos.map((abono, i) => (
              <tr key={abono.id} className="border-b border-gray-200">
                <td className="border-r border-gray-200 px-2 py-1">{i + 1}</td>
                <td className="border-r border-gray-200 px-2 py-1">{formatFecha(abono.creadoEn)}</td>
                <td className="border-r border-gray-200 px-2 py-1">
                  {etiquetaMetodoPago(abono.metodoPago)}
                </td>
                <td className="border-r border-gray-200 px-2 py-1 text-right">
                  {abono.metodoPago === 'dlls'
                    ? `$${fmt(abono.monto)} USD`
                    : abono.metodoPago === 'mixto'
                      ? `$${fmt(abono.pagoEfectivoMxn ?? 0)} + $${fmt(abono.pagoEfectivoUsd ?? 0)} USD`
                      : `$${fmt(abono.monto)}`}
                </td>
                <td className="px-2 py-1 text-right">${fmt(abono.montoMxn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 border border-gray-900">
          <div className="flex border-b border-gray-900">
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Total a Pagar
            </span>
            <span className="w-28 px-2 py-1 text-right font-bold">${fmt(totalCobrar)}</span>
          </div>
          <div className="flex border-b border-gray-900">
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Anticipo
            </span>
            <span className="w-28 px-2 py-1 text-right">${fmt(anticipo)}</span>
          </div>
          <div className="flex border-b border-gray-900">
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Total Abonado
            </span>
            <span className="w-28 px-2 py-1 text-right">${fmt(totalAbonado)}</span>
          </div>
          <div className={`flex ${pagado ? 'bg-green-100' : ''}`}>
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Saldo Restante
            </span>
            <span className={`w-28 px-2 py-1 text-right font-bold ${pagado ? 'text-green-700' : 'text-red-700'}`}>
              {pagado ? 'PAGADO' : `$${fmt(restante)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Firma */}
      <div className="mt-6 mx-auto w-64">
        <div className="border-t border-gray-900 pt-1 text-center text-[9px] font-bold">
          Firma del Cliente
        </div>
      </div>

      <p className="mt-4 text-center text-[8px] text-gray-500">
        Este recibo es un comprobante de los pagos realizados. Consérvelo para cualquier aclaración.
      </p>
    </div>
  )
}
