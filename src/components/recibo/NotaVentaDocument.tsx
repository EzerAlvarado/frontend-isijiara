import type { DocumentoRenta } from '../../types/documentoRenta'
import { TERMINOS_RENTA } from '../../types/documentoRenta'
import { calcularResta } from '../../utils/documentoRenta'
import { fmtAnticipo, fmtMontoConDlls, getTipoCambioMxUsd } from '../../utils/tipoCambio'
import type { MetodoPago } from '../../types'
import { EncabezadoIsijara } from './reciboStyles'
import { PagareSection } from './PagareSection'

interface NotaVentaDocumentProps {
  doc: DocumentoRenta
  id?: string
}

function fmt(n: number) {
  return n.toFixed(2)
}

export function NotaVentaDocument({ doc, id = 'nota-venta-print' }: NotaVentaDocumentProps) {
  const montoResta = calcularResta(doc)
  const metodoPago = (doc.metodoPago ?? 'pesos') as MetodoPago
  const totalPagos = doc.pagos.reduce(
    (s, p) =>
      s +
      (p.formaPago.toUpperCase() === 'DLLS'
        ? p.monto * getTipoCambioMxUsd()
        : p.monto),
    0,
  )

  return (
    <div
      id={id}
      className="mx-auto w-full max-w-[816px] border border-gray-400 bg-white p-3 font-serif text-[10px] uppercase leading-tight text-gray-900 shadow-lg print:max-w-none print:border-none print:p-2 print:shadow-none"
    >
      <EncabezadoIsijara />

      {/* Info cliente + fechas + pagos */}
      <div className="mt-2 grid grid-cols-[1fr_200px_180px] gap-1">
        <div className="space-y-0.5">
          <div className="border border-gray-900 px-1.5 py-0.5">
            <span className="font-bold">Folio: </span>
            {doc.folio}
          </div>
          <div className="border border-gray-900 px-1.5 py-0.5">
            <span className="font-bold">Fecha Renta: </span>
            {doc.fechaRenta}
          </div>
          <div className="border border-gray-900 px-1.5 py-0.5">
            <span className="font-bold">Cliente: </span>
            <span className="uppercase">{doc.cliente.nombre}</span>
          </div>
          <div className="border border-gray-900 px-1.5 py-0.5">
            <span className="font-bold">Teléfono: </span>
            {doc.cliente.telefono}
          </div>
          <div className="border border-gray-900 px-1.5 py-0.5">
            <span className="font-bold">Dirección: </span>
            {doc.cliente.direccion}
          </div>
        </div>

        <div className="border border-gray-900">
          <div className="border-b border-gray-900 bg-gray-100 px-1 py-0.5 text-center text-[8px] font-bold uppercase">
            Fechas
          </div>
          {(
            [
              ['Fecha de Evento', doc.fechas.evento],
              ['Fecha de Entrega', doc.fechas.entrega],
              ['Fecha de Regreso', doc.fechas.regreso],
              ['Fecha de Cita', doc.fechas.cita ?? ''],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="flex border-b border-gray-300 last:border-b-0">
              <span className="w-[90px] shrink-0 border-r border-gray-300 px-1 py-0.5 text-[8px] font-bold">
                {label}
              </span>
              <span className="flex-1 px-1 py-0.5">{val}</span>
            </div>
          ))}
        </div>

        <div className="border border-gray-900">
          <div className="grid grid-cols-3 border-b border-gray-900 bg-gray-100 text-[7px] font-bold uppercase">
            <div className="border-r border-gray-900 px-0.5 py-0.5 text-center">FechaPago</div>
            <div className="border-r border-gray-900 px-0.5 py-0.5 text-center">Pago</div>
            <div className="px-0.5 py-0.5 text-center">Forma de Pago</div>
          </div>
          {doc.pagos.map((p, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-gray-300 text-[8px]">
              <div className="border-r border-gray-300 px-0.5 py-0.5">{p.fecha}</div>
              <div className="border-r border-gray-300 px-0.5 py-0.5 text-right">
                {p.formaPago.toUpperCase() === 'DLLS' ? `${fmt(p.monto)} USD` : fmt(p.monto)}
              </div>
              <div className="px-0.5 py-0.5">{p.formaPago}</div>
            </div>
          ))}
          <div className="grid grid-cols-3 bg-gray-50 font-bold">
            <div className="border-r border-gray-300 px-0.5 py-0.5 text-right">Total:</div>
            <div className="col-span-2 px-0.5 py-0.5 text-right">{fmt(totalPagos)}</div>
          </div>
        </div>
      </div>

      {/* Tabla artículos */}
      <div className="mt-2 border border-gray-900">
        <div className="grid grid-cols-[40px_60px_1fr_80px] border-b border-gray-900 bg-gray-100 text-[8px] font-bold uppercase">
          <div className="border-r border-gray-900 px-1 py-0.5 text-center">Cantidad</div>
          <div className="border-r border-gray-900 px-1 py-0.5 text-center">Tipo</div>
          <div className="border-r border-gray-900 px-1 py-0.5">Descripción</div>
          <div className="px-1 py-0.5 text-center">Importe</div>
        </div>
        {doc.articulos.map((a, i) => (
          <div
            key={i}
            className="grid grid-cols-[40px_60px_1fr_80px] border-b border-gray-300 text-[9px] last:border-b-0"
          >
            <div className="border-r border-gray-300 px-1 py-1 text-center">{a.cantidad}</div>
            <div className="border-r border-gray-300 px-1 py-1 text-center">{a.tipo}</div>
            <div className="border-r border-gray-300 px-1 py-1">{a.descripcion}</div>
            <div className="px-1 py-1 text-right">{fmt(a.importe)}</div>
          </div>
        ))}
        <div className="grid grid-cols-[40px_60px_1fr_80px] font-bold">
          <div className="col-span-3 border-r border-gray-900 px-1 py-0.5 text-right">Total</div>
          <div className="px-1 py-0.5 text-right">{fmt(doc.total)}</div>
        </div>
      </div>

      {/* Detalle nota + totales */}
      <div className="mt-2 grid grid-cols-[1fr_200px] gap-2">
        <div>
          <div className="border border-gray-900">
            <div className="border-b border-gray-900 bg-gray-100 px-1.5 py-0.5 text-[8px] font-bold uppercase">
              Detalle de renta
            </div>
            {doc.lineasDetalle.map((l, i) => (
              <div key={i} className="border-b border-gray-200 px-2 py-0.5 last:border-b-0">
                {l.descripcion}
                {l.precio != null && (
                  <span className="float-right font-medium">${l.precio}</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-1 flex border border-gray-900 px-2 py-1">
            <span className="font-bold uppercase">Recogerá: </span>
            <span className="ml-1 flex-1 font-medium">{doc.recogera}</span>
          </div>

          <div className="mt-1 grid grid-cols-2 gap-1 text-[9px]">
            <div className="flex border border-gray-900">
              <span className="border-r border-gray-900 bg-gray-100 px-1.5 py-0.5 font-bold uppercase">
                Accesorio
              </span>
              <span className="flex-1 px-1.5 py-0.5">{doc.accesorio || '—'}</span>
            </div>
            <div className="flex border border-gray-900">
              <span className="border-r border-gray-900 bg-gray-100 px-1.5 py-0.5 font-bold uppercase">
                Ajustes
              </span>
              <span className="flex-1 px-1.5 py-0.5">{doc.ajustes || '—'}</span>
            </div>
            <div className="flex border border-gray-900">
              <span className="border-r border-gray-900 bg-gray-100 px-1.5 py-0.5 text-[8px] font-bold uppercase">
                Depósito reemb.
              </span>
              <span className="flex-1 px-1.5 py-0.5">{doc.depositoReembolsable}</span>
            </div>
            <div className="flex border border-gray-900">
              <span className="border-r border-gray-900 bg-gray-100 px-1.5 py-0.5 font-bold uppercase">
                Atendida por
              </span>
              <span className="flex-1 px-1.5 py-0.5 font-medium">{doc.atendidaPor}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-col border border-gray-900">
            <div className="flex border-b border-gray-900">
              <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 text-right font-bold">
                Total $
              </span>
              <span className="min-w-[88px] px-2 py-1 text-right text-[9px] font-bold leading-tight">
                {fmtMontoConDlls(doc.total)}
              </span>
            </div>
            <div className="flex border-b border-gray-900">
              <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 text-right font-bold">
                Anticipo
              </span>
              <span className="min-w-[88px] px-2 py-1 text-right text-[9px] font-bold leading-tight">
                {metodoPago === 'mixto' && (doc.pagoEfectivoMxn || doc.pagoEfectivoUsd)
                  ? [
                      doc.pagoEfectivoMxn ? `${doc.pagoEfectivoMxn} MXN` : '',
                      doc.pagoEfectivoUsd ? `${doc.pagoEfectivoUsd} DLLS` : '',
                    ]
                      .filter(Boolean)
                      .join(' + ')
                  : fmtAnticipo(doc.anticipo, metodoPago)}
              </span>
            </div>
            {(doc.feriaMxn ?? 0) > 0 && (
              <div className="flex border-b border-gray-900">
                <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 text-right font-bold">
                  Feria
                </span>
                <span className="min-w-[88px] px-2 py-1 text-right text-[9px] font-bold leading-tight">
                  {fmt(doc.feriaMxn!)}
                </span>
              </div>
            )}
            <div className="flex">
              <span className="flex-1 border-r border-gray-900 bg-gray-100 px-2 py-1 text-right font-bold">
                Resta $
              </span>
              <span className="min-w-[88px] px-2 py-1 text-right text-[9px] font-bold leading-tight">
                {doc.pagado ? (
                  <span className="rounded bg-green-600 px-2 py-0.5 text-white">PAGADO</span>
                ) : (
                  fmtMontoConDlls(montoResta)
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="border border-gray-900 px-1.5 py-1 text-center">
              <p className="text-[8px] font-bold uppercase">Depósito Reemb.</p>
              <p className="text-sm font-bold">{doc.depositoReembolsable || '0.00'}</p>
            </div>
            <div
              className={`border border-gray-900 px-1.5 py-1 text-center ${
                doc.pagado ? 'bg-green-100' : ''
              }`}
            >
              <p className="text-[8px] font-bold uppercase">Monto Resta</p>
              <p className="text-[9px] font-bold leading-tight">
                {doc.pagado ? (
                  <span className="text-green-800">PAGADO</span>
                ) : (
                  fmtMontoConDlls(montoResta)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Términos */}
      <div className="mt-2 border border-gray-900 px-2 py-1.5">
        <p className="mb-1 text-[8px] font-bold uppercase">Términos y condiciones</p>
        <ul className="list-disc space-y-0.5 pl-4 text-[7.5px] leading-snug text-gray-800">
          {TERMINOS_RENTA.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex justify-end">
        <div className="w-48 border-t border-gray-900 pt-0.5 text-center text-[8px] font-bold">
          Firma
        </div>
      </div>

      <PagareSection doc={doc} />
    </div>
  )
}
