import type { Pieza, TipoPiezaVestido } from '../types/pieza'
import type { LineaNegocio } from '../types/auth'
import type { MetodoPago, Renta, TipoEntrega } from '../types'
import { buscarPiezaVestido, resolverPiezasDesdeFormulario } from './inventarioSugerencias'
import { formatearPantalonTraje } from './pantalonCodigo'
import {
  tipoOperacionDesdeRenta,
  estatusFilaDesdeTipoOperacion,
  valorCamisaVestido,
  type TipoOperacionVestido,
} from './precioVestido'
import { horarioDesdeInput, horarioParaInput } from './horario'
import { aMayusculas } from './mayusculas'
import { calcularMultaAutomatica } from './multa'
import {
  calcularPagoEfectivo,
  esPagoEfectivo,
  inferirMetodoEfectivo,
  pesosADolares,
} from './tipoCambio'
import {
  DIAS_RENTA_DEFAULT,
  formatFechaMX,
  semanaKeyDesdeFechaSalida,
  sumarDiasFecha,
  toISO,
  inicioDeSemana,
} from './semanasRentas'

export function celda(valor: string) {
  return { valor: aMayusculas(valor) }
}

export interface RentaFormValues {
  /** Color del saco (también celda color en tabla) */
  color: string
  marca: string
  colorChaleco: string
  marcaChaleco: string
  colorPantalon: string
  marcaPantalon: string
  saco: string
  chaleco: string
  pantalon: string
  camisa: string
  corbataMono: string
  cinto: string
  accesorio: string
  tipoEntrega: TipoEntrega
  empleado: string
  cliente: string
  telefono: string
  direccion: string
  horario: string
  detalles: string
  ajustes: string
  fechaSalida: string
  semanaInicio: string
  precio: string
  anticipo: string
  pagoPesos: string
  pagoDlls: string
  metodoPago: MetodoPago
  piezaSacoId: string
  piezaChalecoId: string
  piezaPantalonId: string
  /** Categoría de vestido para filtrar inventario (noche / quince / boda) */
  categoriaVestido: TipoPiezaVestido
  /** Renta, venta o premier */
  tipoOperacion: TipoOperacionVestido
}

export function hoyMX(): string {
  return formatFechaMX(new Date())
}

export function hoyISO(): string {
  return toISO(inicioDeSemana(new Date()))
}

export function crearFormularioVacio(): RentaFormValues {
  const fechaSalida = hoyMX()
  return {
    color: '',
    marca: '',
    colorChaleco: '',
    marcaChaleco: '',
    colorPantalon: '',
    marcaPantalon: '',
    saco: '',
    chaleco: '',
    pantalon: '',
    camisa: '',
    corbataMono: '',
    cinto: '',
    accesorio: '',
    tipoEntrega: 'recoger',
    empleado: '',
    cliente: '',
    telefono: '',
    direccion: '',
    horario: '',
    detalles: '',
    ajustes: '',
    fechaSalida,
    semanaInicio: semanaKeyDesdeFechaSalida(fechaSalida) || hoyISO(),
    precio: '',
    anticipo: '',
    pagoPesos: '',
    pagoDlls: '',
    metodoPago: 'pesos',
    piezaSacoId: '',
    piezaChalecoId: '',
    piezaPantalonId: '',
    categoriaVestido: 'noche',
    tipoOperacion: 'renta',
  }
}

