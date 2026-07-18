import { Ban, Banknote, Paintbrush, Pencil, Printer } from 'lucide-react'
import type { CampoRentaCelda, CeldaRenta, EstatusCelda, Renta } from '../../types'
import { RentasCell } from './RentasCell'
import type { ModoPintar } from './PaintToolbar'
import { COLUMNAS_INFO, type ColumnaRentaPrenda } from '../../utils/rentasConfig'
import type { LineaNegocio } from '../../types/auth'
import type { MesArchivo } from '../../utils/archivoRentas'
import { estatusCeldaBg } from '../../utils/estatusCelda'
import { formatearHorario } from '../../utils/horario'
import { FILAS_VACIAS_POR_SEMANA, type SemanaRenta } from '../../utils/semanasRentas'
import {
  etiquetaTipoOperacionVestido,
  tipoOperacionDesdeRenta,
  clasesTextoTipoOperacion,
} from '../../utils/precioVestido'
import { rentaEstaPagada } from '../../utils/pagoRenta'

const CAMPOS_ESTATUS_DEVOLUCION_VESTIDOS = [
  'color',
  'chaleco',
  'saco',
  'pantalon',
  'accesorio',
  'empleado',
  'cliente',
  'fechaCita',
  'horario',
  'detalles',
] as const

const CAMPOS_ESTATUS_DEVOLUCION_TRAJES = [
  'color',
  'saco',
  'chaleco',
  'pantalon',
  'camisa',
  'corbataMono',
  'cinto',
  'accesorio',
] as const

function rentaTieneEstatusDevolucion(renta: Renta, esVestidos: boolean): boolean {
  const fila = renta.estatusFila
  if (fila === 'entregado' || fila === 'arrugado') return true
  const campos = esVestidos ? CAMPOS_ESTATUS_DEVOLUCION_VESTIDOS : CAMPOS_ESTATUS_DEVOLUCION_TRAJES
  return campos.some((key) => {
    const estatus = renta[key]?.estatus
    return estatus === 'entregado' || estatus === 'arrugado'
  })
}

export function totalColumnasRentas(
  columnas: ColumnaRentaPrenda[],
  variant: 'activa' | 'archivo',
  _linea: LineaNegocio,
) {
  const acciones = variant === 'activa' ? 2 : 1
  return acciones + 1 + columnas.length + COLUMNAS_INFO.length
}

function etiquetaOperacionFila(renta: Renta, esVestidos: boolean): string {
  if (renta.cancelada) return 'Cancelada'
  return etiquetaTipoOperacionVestido(tipoOperacionDesdeRenta(renta, esVestidos))
}

export interface FilaRentaHandlers {
  esVestidos: boolean
  variant: 'activa' | 'archivo'
  puedePintarFila?: boolean
  colorActivo?: EstatusCelda | null
  modoPintar?: ModoPintar
  onPintarFila?: (id: string, estatus: EstatusCelda) => void
  onActualizarCelda?: (id: string, campo: CampoRentaCelda, estatus: EstatusCelda) => void
  onEditar?: (renta: Renta) => void
  onAbono?: (renta: Renta) => void
  onImprimir: (renta: Renta) => void
  onCancelar?: (renta: Renta) => void
}

interface FilaRentaProps extends FilaRentaHandlers {
  renta: Renta
  columnasPrenda: ColumnaRentaPrenda[]
}

