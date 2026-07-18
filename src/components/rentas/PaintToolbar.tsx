import { useEffect, useState } from 'react'
import { Paintbrush, Rows3, Square } from 'lucide-react'
import type { EstatusCelda } from '../../types'
import type { LineaNegocio } from '../../types/auth'
import {
  OPCIONES_CELDA_FONDO,
  OPCIONES_CELDA_TEXTO,
  OPCIONES_VESTIDOS_FONDO,
  OPCIONES_VESTIDOS_TEXTO,
  etiquetaOpcionPintar,
  estatusCeldaLabels,
  type OpcionToolbarPintar,
} from '../../utils/estatusCelda'

export type ModoPintar = 'celda' | 'fila'

interface PaintToolbarProps {
  lineaNegocio?: LineaNegocio
  modo: ModoPintar
  onModoChange: (modo: ModoPintar) => void
  colorActivo: EstatusCelda | null
  onColorChange: (color: EstatusCelda | null) => void
}

function GrupoColores({
  titulo,
  opciones,
  opcionActiva,
  onOpcionChange,
}: {
  titulo: string
  opciones: OpcionToolbarPintar[]
  opcionActiva: string | null
  onOpcionChange: (opcion: OpcionToolbarPintar) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{titulo}</span>
      {opciones.map((opcion) => {
        const activo = opcionActiva === opcion.id
        return (
          <button
            key={opcion.id}
            type="button"
            onClick={() => onOpcionChange(opcion)}
            title={opcion.label}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${opcion.clasesBoton} ${
              activo
                ? 'border-indigo-600 font-semibold ring-2 ring-indigo-400 ring-offset-1 shadow-sm'
                : 'border-transparent hover:opacity-90 hover:shadow-sm'
            }`}
          >
            {opcion.label}
          </button>
        )
      })}
    </div>
  )
}

export function PaintToolbar({
  lineaNegocio = 'trajes',
  modo,
  onModoChange,
  colorActivo,
  onColorChange,
}: PaintToolbarProps) {
  const [opcionActiva, setOpcionActiva] = useState<string | null>(null)
  const esVestidos = lineaNegocio === 'vestidos'

  useEffect(() => {
    if (colorActivo === null) {
      setOpcionActiva(null)
    }
  }, [colorActivo])

  const handleOpcionChange = (opcion: OpcionToolbarPintar) => {
    const mismo = opcionActiva === opcion.id && colorActivo === opcion.estatus
    if (mismo) {
      setOpcionActiva(null)
      onColorChange(null)
      return
    }
    setOpcionActiva(opcion.id)
    onColorChange(opcion.estatus)
  }

  const labelActivo =
    opcionActiva !== null
      ? etiquetaOpcionPintar(opcionActiva)
      : colorActivo !== null
        ? estatusCeldaLabels[colorActivo]
        : null

  const opcionesTexto = esVestidos ? OPCIONES_VESTIDOS_TEXTO : OPCIONES_CELDA_TEXTO
  const opcionesFondo = esVestidos ? OPCIONES_VESTIDOS_FONDO : OPCIONES_CELDA_FONDO
  const tituloTexto = esVestidos ? 'Solo letras' : 'Solo letras'
  const tituloFondo = esVestidos ? 'Sesión de fotos' : 'Casilla completa'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Paintbrush className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-semibold text-gray-800">Pintar estatus</span>
        </div>

        {!esVestidos && (
          <>
            <div className="flex rounded-lg border border-gray-200 p-0.5">
              <button
                type="button"
                onClick={() => onModoChange('celda')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  modo === 'celda'
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Square className="h-3.5 w-3.5" />
                Por celda
              </button>
              <button
                type="button"
                onClick={() => onModoChange('fila')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  modo === 'fila'
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Rows3 className="h-3.5 w-3.5" />
                Fila completa
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200" />
          </>
        )}

        <GrupoColores
          titulo={tituloTexto}
          opciones={opcionesTexto}
          opcionActiva={opcionActiva}
          onOpcionChange={handleOpcionChange}
        />

        {opcionesFondo.length > 0 && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <GrupoColores
              titulo={tituloFondo}
              opciones={opcionesFondo}
              opcionActiva={opcionActiva}
              onOpcionChange={handleOpcionChange}
            />
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {colorActivo === null ? (
          <>Selecciona un color arriba para activar el pintado.</>
        ) : opcionActiva === 'casilla_blanca' || opcionActiva === 'letras_negras' ? (
          <>
            <strong>{labelActivo}</strong> activo — al pintar se limpia el color y la nota
            {esVestidos ? ' de la renta' : ' de la celda'}.
          </>
        ) : colorActivo === 'otra_situacion' ? (
          <>
            Color <strong>{labelActivo}</strong> activo — al pintar {esVestidos ? 'una renta' : 'una celda'}{' '}
            se pedirá una nota que se mostrará al pasar el cursor.
          </>
        ) : !esVestidos && modo === 'celda' ? (
          <>
            Color <strong>{labelActivo}</strong> activo — haz clic en la celda que quieras pintar.
          </>
        ) : (
          <>
            Color <strong>{labelActivo}</strong> activo — usa el botón{' '}
            <Paintbrush className="inline h-3 w-3" /> al inicio de cada fila para pintar toda la renta.
          </>
        )}
      </p>
    </div>
  )
}
