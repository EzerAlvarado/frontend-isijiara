import type { DocumentoRenta } from '../../types/documentoRenta'

interface PagareSectionProps {
  doc: DocumentoRenta
}

export function PagareSection({ doc }: PagareSectionProps) {
  const { pagaré, folio, cliente } = doc

  return (
    <div className="mt-4 border-[3px] border-gray-900 p-2 text-[9px] leading-snug">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1 border-b border-gray-900 pb-1">
        <div className="flex items-center justify-center border border-gray-900 px-2 py-1 text-xs font-black uppercase">
          Pagaré
        </div>
        <div className="flex items-center justify-center border border-gray-900 px-4 py-1 text-xs font-bold">
          No. {folio}
        </div>
        <div className="flex items-center justify-center border border-gray-900 px-2 py-1 text-xs font-bold">
          BUENO POR $ {pagaré.buenoPor.toFixed(2)}
        </div>
      </div>

      <p className="mt-2">
        En <span className="font-bold uppercase">{pagaré.estado}</span> a{' '}
        <span className="font-bold">{pagaré.fechaEmision}</span>
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
        <span className="inline-block min-w-[80px] border-b border-gray-900 font-medium">
          {pagaré.fechaPago}
        </span>
        .
      </p>

      <div className="mt-2 border border-gray-900 px-2 py-1">
        <span className="font-bold">La cantidad de: </span>
        <span className="font-medium uppercase">{pagaré.cantidadLetra}</span>
      </div>

      <p className="mt-2 text-[8px] leading-tight text-justify text-gray-700">
        Este pagaré forma parte de una serie numerada del No. 1 al No. ____ y todos están sujetos
        a la condición de que al primer pagaré que no sea pagado a su vencimiento, serán exigibles
        todos los que le sigan en número, además de los ya vencidos, desde la fecha de vencimiento
        de este documento hasta el día de su liquidación, causará intereses moratorios al tipo de
        3% mensual, pagadero en esta ciudad juntamente con el principal.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="border border-gray-900">
          <p className="border-b border-gray-900 bg-gray-100 px-1.5 py-0.5 text-[8px] font-bold uppercase">
            Datos del deudor
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
              <span className="font-bold">Población: </span>
              {cliente.direccion}
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