export function FilaRenta({
  renta,
  columnasPrenda: cols,
  esVestidos,
  variant,
  puedePintarFila = false,
  colorActivo = null,
  modoPintar = 'celda',
  onPintarFila,
  onActualizarCelda,
  onEditar,
  onAbono,
  onImprimir,
  onCancelar,
}: FilaRentaProps) {
  const soloLectura = variant === 'archivo'
  const tipoOperacion = tipoOperacionDesdeRenta(renta, esVestidos)
  const estatusFila = renta.estatusFila
  const estatusRenta = estatusFila ?? 'normal'
  const textoTipoOperacion =
    estatusRenta === 'normal' && !rentaTieneEstatusDevolucion(renta, esVestidos)
      ? clasesTextoTipoOperacion(tipoOperacion)
      : ''
  const bloqueada = Boolean(renta.cancelada) || soloLectura
  const etiquetaOperacion = etiquetaOperacionFila(renta, esVestidos)
  const pagado = rentaEstaPagada(renta)

  return (
    <tr
      className={
        renta.cancelada ? 'bg-gray-100 opacity-70' : pagado ? 'bg-green-50/80' : undefined
      }
    >
      {variant === 'activa' && (
        <td className="border border-gray-300 bg-gray-50 px-1 py-1.5 text-center">
          <button
            type="button"
            disabled={!puedePintarFila || renta.cancelada}
            onClick={() => colorActivo && onPintarFila?.(renta.id, colorActivo)}
            title={
              puedePintarFila
                ? 'Pintar toda la fila con el color seleccionado'
                : esVestidos
                  ? 'Selecciona un color arriba'
                  : 'Selecciona un color y modo "Fila completa"'
            }
            className={`rounded p-1 transition-colors ${
              puedePintarFila
                ? 'cursor-pointer text-brand-600 hover:bg-brand-100'
                : 'cursor-not-allowed text-gray-300'
            }`}
          >
            <Paintbrush className="mx-auto h-4 w-4" />
          </button>
        </td>
      )}
      <td className="border border-gray-300 bg-gray-50 px-1 py-1.5 text-center">
        <button
          type="button"
          onClick={() => onImprimir(renta)}
          title="Imprimir nota y pagaré"
          className="rounded p-1 text-gray-600 transition-colors hover:bg-brand-100 hover:text-brand-700"
        >
          <Printer className="mx-auto h-4 w-4" />
        </button>
      </td>
      <td
        className={`border border-gray-300 px-2 py-1.5 text-xs font-semibold ${estatusCeldaBg[estatusRenta]} ${textoTipoOperacion}`}
      >
        <div className="flex flex-col gap-0.5">
          {!bloqueada && !renta.cancelada && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEditar?.(renta)}
                title="Editar renta"
                className="rounded p-0.5 text-gray-500 hover:bg-white/60 hover:text-brand-700"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {!pagado && onAbono && (
                <button
                  type="button"
                  onClick={() => onAbono(renta)}
                  title="Registrar abono"
                  className="rounded p-0.5 text-gray-500 hover:bg-white/60 hover:text-emerald-700"
                >
                  <Banknote className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onCancelar?.(renta)}
                title="Cancelar renta (libera piezas)"
                className="rounded p-0.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                <Ban className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <span
            className={`text-[11px] font-bold uppercase tracking-wide ${
              renta.cancelada ? 'text-red-700' : pagado ? 'text-green-800' : ''
            }`}
          >
            {etiquetaOperacion}
          </span>
          {pagado && !renta.cancelada && (
            <span className="inline-block rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Pagado
            </span>
          )}
        </div>
      </td>
      {cols.map((col) => {
        if (col.kind === 'texto') {
          return (
            <td
              key={col.key}
              className={`border border-gray-300 px-2 py-1.5 text-xs font-medium uppercase ${estatusCeldaBg[estatusRenta]} ${textoTipoOperacion}`}
            >
              {renta[col.key] || '—'}
            </td>
          )
        }
        return (
          <RentasCell
            key={col.key}
            celda={renta[col.key]}
            colorActivo={colorActivo}
            modo={modoPintar}
            estatusFila={estatusFila}
            clasesTextoTipo={textoTipoOperacion}
            onApply={
              bloqueada || !onActualizarCelda
                ? undefined
                : (estatus) => onActualizarCelda(renta.id, col.key, estatus)
            }
          />
        )
      })}
      {COLUMNAS_INFO.map((col) => {
        const { minW } = col
        if (col.kind === 'texto') {
          return (
            <td
              key={col.key}
              className={`border border-gray-300 px-2 py-1.5 text-xs font-medium uppercase ${minW ?? ''} ${estatusCeldaBg[estatusRenta]} ${textoTipoOperacion}`}
            >
              {renta.ajustes || '—'}
            </td>
          )
        }
        if (col.key === 'fechaCita') {
          const fecha = renta.fechaSalida || renta.fechaCita.valor
          return (
            <td
              key={col.key}
              className={`border border-gray-300 px-1 py-1.5 text-xs font-medium uppercase whitespace-nowrap ${minW ?? ''} ${estatusCeldaBg[estatusRenta]} ${textoTipoOperacion}`}
            >
              {fecha || '—'}
            </td>
          )
        }
        if (col.key === 'horario') {
          return (
            <RentasCell
              key={col.key}
              celda={{
                ...renta.horario,
                valor: formatearHorario(renta.horario.valor) || '—',
              }}
              colorActivo={colorActivo}
              modo={modoPintar}
              estatusFila={estatusFila}
              clasesTextoTipo={textoTipoOperacion}
              onApply={
                bloqueada || !onActualizarCelda
                  ? undefined
                  : (estatus) => onActualizarCelda(renta.id, col.key, estatus)
              }
            />
          )
        }
        return (
          <RentasCell
            key={col.key}
            celda={renta[col.key]}
            colorActivo={colorActivo}
            modo={modoPintar}
            estatusFila={estatusFila}
            clasesTextoTipo={textoTipoOperacion}
            onApply={
              bloqueada || !onActualizarCelda
                ? undefined
                : (estatus) => onActualizarCelda(renta.id, col.key, estatus)
            }
          />
        )
      })}
    </tr>
  )
}

function FilasVacias({ cantidad, totalCols }: { cantidad: number; totalCols: number }) {
  return (
    <>
      {Array.from({ length: cantidad }).map((_, i) => (
        <tr key={`vacia-${i}`} className="h-8">
          {Array.from({ length: totalCols }).map((__, j) => (
            <td key={j} className="border border-gray-300 bg-white px-2 py-2" />
          ))}
        </tr>
      ))}
    </>
  )
}

interface BloqueSemanaProps extends FilaRentaHandlers {
  semana: SemanaRenta
  rentas: Renta[]
  columnasPrenda: ColumnaRentaPrenda[]
  totalCols: number
  mostrarFilasVacias?: boolean
}

export function BloqueSemana({
  semana,
  rentas,
  columnasPrenda: cols,
  totalCols,
  variant,
  mostrarFilasVacias = variant === 'activa',
  ...filaProps
}: BloqueSemanaProps) {
  return (
    <>
      <tr>
        <th
          colSpan={totalCols}
          className="border border-gray-300 bg-yellow-100 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-fuchsia-700"
        >
          {semana.label}
        </th>
      </tr>
      <tr className="bg-sky-100 text-left text-xs font-bold uppercase text-gray-800">
        {variant === 'activa' && (
          <th className="border border-gray-300 px-1 py-2 w-10" title="Pintar fila completa">
            <Paintbrush className="mx-auto h-3.5 w-3.5 text-gray-500" />
          </th>
        )}
        <th className="border border-gray-300 px-1 py-2 w-10" title="Nota y pagaré">
          <Printer className="mx-auto h-3.5 w-3.5 text-gray-500" />
        </th>
        <th className="border border-gray-300 px-2 py-2 min-w-[80px] leading-tight">
          <span className="block">Renta</span>
          <span className="block text-[10px] font-semibold text-gray-600">/ Venta</span>
        </th>
        {cols.map(({ key, label, minW, kind }) => (
          <th key={`${kind}-${key}`} className={`border border-gray-300 px-2 py-2 ${minW ?? ''}`}>
            {label}
          </th>
        ))}
        {COLUMNAS_INFO.map(({ key, label, minW, kind }) => (
          <th
            key={`${kind}-${key}`}
            className={`border border-gray-300 px-2 py-2 ${minW ?? ''} ${key === 'fechaCita' ? 'whitespace-nowrap' : ''}`}
          >
            {label}
          </th>
        ))}
      </tr>
      {rentas.map((renta) => (
        <FilaRenta
          key={renta.id}
          renta={renta}
          columnasPrenda={cols}
          variant={variant}
          {...filaProps}
        />
      ))}
      {mostrarFilasVacias && rentas.length === 0 && (
        <FilasVacias cantidad={FILAS_VACIAS_POR_SEMANA} totalCols={totalCols} />
      )}
    </>
  )
}

export function BloqueMes({
  mes,
  rentas,
  columnasPrenda: cols,
  totalCols,
  variant,
  ...filaProps
}: {
  mes: MesArchivo
  rentas: Renta[]
  columnasPrenda: ColumnaRentaPrenda[]
  totalCols: number
} & FilaRentaHandlers) {
  return (
    <>
      <tr>
        <th
          colSpan={totalCols}
          className="border border-gray-300 bg-yellow-100 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-fuchsia-700"
        >
          {mes.label}
        </th>
      </tr>
      <tr className="bg-sky-100 text-left text-xs font-bold uppercase text-gray-800">
        {variant === 'activa' && (
          <th className="border border-gray-300 px-1 py-2 w-10" title="Pintar fila completa">
            <Paintbrush className="mx-auto h-3.5 w-3.5 text-gray-500" />
          </th>
        )}
        <th className="border border-gray-300 px-1 py-2 w-10" title="Nota y pagaré">
          <Printer className="mx-auto h-3.5 w-3.5 text-gray-500" />
        </th>
        <th className="border border-gray-300 px-2 py-2 min-w-[80px] leading-tight">
          <span className="block">Renta</span>
          <span className="block text-[10px] font-semibold text-gray-600">/ Venta</span>
        </th>
        {cols.map(({ key, label, minW, kind }) => (
          <th key={`${kind}-${key}`} className={`border border-gray-300 px-2 py-2 ${minW ?? ''}`}>
            {label}
          </th>
        ))}
        {COLUMNAS_INFO.map(({ key, label, minW, kind }) => (
          <th
            key={`${kind}-${key}`}
            className={`border border-gray-300 px-2 py-2 ${minW ?? ''} ${key === 'fechaCita' ? 'whitespace-nowrap' : ''}`}
          >
            {label}
          </th>
        ))}
      </tr>
      {rentas.map((renta) => (
        <FilaRenta
          key={renta.id}
          renta={renta}
          columnasPrenda={cols}
          variant={variant}
          {...filaProps}
        />
      ))}
    </>
  )
}

export function aplicarEstatusACelda(
  celda: CeldaRenta,
  estatus: EstatusCelda,
  nota?: string,
): CeldaRenta {
  if (estatus === 'normal') {
    const { estatus: _, nota: __, ...rest } = celda
    return rest
  }
  if (estatus === 'otra_situacion') {
    return { ...celda, estatus, nota: (nota ?? celda.nota ?? '').trim() }
  }
  const { nota: _, ...rest } = celda
  return { ...rest, estatus }
}

