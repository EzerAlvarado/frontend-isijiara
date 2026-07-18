import type { EstatusCelda } from '../types'

/** Estatus con color solo en el texto (fondo blanco) — trajes */
export const ESTATUS_CELDA_TEXTO: EstatusCelda[] = [
  'arrugado',
  'listo_empacar',
  'sucio',
  'salio',
  'mojado',
]

/** Estatus con color de fondo en la casilla (texto oscuro) — trajes */
export const ESTATUS_CELDA_FONDO: EstatusCelda[] = [
  'listo_para_entregar',
  'en_ajustes',
  'otra_situacion',
]

/** Estatus solo texto — vestidos */
export const ESTATUS_VESTIDOS_TEXTO: EstatusCelda[] = [
  'salio',
  'entregado',
  'venta',
  'premier',
]

/** Estatus casilla completa — vestidos */
export const ESTATUS_VESTIDOS_FONDO: EstatusCelda[] = ['sesion_fotos']

export const ESTATUS_CELDA_ORDEN: EstatusCelda[] = [
  ...ESTATUS_CELDA_TEXTO,
  ...ESTATUS_CELDA_FONDO,
  ...ESTATUS_VESTIDOS_TEXTO,
  ...ESTATUS_VESTIDOS_FONDO,
]

export const estatusCeldaLabels: Record<EstatusCelda, string> = {
  normal: 'Sin marcar',
  arrugado: 'Arrugado',
  listo_empacar: 'Listo para empacar',
  sucio: 'Sucio',
  salio: 'Salió',
  mojado: 'Mojado',
  listo_para_entregar: 'Listo para entregar',
  en_ajustes: 'Ajustes',
  otra_situacion: 'Otra situación',
  entregado: 'Entregado',
  venta: 'Venta',
  premier: 'Premier',
  sesion_fotos: 'Sesión de fotos',
}

/** Clases Tailwind para pintar celdas (texto o fondo según estatus). */
export const estatusCeldaClases: Record<EstatusCelda, string> = {
  normal: 'bg-white text-gray-900',
  arrugado: 'bg-white text-red-600',
  listo_empacar: 'bg-white text-orange-500',
  sucio: 'bg-white text-yellow-600',
  salio: 'bg-white text-green-600',
  mojado: 'bg-white text-cyan-500',
  listo_para_entregar: 'bg-[#2699e6] text-gray-900',
  en_ajustes: 'bg-pink-300 text-gray-900',
  otra_situacion: 'bg-purple-400 text-gray-900',
  entregado: 'bg-white text-red-600',
  venta: 'bg-white text-blue-600',
  premier: 'bg-white text-purple-700 font-semibold',
  sesion_fotos: 'bg-pink-100 text-pink-600',
}

/** Alias para compatibilidad con inventario y componentes existentes. */
export const estatusCeldaBg: Record<EstatusCelda, string> = estatusCeldaClases

export interface OpcionToolbarPintar {
  id: string
  estatus: EstatusCelda
  label: string
  clasesBoton: string
}

function opcionDesdeEstatus(estatus: EstatusCelda): OpcionToolbarPintar {
  return {
    id: estatus,
    estatus,
    label: estatusCeldaLabels[estatus],
    clasesBoton: estatusCeldaClases[estatus],
  }
}

/** Opciones del toolbar trajes — incluye reseteo a normal en cada grupo. */
export const OPCIONES_CELDA_TEXTO: OpcionToolbarPintar[] = [
  {
    id: 'letras_negras',
    estatus: 'normal',
    label: 'Letras negras',
    clasesBoton: 'bg-white text-gray-900 border border-gray-300',
  },
  ...ESTATUS_CELDA_TEXTO.map(opcionDesdeEstatus),
]

export const OPCIONES_CELDA_FONDO: OpcionToolbarPintar[] = [
  {
    id: 'casilla_blanca',
    estatus: 'normal',
    label: 'Casilla blanca',
    clasesBoton: 'bg-white text-gray-700 border border-gray-300',
  },
  ...ESTATUS_CELDA_FONDO.map(opcionDesdeEstatus),
]

/** Estatus pintables manualmente en el toolbar vestidos (venta/premier/sesión son automáticos). */
const ESTATUS_VESTIDOS_TOOLBAR_TEXTO: EstatusCelda[] = ['salio', 'entregado']

/** Toolbar simplificado para vestidos: limpiar, Salió y Entregado. */
export const OPCIONES_VESTIDOS_TEXTO: OpcionToolbarPintar[] = [
  {
    id: 'letras_negras',
    estatus: 'normal',
    label: 'Sin marcar',
    clasesBoton: 'bg-white text-gray-900 border border-gray-300',
  },
  ...ESTATUS_VESTIDOS_TOOLBAR_TEXTO.map(opcionDesdeEstatus),
]

export const OPCIONES_VESTIDOS_FONDO: OpcionToolbarPintar[] = []

export function etiquetaOpcionPintar(opcionId: string): string {
  const opcion = [
    ...OPCIONES_CELDA_TEXTO,
    ...OPCIONES_CELDA_FONDO,
    ...OPCIONES_VESTIDOS_TEXTO,
    ...OPCIONES_VESTIDOS_FONDO,
  ].find((o) => o.id === opcionId)
  return opcion?.label ?? estatusCeldaLabels.normal
}

export function esEstatusCeldaTexto(estatus: EstatusCelda): boolean {
  return (
    ESTATUS_CELDA_TEXTO.includes(estatus) ||
    ESTATUS_VESTIDOS_TEXTO.includes(estatus)
  )
}

export function siguienteEstatus(actual: EstatusCelda): EstatusCelda {
  const idx = ESTATUS_CELDA_ORDEN.indexOf(actual)
  return ESTATUS_CELDA_ORDEN[(idx + 1) % ESTATUS_CELDA_ORDEN.length]
}
