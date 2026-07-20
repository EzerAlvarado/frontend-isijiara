import type { DocumentoRenta } from '../types/documentoRenta'
import type { Renta } from '../types'
import { formatearAccesoriosNota } from './accesoriosNota'
import { formatearHorario } from './horario'
import { aMayusculas } from './mayusculas'
import { etiquetaMetodoPago } from './metodoPago'
import { multaEfectiva } from './multa'
import { rentaEstaPagada, restanteRenta } from './pagoRenta'
import { anticipoEnPesos } from './tipoCambio'
import { parseFechaDDMMYYYY } from './semanasRentas'
import {
  etiquetaTipoOperacionVestido,
  tipoOperacionDesdeRenta,
} from './precioVestido'

export function calcularResta(
  doc: Pick<DocumentoRenta, 'total' | 'anticipo' | 'metodoPago' | 'pagado' | 'pagaré'>,
): number {
  if (doc.pagado) return 0
  if (doc.pagaré?.buenoPor != null) return doc.pagaré.buenoPor
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

export function fechaLarga(fecha: string): string {
  const d = parseFechaDDMMYYYY(fecha)
  if (!d) return fecha
  return `${d.getDate()} de ${d.getMonth() + 1} de ${d.getFullYear()}`
}

function celdaValor(c: { valor: string }): string {
  const v = c.valor?.trim()
  if (!v || v === '—' || v.toUpperCase() === 'X' || v.toUpperCase() === 'NO') return ''
  return aMayusculas(v)
}

function fechaISO(fecha: string): string {
  const d = parseFechaDDMMYYYY(fecha)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function lineasPrenda(renta: Renta): { descripcion: string }[] {
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

function descripcionArticulo(renta: Renta): string {
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

export function rentaADocumento(renta: Renta): DocumentoRenta {
  const multa = multaEfectiva(renta)
  const total = renta.fondo + multa
  const anticipo = renta.anticipo
  const metodo = renta.metodoPago ?? 'pesos'
  const pagoMxn = renta.pagoEfectivoMxn ?? 0
  const pagoUsd = renta.pagoEfectivoUsd ?? 0
  const feria = renta.feriaMxn ?? 0
  const resta = restanteRenta(renta)
  const pagado = rentaEstaPagada(renta)
  const hora = formatearHorario(renta.horario.valor)
  const fechaRenta = hora ? `${renta.fechaSalida} ${hora}` : renta.fechaSalida
  const detalleExtra = celdaValor(renta.detalles)
  const esVestidos = Boolean(renta.categoriaVestido)
  const tipoOperacion = tipoOperacionDesdeRenta(renta, esVestidos)
  const etiquetaOperacion = etiquetaTipoOperacionVestido(tipoOperacion)

  const lineasDetalle = lineasPrenda(renta)
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
      evento: renta.fechaSalida,
      entrega: renta.fechaSalida,
      regreso: renta.fechaRegreso,
    },
    pagos: (() => {
      const filas: { fecha: string; monto: number; formaPago: string }[] = []
      const f = fechaISO(renta.fechaSalida)
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
        const fechaAbono = abono.creadoEn.slice(0, 10).split('-').reverse().join('/')
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
        descripcion: descripcionArticulo(renta),
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
      estado: 'SONORA',
      fechaEmision: fechaLarga(renta.fechaSalida),
      ordenDe: 'ISIJARA BOUTIQUE',
      lugarPago: 'San Luis Río Colorado, Son.',
      fechaPago: fechaLarga(renta.fechaRegreso),
      cantidadLetra: numeroALetras(resta),
      buenoPor: resta,
    },
    pagado,
  }
}