export function rentaAFormulario(renta: Renta, esVestidos = false): RentaFormValues {
  const tipoOperacion = tipoOperacionDesdeRenta(renta, esVestidos)
  const metodo = renta.metodoPago ?? 'pesos'
  const pagoMxn = renta.pagoEfectivoMxn ?? 0
  const pagoUsd = renta.pagoEfectivoUsd ?? 0
  let pagoPesos = ''
  let pagoDlls = ''
  let anticipo = renta.anticipo ? String(renta.anticipo) : ''

  if (pagoMxn > 0 || pagoUsd > 0) {
    pagoPesos = pagoMxn > 0 ? String(pagoMxn) : ''
    pagoDlls = pagoUsd > 0 ? String(pagoUsd) : ''
  } else if (esPagoEfectivo(metodo)) {
    if (metodo === 'dlls') {
      pagoDlls = anticipo
    } else {
      pagoPesos = anticipo
    }
    anticipo = ''
  }

  return {
    color: renta.color.valor,
    marca: renta.marca ?? '',
    colorChaleco: renta.colorChaleco ?? '',
    marcaChaleco: renta.marcaChaleco ?? '',
    colorPantalon: renta.colorPantalon ?? '',
    marcaPantalon: renta.marcaPantalon ?? '',
    saco: renta.saco.valor,
    chaleco: renta.chaleco.valor,
    pantalon: renta.pantalon.valor,
    camisa: renta.camisa.valor,
    corbataMono: renta.corbataMono.valor,
    cinto: renta.cinto.valor,
    accesorio: renta.accesorio.valor,
    tipoEntrega: renta.tipoEntrega,
    empleado: renta.empleado.valor,
    cliente: renta.cliente.valor,
    telefono: renta.telefono ?? '',
    direccion: renta.direccion ?? '',
    horario: horarioParaInput(renta.horario.valor),
    detalles: renta.detalles.valor,
    ajustes: renta.ajustes ?? '',
    fechaSalida: renta.fechaSalida || renta.fechaCita.valor,
    semanaInicio: renta.semanaInicio,
    precio: renta.fondo ? String(renta.fondo) : '',
    anticipo,
    pagoPesos,
    pagoDlls,
    metodoPago: metodo,
    piezaSacoId: renta.piezaSacoId ?? '',
    piezaChalecoId: renta.piezaChalecoId ?? '',
    piezaPantalonId: renta.piezaPantalonId ?? '',
    categoriaVestido: (renta.categoriaVestido as TipoPiezaVestido) || 'noche',
    tipoOperacion,
  }
}

