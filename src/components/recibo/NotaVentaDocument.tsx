import type { DocumentoRenta } from '../../types/documentoRenta'
import { TERMINOS_RENTA } from '../../types/documentoRenta'
import { fmtAnticipo, fmtMontoConDlls, getTipoCambioMxUsd } from '../../utils/tipoCambio'
import { calcularResta } from '../../utils/documentoRenta'
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

function pagoEnUsd(formaPago: string): boolean {
  const f = formaPago.toUpperCase()
  return f === 'DLLS' || f === 'ZELLE'
}

export function NotaVentaDocument({ doc, id = 'nota-venta-print' }: NotaVentaDocumentProps) {
  const etiquetaOperacion = doc.etiquetaOperacion || 'Renta'
  const metodoPago = (doc.metodoPago ?? 'pesos') as MetodoPago
  const totalPagos = doc.pagos.reduce(
    (s, p) =>
      s + (pagoEnUsd(p.formaPago) ? p.monto * getTipoCambioMxUsd() : p.monto),
    0,
  )

  return (
    <div
      id={id}
      className="mx-auto box-border w-full max-w-[8.5in] border border-black bg-white p-2.5 font-recibo text-[10px] font-semibold uppercase leading-snug text-black shadow-lg print:max-w-none print:w-full print:border-none print:p-0 print:shadow-none"
    >
      <EncabezadoIsijara />

      {/* 3 columnas alineadas: cliente | fechas | pagos */}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <div className="space-y-0.5">
          <div className="border border-black px-1.5 py-0.5">
            <span className="font-black">Folio: </span>
            {doc.folio}
          </div>
          <div className="border border-black px-1.5 py-0.5">
            <span className="font-black">Fecha {etiquetaOperacion}: </span>
            <span className="normal-case">{doc.fechaRenta}</span>
          </div>
          <div className="border border-black px-1.5 py-0.5">
            <span className="font-black">Cliente: </span>
            <span className="uppercase">{doc.cliente.nombre}</span>
          </div>
          <div className="border border-black px-1.5 py-0.5">
            <span className="font-black">Teléfono: </span>
            {doc.cliente.telefono}
          </div>
          <div className="border border-black px-1.5 py-0.5">
            <span className="font-black">Dirección: </span>
            {doc.cliente.direccion}
          </div>
        </div>

        <div className="border border-black">
          <div className="border-b border-black bg-gray-100 px-1 py-0.5 text-center text-[9px] font-black uppercase">
            Fechas
          </div>
          {(
            [
              ['Entrega', doc.fechas.entrega],
              ['Evento', doc.fechas.evento],
              ['Regreso', doc.fechas.regreso],
              ['Sesión', doc.fechas.cita?.trim() || '-'],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="grid grid-cols-[72px_1fr] border-b border-black/30 last:border-b-0">
              <span className="border-r border-black/30 px-1 py-0.5 text-[8.5px] font-black">
                {label}
              </span>
              <span className="px-1 py-0.5 text-[9px] font-bold normal-case leading-snug">{val}</span>
            </div>
          ))}
        </div>

        <div className="border border-black">
          <div className="grid grid-cols-[1.3fr_0.7fr_0.9fr] border-b border-black bg-gray-100 text-[8px] font-black uppercase">
            <div className="border-r border-black px-0.5 py-0.5 text-center">Fecha</div>
            <div className="border-r border-black px-0.5 py-0.5 text-center">Pago</div>
            <div className="px-0.5 py-0.5 text-center">Forma</div>
          </div>
          {doc.pagos.length === 0 ? (
            <div className="px-1 py-2 text-center text-[8px] text-black/60">Sin pagos</div>
          ) : (
            doc.pagos.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-[1.3fr_0.7fr_0.9fr] border-b border-black/30 text-[8px] font-bold last:border-b-0"
              >
                <div className="border-r border-black/30 px-0.5 py-0.5 normal-case leading-snug">
                  {p.fecha}
                </div>
                <div className="border-r border-black/30 px-0.5 py-0.5 text-right">
                  {pagoEnUsd(p.formaPago) ? `${fmt(p.monto)} USD` : fmt(p.monto)}
                </div>
                <div className="px-0.5 py-0.5 text-center">{p.formaPago}</div>
              </div>
            ))
          )}
          <div
            className="grid grid-cols-[1.3fr_0.7fr_0.9fr] border-t border-black bg-gray-50 text-[11px] text-red-600"
            style={{ fontWeight: 900, WebkitTextStroke: '0.35px currentColor' }}
          >
            <div className="border-r border-black px-0.5 py-0.5 text-right">Total</div>
            <div className="col-span-2 px-0.5 py-0.5 text-right">{fmt(totalPagos)}</div>
          </div>
        </div>
      </div>

      {/* Tabla artículos */}
      <div className="mt-2 border border-black">
        <div className="grid grid-cols-[40px_60px_1fr_80px] border-b border-black bg-gray-100 text-[8px] font-black uppercase">
          <div className="border-r border-black px-1 py-0.5 text-center">Cant.</div>
          <div className="border-r border-black px-1 py-0.5 text-center">Tipo</div>
          <div className="border-r border-black px-1 py-0.5">Descripción</div>
          <div className="px-1 py-0.5 text-center">Importe</div>
        </div>
        {doc.articulos.map((a, i) => (
          <div
            key={i}
            className="grid grid-cols-[40px_60px_1fr_80px] border-b border-black/30 text-[9px] last:border-b-0"
          >
            <div className="border-r border-black/30 px-1 py-0.5 text-center">{a.cantidad}</div>
            <div className="border-r border-black/30 px-1 py-0.5 text-center">{a.tipo}</div>
            <div className="border-r border-black/30 px-1 py-0.5">{a.descripcion}</div>
            <div className="px-1 py-0.5 text-right font-bold">{fmt(a.importe)}</div>
          </div>
        ))}
        <div className="grid grid-cols-[40px_60px_1fr_80px] border-t border-black font-black">
          <div className="col-span-3 border-r border-black px-1 py-0.5 text-right">Total</div>
          <div className="px-1 py-0.5 text-right">{fmt(doc.total)}</div>
        </div>
      </div>

      {/* Detalle (2 cols) + totales (1 col) — misma grilla de 3 */}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <div className="col-span-2 space-y-1">
          <div className="border border-black">
            <div className="border-b border-black bg-gray-100 px-1.5 py-0.5 text-[8px] font-black uppercase">
              Detalle de {etiquetaOperacion}
            </div>
            {doc.lineasDetalle.map((l, i) => (
              <div key={i} className="border-b border-black/20 px-1.5 py-0.5 last:border-b-0">
                {l.descripcion}
                {l.precio != null && (
                  <span className="float-right font-bold">${l.precio}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex border border-black px-1.5 py-0.5">
            <span className="font-black uppercase">Recogerá: </span>
            <span className="ml-1 flex-1 font-bold">{doc.recogera}</span>
          </div>

          <div className="grid grid-cols-2 gap-0.5 text-[8.5px]">
            <div className="grid grid-cols-[80px_1fr] border border-black">
              <span className="border-r border-black bg-gray-100 px-1 py-0.5 font-black uppercase">
                Accesorio
              </span>
              <span className="px-1 py-0.5">{doc.accesorio || '—'}</span>
            </div>
            <div className="grid grid-cols-[60px_1fr] border border-black">
              <span className="border-r border-black bg-gray-100 px-1 py-0.5 font-black uppercase">
                Ajustes
              </span>
              <span className="px-1 py-0.5">{doc.ajustes || '—'}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] border border-black">
              <span className="border-r border-black bg-gray-100 px-1 py-0.5 text-[7.5px] font-black uppercase">
                Depósito reemb.
              </span>
              <span className="px-1 py-0.5">{doc.depositoReembolsable || '—'}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] border border-black">
              <span className="border-r border-black bg-gray-100 px-1 py-0.5 font-black uppercase">
                Atendida por
              </span>
              <span className="px-1 py-0.5 font-bold">{doc.atendidaPor}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="border border-black">
            <div className="grid grid-cols-[1fr_1fr] border-b border-black">
              <span className="border-r border-black bg-gray-100 px-1 py-0.5 text-right font-black">
                Total $
              </span>
              <span className="px-1 py-0.5 text-right text-[8.5px] font-black leading-tight">
                {fmtMontoConDlls(doc.total)}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_1fr]">
              <span className="border-r border-black bg-gray-100 px-1 py-0.5 text-right font-black">
                Anticipo
              </span>
              <span className="px-1 py-0.5 text-right text-[8.5px] font-black leading-tight">
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
            <div className="grid grid-cols-[1fr_1fr] border-t border-black">
              <span className="border-r border-black bg-gray-100 px-1 py-0.5 text-right font-black">
                Restante
              </span>
              <span className="px-1 py-0.5 text-right text-[8.5px] font-black leading-tight">
                {fmtMontoConDlls(calcularResta(doc))}
              </span>
            </div>
          </div>

          <div className="border border-black px-2 py-1 text-center">
            <p className="text-[7.5px] font-black uppercase leading-tight">Depósito Reembolsable</p>
            <p className="text-[11px] font-black leading-tight">
              {doc.depositoReembolsable || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Términos - solo para rentas, no ventas */}
      {!doc.esVenta && (
        <div className="mt-2 border border-black px-2 py-1.5">
          <p className="mb-1 text-[8px] font-black uppercase">Términos y condiciones</p>
          <ul className="list-disc space-y-0.5 pl-3.5 text-[8px] font-semibold leading-snug text-black">
            {TERMINOS_RENTA.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <div className="mt-2 flex justify-end">
            <div className="w-40 border-t border-black pt-0.5 text-center text-[9px] font-black">
              Firma
            </div>
          </div>
        </div>
      )}

      {/* Pagaré - solo para rentas, no ventas */}
      {!doc.esVenta && <PagareSection doc={doc} />}
    </div>
  )
}
