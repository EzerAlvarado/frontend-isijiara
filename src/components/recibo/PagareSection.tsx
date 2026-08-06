import type { DocumentoRenta } from '../../types/documentoRenta'

interface PagareSectionProps {
  doc: DocumentoRenta
}

export function PagareSection({ doc }: PagareSectionProps) {
  const { pagaré, folio, cliente } = doc

  return (
    <div className="mt-4 border-[3px] border-black p-2 text-[10px] font-semibold leading-snug text-black">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1 border-b-2 border-black pb-1">
        <div className="flex items-center justify-center border-2 border-black px-2 py-1 text-sm font-black uppercase">
          Pagaré
        </div>
        <div className="flex items-center justify-center border-2 border-black px-4 py-1 text-sm font-black">
          No. {folio}
        </div>
        <div className="flex items-center justify-center border-2 border-black px-2 py-1 text-sm font-black">
          BUENO POR $ {Number(pagaré.buenoPor).toFixed(2)}
        </div>
      </div>

      <p className="mt-2">
        En <span className="font-bold uppercase">{pagaré.estado}</span>,{' '}
        <span className="font-bold normal-case">{pagaré.fechaEmision}</span>
      </p>

      <p className="mt-2 text-justify">
        Debe(mos) y pagaré(mos) Incondicionalmente por este Pagaré a la orden de{' '}
        <span className="inline-block min-w-[120px] border-b border-gray-900 font-medium">
          {pagaré.ordenDe}
        </span>{' '}
        en{' '}
        <span className="inline-block min-w-[100px] border-b border-gray-900 font-medium">
          {pagaré.lugarPago}
        </span>{' '}
        el{' '}
        <span className="inline-block min-w-[80px] border-b border-gray-900 font-medium normal-case">
          {pagaré.fechaPago}
        </span>
        .
      </p>

      <div className="mt-2 border border-gray-900 px-2 py-1">
        <span className="font-bold">La cantidad de: </span>
        <span className="font-medium uppercase">{pagaré.cantidadLetra}</span>
      </div>

      <p className="mt-2 text-[8px] leading-tight text-justify text-gray-700">
        El importe consignado en el presente pagaré garantiza el cumplimiento del pago por el valor
        total o la reparación de la(s) prenda(s) entregada(s) en calidad de renta. El cliente reconoce
        y acepta que, en caso de que la(s) prenda(s) sufran cualquier daño, deterioro parcial, pérdida
        o destrucción total mientras se encuentren bajo su resguardo, este pagaré se hará efectivo de
        forma inmediata por el monto acordado para cubrir el costo de reparación o reposición correspondiente.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="border border-gray-900">
          <p className="border-b border-gray-900 bg-gray-100 px-1.5 py-0.5 text-[8px] font-bold uppercase">
            Datos del cliente
          </p>
          <div className="space-y-0.5 p-1.5">
            <p>
              <span className="font-bold">Nombre: </span>
              {cliente.nombre}
            </p>
            <p>
              <span className="font-bold">Dirección: </span>
              {cliente.direccion || '___________________________'}
            </p>
            <p>
              <span className="font-bold">Tel: </span>
              {cliente.telefono}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-end border border-gray-900 p-2">
          <p className="font-bold">Acepto(amos)</p>
          <div className="mt-6 border-t border-gray-900 pt-0.5">
            <span className="text-[8px] font-bold">Firma(s):</span>
          </div>
        </div>
      </div>
    </div>
  )
}