export function formularioAPayload(
  values: RentaFormValues,
  fechaRegreso: string,
  piezasInventario: Pieza[] = [],
  lineaNegocio: LineaNegocio = 'trajes',
  usarCodigosNuevosPantalon = false,
): Omit<Renta, 'id'> {
  const semana =
    semanaKeyDesdeFechaSalida(values.fechaSalida) || values.semanaInicio || hoyISO()

  let piezaSacoId = values.piezaSacoId.trim() || null
  let piezaChalecoId = values.piezaChalecoId.trim() || null
  let piezaPantalonId = values.piezaPantalonId.trim() || null

  if (lineaNegocio === 'vestidos') {
    piezaChalecoId = null
    piezaPantalonId = null
    if (!piezaSacoId) {
      const vestido = buscarPiezaVestido(
        piezasInventario,
        values.categoriaVestido,
        values.color,
        values.marca,
        values.pantalon,
        values.saco,
      )
      if (vestido) piezaSacoId = vestido.id
    }
  } else {
    const resueltas = resolverPiezasDesdeFormulario(
      piezasInventario,
      { color: values.color, marca: values.marca, talla: values.saco },
      { color: values.colorChaleco, marca: values.marcaChaleco, talla: values.chaleco },
      { color: values.colorPantalon, marca: values.marcaPantalon, talla: values.pantalon },
    )

    if (!piezaSacoId && resueltas.saco) piezaSacoId = resueltas.saco.id
    if (!piezaChalecoId && resueltas.chaleco) piezaChalecoId = resueltas.chaleco.id
    if (!piezaPantalonId && resueltas.pantalon) piezaPantalonId = resueltas.pantalon.id
  }

  const esVestidos = lineaNegocio === 'vestidos'
  const pantalonValor = esVestidos
    ? values.pantalon
    : formatearPantalonTraje(
        values.pantalon,
        piezaPantalonId
          ? piezasInventario.find((p) => p.id === piezaPantalonId) ||
            resolverPiezasDesdeFormulario(
              piezasInventario,
              { color: values.color, marca: values.marca, talla: values.saco },
              { color: values.colorChaleco, marca: values.marcaChaleco, talla: values.chaleco },
              { color: values.colorPantalon, marca: values.marcaPantalon, talla: values.pantalon },
            ).pantalon
          : undefined,
        usarCodigosNuevosPantalon,
      )
  const tipoOperacion = values.tipoOperacion
  const multa = calcularMultaAutomatica(values.fechaSalida)
  const precio = tipoOperacion === 'patrocinio' ? 0 : Number(values.precio) || 0
  const totalCobrar = precio + multa
  const estatusAuto = estatusFilaDesdeTipoOperacion(tipoOperacion)

  let metodoPago = values.metodoPago
  let anticipo = Number(values.anticipo) || 0
  let pagoEfectivoMxn = 0
  let pagoEfectivoUsd = 0
  let feriaMxn = 0

  if (esPagoEfectivo(metodoPago)) {
    const recibidoMxn = Number(values.pagoPesos) || 0
    const recibidoUsd = Number(values.pagoDlls) || 0
    const pago = calcularPagoEfectivo(totalCobrar, recibidoMxn, recibidoUsd)
    metodoPago =
      metodoPago === 'mixto' ? 'mixto' : inferirMetodoEfectivo(recibidoMxn, recibidoUsd)
    pagoEfectivoMxn = pago.recibidoMxn
    pagoEfectivoUsd = pago.recibidoUsd
    feriaMxn = pago.feriaMxn
    if (metodoPago === 'dlls' && recibidoMxn <= 0 && recibidoUsd > 0) {
      anticipo = Math.min(recibidoUsd, pesosADolares(totalCobrar))
    } else {
      anticipo = pago.aplicadoMxn
    }
  }

  return {
    color: celda(values.color),
    saco: celda(values.saco),
    chaleco: celda(values.chaleco),
    pantalon: celda(pantalonValor),
    camisa: celda(esVestidos ? valorCamisaVestido(tipoOperacion) : values.camisa),
    corbataMono: celda(esVestidos ? '' : values.corbataMono),
    cinto: celda(esVestidos ? '' : values.cinto),
    accesorio: celda(values.accesorio),
    tipoEntrega: tipoOperacion === 'premier' ? 'premier' : 'recoger',
    empleado: celda(values.empleado),
    cliente: celda(values.cliente),
    telefono: aMayusculas(values.telefono.trim()),
    direccion: aMayusculas(values.direccion.trim()),
    fechaCita: celda(values.fechaSalida),
    horario: celda(horarioDesdeInput(values.horario)),
    detalles: celda(values.detalles),
    ajustes: aMayusculas(values.ajustes.trim()),
    marca: aMayusculas(values.marca.trim()),
    colorChaleco: aMayusculas(values.colorChaleco.trim()),
    colorPantalon: aMayusculas(values.colorPantalon.trim()),
    marcaChaleco: aMayusculas(values.marcaChaleco.trim()),
    marcaPantalon: aMayusculas(values.marcaPantalon.trim()),
    semanaInicio: semana,
    fechaSalida: values.fechaSalida,
    fechaRegreso,
    fondo: precio,
    anticipo,
    multa,
    metodoPago,
    pagoEfectivoMxn,
    pagoEfectivoUsd,
    feriaMxn,
    piezaSacoId,
    piezaChalecoId,
    piezaPantalonId,
    categoriaVestido: esVestidos ? values.categoriaVestido : '',
    tipoOperacion,
    estatusFila: estatusAuto ?? ('' as Renta['estatusFila']),
  }
}

export function calcularFechaRegreso(fechaSalida: string): string {
  return sumarDiasFecha(fechaSalida, DIAS_RENTA_DEFAULT)
}

export { DIAS_RENTA_DEFAULT }
