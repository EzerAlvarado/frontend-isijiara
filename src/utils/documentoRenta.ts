import type { DocumentoRenta } from '../types/documentoRenta'
import type { Renta } from '../types'
import { formatearAccesoriosNota } from './accesoriosNota'
import { formatearHorario } from './horario'
import { aMayusculas } from './mayusculas'
import { etiquetaMetodoPago } from './metodoPago'
import { multaEfectiva } from './multa'
import { rentaEstaPagada } from './pagoRenta'
import { anticipoEnPesos } from './tipoCambio'
import { parseFechaDDMMYYYY } from './semanasRentas'
import {
  etiquetaTipoOperacionVestido,
  tipoOperacionDesdeRenta,
} from './precioVestido'

export function calcularResta(
  doc: Pick<DocumentoRenta, 'total' | 'anticipo' | 'metodoPago' | 'pagado'>,
): number {
  if (doc.pagado) return 0
  return Math.max(0, doc.total - anticipoEnPesos(doc.anticipo, doc.metodoPago ?? 'pesos'))
}

const UNIDADES = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
]

const DECENAS = [
  '',
  '',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
]

const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
]

function leerCentenas(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'CIEN'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const base = CENTENAS[c]
  return resto ? `${base} ${leerDecenas(resto)}`.trim() : base
}

function leerDecenas(n: number): string {
  if (n === 0) return ''
  if (n < 20) return UNIDADES[n]
  if (n < 30) return n === 20 ? 'VEINTE' : `VEINTI${UNIDADES[n - 20]}`
  const d = Math.floor(n / 10)
  const u = n % 10
  return u ? `${DECENAS[d]} Y ${UNIDADES[u]}` : DECENAS[d]
}

function leerEntero(n: number): string {
  if (n === 0) return 'CERO'
  if (n < 1000) return leerCentenas(n).trim()
  const miles = Math.floor(n / 1000)
  const resto = n % 1000
  const prefijo = miles === 1 ? 'MIL' : `${leerEntero(miles)} MIL`
  return resto ? `${prefijo} ${leerCentenas(resto)}`.trim() : prefijo
}

export function numeroALetras(monto: number): string {
  const entero = Math.floor(monto)
  const centavos = Math.round((monto - entero) * 100)
  const texto = entero === 0 ? 'CERO' : leerEntero(entero)
  return `${texto} PESOS ${String(centavos).padStart(2, '0')}/100 M.N.`
}

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const DIAS_SEMANA = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
]

function parseFechaFlexible(fecha: string): Date | null {
  const mx = parseFechaDDMMYYYY(fecha.trim())
  if (mx) return mx
  // YYYY-MM-DD o ISO datetime
  const iso = fecha.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12, 0, 0)
  return null
}

/** Ej: "08 de agosto del 2026" */
export function fechaLarga(fecha: string): string {
  if (!fecha?.trim()) return ''
  const d = parseFechaFlexible(fecha)
  if (!d) return fecha
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = MESES_LARGO[d.getMonth()]
  return `${dia} de ${mes} del ${d.getFullYear()}`
}

/** Ej: "lunes 08 de agosto" */
export function fechaConDiaSemana(fecha: string): string {
  if (!fecha?.trim()) return ''
  const d = parseFechaFlexible(fecha)
  if (!d) return fecha
  const diaSemana = DIAS_SEMANA[d.getDay()]
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = MESES_LARGO[d.getMonth()]
  return `${diaSemana} ${dia} de ${mes}`
}

function celdaValor(c: { valor: string }): string {
  const v = c.valor?.trim()
  if (!v || v === '—' || v.toUpperCase() === 'X' || v.toUpperCase() === 'NO') return ''
  return aMayusculas(v)
}

function lineasPrendaTraje(renta: Renta): { descripcion: string }[] {
  const piezas: [string, string][] = [
    ['Color', celdaValor(renta.color)],
    ['Saco', celdaValor(renta.saco)],
    ['Chaleco', celdaValor(renta.chaleco)],
    ['Pantalón', celdaValor(renta.pantalon)],
    ['Camisa', celdaValor(renta.camisa)],
    ['Corbata/Moño', celdaValor(renta.corbataMono)],
  ]
  return piezas.filter(([, v]) => v).map(([label, v]) => ({ descripcion: `${label}: ${v}` }))
}

function lineasPrendaVestido(renta: Renta): { descripcion: string }[] {
  const piezas: [string, string][] = [
    ['Color', celdaValor(renta.color)],
    ['Vestido', celdaValor(renta.chaleco)],
    ['Código', celdaValor(renta.saco)],
    ['Talla', celdaValor(renta.pantalon)],
    ['Marca', renta.marca ?? ''],
  ]
  return piezas.filter(([, v]) => v).map(([label, v]) => ({ descripcion: `${label}: ${v}` }))
}

function lineasPrenda(renta: Renta, esVestidos: boolean): { descripcion: string }[] {
  return esVestidos ? lineasPrendaVestido(renta) : lineasPrendaTraje(renta)
}

function descripcionArticuloTraje(renta: Renta): string {
  const partes = [
    celdaValor(renta.color),
    celdaValor(renta.saco) && `Saco ${celdaValor(renta.saco)}`,
    celdaValor(renta.chaleco) && `Chaleco ${celdaValor(renta.chaleco)}`,
    celdaValor(renta.pantalon) && `Pantalón ${celdaValor(renta.pantalon)}`,
    celdaValor(renta.camisa) && `Camisa ${celdaValor(renta.camisa)}`,
    celdaValor(renta.corbataMono),
  ].filter(Boolean)
  return partes.join(' — ') || 'Renta de traje'
}

