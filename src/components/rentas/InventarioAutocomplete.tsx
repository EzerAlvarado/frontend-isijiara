import { useMemo, useState } from 'react'
import type { Pieza, TipoPieza } from '../../types/pieza'
import {
  buscarPieza,
  buscarPiezaVestido,
  piezaValida,
  piezasVestidoCoincidentes,
  sugerenciasCodigo,
  sugerenciasColorMero,
  sugerenciasColorVestido,
  sugerenciasMarca,
  sugerenciasTalla,
} from '../../utils/inventarioSugerencias'
import { esTipoVestido } from '../../types/pieza'

export type ModoInventarioAutocomplete = 'marca' | 'talla' | 'color' | 'codigo' | 'colorVestido'

interface InventarioAutocompleteProps {
  label: string
  value: string
  modo: ModoInventarioAutocomplete
  tipo: TipoPieza
  color: string
  marca: string
  talla: string
  codigo?: string
  colorVestido?: string
  piezas: Pieza[]
  onChange: (valor: string) => void
  onElegirPieza?: (pieza: Pieza) => void
  /** Vestidos: no exige color antes de sugerir marca/talla */
  sinRequisitoColor?: boolean
  /** Trajes pantalón: formato talla#código en sugerencias */
  usarCodigosNuevosPantalon?: boolean
}

function intentarVincularVestido(
  piezas: Pieza[],
  tipo: TipoPieza,
  filtros: { color: string; marca: string; talla: string; codigo: string },
  onElegirPieza?: (pieza: Pieza) => void,
) {
  if (!onElegirPieza) return
  const pieza = buscarPiezaVestido(
    piezas,
    tipo,
    filtros.color,
    filtros.marca,
    filtros.talla,
    filtros.codigo,
  )
  if (pieza) {
    onElegirPieza(pieza)
    return
  }
  const coincidencias = piezasVestidoCoincidentes(piezas, tipo, filtros)
  if (coincidencias.length === 1) onElegirPieza(coincidencias[0])
}

export function InventarioAutocomplete({
  label,
  value,
  modo,
  tipo,
  color,
  marca,
  talla,
  codigo = '',
  piezas,
  onChange,
  onElegirPieza,
  sinRequisitoColor = false,
  usarCodigosNuevosPantalon = false,
}: InventarioAutocompleteProps) {
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(-1)
  const esVestido = esTipoVestido(tipo)

  const sugerencias = useMemo(() => {
    const filtros = { color, marca, talla, codigo }
    if (modo === 'color') {
      return sugerenciasColorMero(piezas, tipo, { marca, talla, codigo }, value)
    }
    if (modo === 'colorVestido') {
      return sugerenciasColorVestido(piezas, tipo, filtros, value)
    }
    if (modo === 'codigo') {
      return sugerenciasCodigo(piezas, tipo, { color, marca, talla }, value)
    }
    if (modo === 'marca') {
      return sugerenciasMarca(piezas, tipo, color, talla, value)
    }
    return sugerenciasTalla(
      piezas,
      tipo,
      color,
      marca,
      value,
      8,
      tipo === 'pantalon' ? usarCodigosNuevosPantalon : false,
    )
  }, [modo, piezas, tipo, color, marca, talla, codigo, value, usarCodigosNuevosPantalon])

  const vincularPiezaTraje = (marcaValor: string, tallaValor: string) => {
    if (!onElegirPieza || !piezaValida(tallaValor)) return
    const pieza = buscarPieza(piezas, tipo, color, marcaValor, tallaValor)
    if (pieza) onElegirPieza(pieza)
  }

  const elegir = (valor: string) => {
    const colorN = modo === 'color' ? valor : color
    const marcaN = modo === 'marca' ? valor : marca
    const tallaN = modo === 'talla' ? valor : talla
    const codigoN = modo === 'codigo' ? valor : codigo

    onChange(valor)

    if (esVestido) {
      intentarVincularVestido(
        piezas,
        tipo,
        { color: colorN, marca: marcaN, talla: tallaN, codigo: codigoN },
        onElegirPieza,
      )
    } else if (modo === 'talla') {
      vincularPiezaTraje(marca, valor)
    } else if (modo === 'marca' && talla.trim()) {
      vincularPiezaTraje(valor, talla)
    }

    setAbierto(false)
    setActivo(-1)
  }

  const mostrarHintColor =
    !sinRequisitoColor && !color.trim() && modo !== 'color' && modo !== 'colorVestido' && !esVestido

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">{label}</span>
      <div className="relative">
        {abierto && sugerencias.length > 0 && (
          <ul
            className="absolute bottom-full left-0 z-20 mb-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
            role="listbox"
          >
            {sugerencias.map((s, i) => (
              <li key={s} role="option" aria-selected={i === activo}>
                <button
                  type="button"
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium uppercase hover:bg-brand-50 ${
                    i === activo ? 'bg-brand-50 text-brand-800' : 'text-gray-900'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    elegir(s)
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          type="text"
          className="input-field uppercase"
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toLocaleUpperCase('es-MX'))
            setAbierto(true)
            setActivo(-1)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={(e) => {
            if (!abierto || !sugerencias.length) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActivo((i) => (i + 1) % sugerencias.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActivo((i) => (i <= 0 ? sugerencias.length - 1 : i - 1))
            } else if (e.key === 'Enter' && activo >= 0) {
              e.preventDefault()
              elegir(sugerencias[activo])
            } else if (e.key === 'Escape') {
              setAbierto(false)
            }
          }}
          autoComplete="off"
        />
      </div>
      {mostrarHintColor && (
        <span className="mt-0.5 block text-[11px] text-amber-600">
          Escribe el color primero para ver opciones del inventario
        </span>
      )}
    </label>
  )
}
