export type EstatusDevolucion = 'revisar_salida' | 'afuera' | 'retrasado' | 'regresado'

export type EstatusRenta =
  | 'salio'
  | 'listo_para_entregar'
  | 'mojado'
  | 'en_ajustes'
  | 'sucio'
  | 'retrasado'

/** Estatus pintable en cada celda de la tabla de rentas */
export type EstatusCelda =
  | 'normal'
  | 'arrugado'
  | 'listo_empacar'
  | 'sucio'
  | 'salio'
  | 'mojado'
  | 'listo_para_entregar'
  | 'en_ajustes'
  | 'otra_situacion'
  | 'entregado'
  | 'venta'
  | 'premier'
  | 'sesion_fotos'

export interface CeldaRenta {
  valor: string
  estatus?: EstatusCelda
  /** Nota opcional para estatus otra_situacion */
  nota?: string
}

export type EstatusInventario =
  | 'rentado'
  | 'disponible'
  | 'mantenimiento'
  | 'salio'
  | 'sucio'
  | 'mojado'
  | 'en_ajustes'
  | 'listo_para_entregar'

export type MetodoPago = 'pesos' | 'dlls' | 'mixto' | 'bbva' | 'zelle'

export type TipoEntrega = 'recoger' | 'premier'

/** Piezas de la renta con talla/inventario independiente por columna */
export interface Renta {
  id: string
  color: CeldaRenta
  saco: CeldaRenta
  chaleco: CeldaRenta
  pantalon: CeldaRenta
  camisa: CeldaRenta
  corbataMono: CeldaRenta
  cinto: CeldaRenta
  accesorio: CeldaRenta
  tipoEntrega: TipoEntrega
  empleado: CeldaRenta
  cliente: CeldaRenta
  telefono: string
  direccion: string
  fechaCita: CeldaRenta
  horario: CeldaRenta
  detalles: CeldaRenta
  /** Notas de ajustes a realizar en la prenda */
  ajustes: string
  marca: string
  /** Fondo de fila completa al pintar en modo fila */
  estatusFila?: EstatusCelda
  /** Inicio de semana (lunes) en formato YYYY-MM-DD */
  semanaInicio: string
  fechaSalida: string
  fechaRegreso: string
  /** Fecha en que el cliente recogió el traje (al marcar salió) */
  fechaSalioReal?: string | null
  /** Precio total de la renta en MXN */
  fondo: number
  /** Anticipo pagado en MXN */
  anticipo: number
  multa: number
  /** Forma de pago del anticipo / cobro de la renta */
  metodoPago?: MetodoPago
  /** Efectivo recibido en pesos (contado / mixto) */
  pagoEfectivoMxn?: number
  /** Efectivo recibido en dólares */
  pagoEfectivoUsd?: number
  /** Cambio entregado en pesos */
  feriaMxn?: number
  /** Marca del chaleco si difiere del saco */
  marcaChaleco?: string
  /** Marca del pantalón si difiere del saco */
  marcaPantalon?: string
  /** Color del chaleco si difiere del saco (celda color = saco) */
  colorChaleco?: string
  /** Color del pantalón si difiere del saco */
  colorPantalon?: string
  /** Detalles/nombre descriptivo del saco */
  detallesSaco?: string
  /** Detalles/nombre descriptivo del chaleco */
  detallesChaleco?: string
  /** Detalles/nombre descriptivo del pantalón */
  detallesPantalon?: string
  /** Piezas de inventario vinculadas (saco, chaleco, pantalón por separado) */
  piezaSacoId?: string | null
  piezaChalecoId?: string | null
  piezaPantalonId?: string | null
  /** Categoría de vestido: noche, quince o boda (solo línea vestidos) */
  categoriaVestido?: string
  /** Renta cancelada: conserva registro pero libera piezas del inventario */
  cancelada?: boolean
  /** Renta, venta o premier */
  tipoOperacion?: string
  /** Total a cobrar (fondo + multa) en MXN */
  totalCobrar?: number
  /** Total pagado (anticipo + abonos) en MXN */
  totalPagado?: number
  /** Suma de abonos parciales en MXN */
  totalAbonado?: number
  /** Saldo pendiente en MXN */
  restante?: number
  /** true cuando totalPagado >= totalCobrar */
  pagado?: boolean
  /** Depósito reembolsable (texto descriptivo) */
  depositoReembolsable?: string
  abonos?: Abono[]
}

export interface Abono {
  id: string
  monto: number
  metodoPago: MetodoPago
  pagoEfectivoMxn?: number
  pagoEfectivoUsd?: number
  montoMxn: number
  creadoEn: string
}

export type { Pieza, TipoPieza } from './pieza'

export type CampoPrendaCelda = keyof Pick<
  Renta,
  'color' | 'saco' | 'chaleco' | 'pantalon' | 'camisa' | 'corbataMono' | 'cinto' | 'accesorio'
>

export type CampoRentaCelda = keyof Pick<
  Renta,
  | 'color'
  | 'saco'
  | 'chaleco'
  | 'pantalon'
  | 'camisa'
  | 'corbataMono'
  | 'cinto'
  | 'accesorio'
  | 'empleado'
  | 'cliente'
  | 'fechaCita'
  | 'horario'
  | 'detalles'
>

export interface Prenda {
  id: string
  /** Talla general — S, M, L */
  talla: string
  color: string
  detalles: string
  marca: string
  saco: string
  chaleco: string
  pantalon: string
  codigoOld: string
  codigoNew: string
  estatus: EstatusInventario
  ubicacion?: string
}

export interface Devolucion {
  id: string
  rentaId: string
  cliente: string
  prendaId: string | null
  prendaNombre: string
  cantidad: number
  estatus: EstatusDevolucion
  fechaLimite: string
  penalizacion: number
  /** Fecha real de recogida (desde la renta), si ya se marcó salió */
  fechaSalioReal?: string | null
  multaPerdonada?: boolean
  cargoDanos?: number
  notaDanos?: string
}

export interface Transaccion {
  id: string
  timestamp: string
  referencia: string
  /** Etiqueta legible: Renta, Multa, Abono (Venta), Daños, Vale */
  concepto?: string
  cliente: string
  pago: MetodoPago
  monto: number
}

export interface MultaTardia {
  cliente: string
  rentaId: string
  monto: number
}

export type TurnoCorte = 'manana' | 'tarde'

export interface TurnoDiaEstado {
  turno: TurnoCorte
  label: string
  existe: boolean
  cerrado: boolean
  omitido: boolean
  cerradoEn: string | null
  empleadoCorte: string | null
}

export interface ResumenFinanciero {
  ingresosTotales: number
  cajaDelDia: number
  totalEnCaja: number
  efectivoEnCaja: number
  gastosDelFondo: number
  gastosDiarios: number
  valesPendientesTotal: number
  valesEsperadosFondo?: number
  ingresosTarjeta: number
  fondoInicial: number
  fondoFisico: number
}

export interface ValeCorte {
  id: string
  fecha: string
  concepto: string
  monto: number
  pago: MetodoPago
  montoMxn: number
  estatus: 'pendiente' | 'repuesto'
  referencia: string | null
  repuestoEn: string | null
}