function descripcionArticuloVestido(renta: Renta): string {
  const partes = [
    celdaValor(renta.color),
    celdaValor(renta.chaleco),
    celdaValor(renta.saco) && `Código ${celdaValor(renta.saco)}`,
    celdaValor(renta.pantalon) && `Talla ${celdaValor(renta.pantalon)}`,
    renta.marca,
  ].filter(Boolean)
  return partes.join(' — ') || 'Renta de vestido'
}

function descripcionArticulo(renta: Renta, esVestidos: boolean): string {
  return esVestidos ? descripcionArticuloVestido(renta) : descripcionArticuloTraje(renta)
}

export function rentaADocumento(renta: Renta): DocumentoRenta {
  const multa = multaEfectiva(renta)
  const total = renta.fondo + multa
  const anticipo = renta.anticipo
  const metodo = renta.metodoPago ?? 'pesos'
  const pagoMxn = renta.pagoEfectivoMxn ?? 0
  const pagoUsd = renta.pagoEfectivoUsd ?? 0
  const feria = renta.feriaMxn ?? 0
  const pagado = rentaEstaPagada(renta)
  const hora = formatearHorario(renta.horario.valor)
  const fechaEntregaLarga = fechaLarga(renta.fechaSalida)
  const fechaRenta = hora ? `${fechaEntregaLarga} ${hora}` : fechaEntregaLarga
  const detalleExtra = celdaValor(renta.detalles)
  const esVestidos = Boolean(renta.categoriaVestido)
  const tipoOperacion = tipoOperacionDesdeRenta(renta, esVestidos)
  const etiquetaOperacion = etiquetaTipoOperacionVestido(tipoOperacion)

  const lineasDetalle = lineasPrenda(renta, esVestidos)
  if (detalleExtra) lineasDetalle.push({ descripcion: detalleExtra })

  return {
    folio: renta.id,
    fechaRenta,
    cliente: {
      nombre: aMayusculas(renta.cliente.valor),
      telefono: aMayusculas(renta.telefono ?? ''),
      direccion: aMayusculas(renta.direccion ?? ''),
    },
    fechas: {
      entrega: fechaEntregaLarga,
      evento: fechaLarga(renta.fechaEvento || renta.fechaSalida),
      regreso: fechaLarga(renta.fechaRegreso),
      // Vacío si no hay cita guardada (no rellenar con entrega)
      cita: (() => {
        const cita = (renta.fechaCita?.valor || '').trim()
        return cita ? fechaLarga(cita) : ''
      })(),
    },
    pagos: (() => {
      const filas: { fecha: string; monto: number; formaPago: string }[] = []
      const f = fechaLarga(renta.fechaSalida)
      if (metodo === 'mixto' && (pagoMxn > 0 || pagoUsd > 0)) {
        if (pagoMxn > 0) filas.push({ fecha: f, monto: pagoMxn, formaPago: 'Pesos' })
        if (pagoUsd > 0) filas.push({ fecha: f, monto: pagoUsd, formaPago: 'DLLS' })
      } else if (anticipo > 0) {
        filas.push({
          fecha: f,
          monto: anticipo,
          formaPago: etiquetaMetodoPago(renta.metodoPago ?? 'pesos'),
        })
      }
      for (const abono of renta.abonos ?? []) {
        const fechaAbono = fechaLarga(abono.creadoEn)
        if (abono.metodoPago === 'mixto' && (abono.pagoEfectivoMxn || abono.pagoEfectivoUsd)) {
          if (abono.pagoEfectivoMxn) {
            filas.push({ fecha: fechaAbono, monto: abono.pagoEfectivoMxn, formaPago: 'Pesos' })
          }
          if (abono.pagoEfectivoUsd) {
            filas.push({ fecha: fechaAbono, monto: abono.pagoEfectivoUsd, formaPago: 'DLLS' })
          }
        } else {
          filas.push({
            fecha: fechaAbono,
            monto: abono.monto,
            formaPago: etiquetaMetodoPago(abono.metodoPago),
          })
        }
      }
      return filas
    })(),
    articulos: [
      {
        cantidad: 1,
        tipo: etiquetaOperacion,
        descripcion: descripcionArticulo(renta, esVestidos),
        importe: total,
      },
    ],
    lineasDetalle,
    recogera:
      tipoOperacion === 'patrocinio'
        ? 'Patrocinio'
        : renta.tipoEntrega === 'premier'
          ? 'Premier'
          : 'Recoger en boutique',
    accesorio: formatearAccesoriosNota(renta.cinto.valor, renta.accesorio.valor),
    ajustes: aMayusculas(renta.ajustes ?? ''),
    depositoReembolsable: aMayusculas(renta.depositoReembolsable ?? ''),
    atendidaPor: celdaValor(renta.empleado),
    garantia: 0,
    total,
    anticipo,
    metodoPago: metodo,
    pagoEfectivoMxn: pagoMxn,
    pagoEfectivoUsd: pagoUsd,
    feriaMxn: feria,
    pagaré: {
      estado: 'San Luis Río Colorado',
      fechaEmision: fechaLarga(renta.fechaSalida),
      ordenDe: 'ISIJARA BOUTIQUE',
      lugarPago: 'SLRC',
      fechaPago: fechaConDiaSemana(renta.fechaRegreso),
      cantidadLetra: numeroALetras(Number(renta.pagare) || 0),
      buenoPor: Number(renta.pagare) || 0,
    },
    pagado,
    esVenta: tipoOperacion === 'venta',
  }
}
