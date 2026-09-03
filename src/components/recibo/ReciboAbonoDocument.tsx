import type { Renta } from '../../types'
import { EncabezadoIsijara } from './reciboStyles'
import { fechaLarga, fechaHoraLargaDesdeIso } from '../../utils/documentoRenta'
import { totalCobrarRenta, restanteRenta, totalPagadoRenta } from '../../utils/pagoRenta'
import { fmtMontoConDlls } from '../../utils/tipoCambio'
import { esPagoEnUsd } from '../../utils/metodoPago'

interface ReciboAbonoDocumentProps {
  renta: Renta
  id?: string
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFecha(fechaISO: string): string {
  const base = fechaLarga(fechaISO)
  try {
    const d = new Date(fechaISO)
    if (Number.isNaN(d.getTime())) return base
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    return `${base} ${hora}`
  } catch {
    return base
  }
}

function etiquetaMetodoPago(metodo: string): string {
  const map: Record<string, string> = {
    pesos: 'Pesos',
    dlls: 'Dólares',
    mixto: 'Mixto',
    bbva: 'BBVA',
    zelle: 'Zelle',
    transferencia: 'Transferencia',
  }
  return map[metodo] || metodo
}

export function ReciboAbonoDocument({ renta, id = 'recibo-abono-print' }: ReciboAbonoDocumentProps) {
  const abonos = renta.abonos ?? []
  const totalCobrar = totalCobrarRenta(renta)
  const anticipo = renta.anticipo ?? 0
  const saldoAbonado = totalPagadoRenta(renta)
  const restante = restanteRenta(renta)
  const pagado = restante <= 0
  const fechaFactura = fechaHoraLargaDesdeIso(renta.creadoEn)

  return (
    <div
      id={id}
      className="mx-auto box-border w-full max-w-[8.5in] border border-black bg-white p-4 font-recibo text-[12px] font-semibold uppercase leading-snug text-black shadow-lg print:max-w-none print:w-full print:border-none print:p-0 print:shadow-none"
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
            <span className="font-bold">Fecha factura: </span>
            <span className="normal-case">{fechaFactura || '—'}</span>
          </div>
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Fecha Entrega: </span>
            <span className="normal-case">{fechaLarga(renta.fechaSalida)}</span>
          </div>
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Fecha Evento: </span>
            <span className="normal-case">{fechaLarga(renta.fechaEvento || renta.fechaSalida)}</span>
          </div>
          <div className="border border-gray-900 px-2 py-1">
            <span className="font-bold">Fecha Regreso: </span>
            <span className="normal-case">{fechaLarga(renta.fechaRegreso)}</span>
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
                <td className="border-r border-gray-200 px-2 py-1 normal-case">
                  {fechaFactura || 'Anticipo inicial'}
                </td>
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
                <td className="border-r border-gray-200 px-2 py-1 normal-case">{formatFecha(abono.creadoEn)}</td>
                <td className="border-r border-gray-200 px-2 py-1">
                  {etiquetaMetodoPago(abono.metodoPago)}
                </td>
                <td className="border-r border-gray-200 px-2 py-1 text-right">
                  {esPagoEnUsd(abono.metodoPago)
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
        <div className="w-72 border border-gray-900">
          <div className="flex border-b border-gray-900">
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Total $
            </span>
            <span className="w-36 px-2 py-1 text-right text-[10px] font-bold leading-tight">
              {fmtMontoConDlls(totalCobrar)}
            </span>
          </div>
          <div className="flex border-b border-gray-900">
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Anticipo
            </span>
            <span className="w-36 px-2 py-1 text-right text-[10px] leading-tight">
              {fmtMontoConDlls(anticipo)}
            </span>
          </div>
          <div className="flex border-b border-gray-900">
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Saldo abonado
            </span>
            <span className="w-36 px-2 py-1 text-right text-[10px] leading-tight">
              {fmtMontoConDlls(saldoAbonado)}
            </span>
          </div>
          <div className={`flex ${pagado ? 'bg-green-100' : ''}`}>
            <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 font-bold">
              Restante
            </span>
            <span
              className={`w-36 px-2 py-1 text-right text-[10px] font-bold leading-tight ${
                pagado ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {pagado ? 'PAGADO' : fmtMontoConDlls(restante)}
            </span>
          </div>
        </div>
      </div>

      {/* Firma */}
      <div className="mt-6 flex justify-center">
        <div className="w-56 border-t border-gray-900 pt-1 text-center text-[9px] font-bold">
          Firma del Cliente
        </div>
      </div>

      <p className="mt-4 text-center text-[8px] text-gray-500">
        Este recibo es un comprobante de los pagos realizados. Consérvelo para cualquier aclaración.
      </p>
    </div>
  )
}
