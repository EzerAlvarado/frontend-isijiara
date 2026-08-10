import { useEffect, useMemo, useState } from 'react'
import type { Pieza } from '../types/pieza'
import type { Renta } from '../types'
import { piezasParaSeleccionRenta } from '../utils/disponibilidadPieza'
import {
  invalidarInventarioRentaCache,
  leerInventarioRentaCache,
  prefetchInventarioRenta,
} from '../utils/inventarioRentaCache'

export { invalidarInventarioRentaCache, prefetchInventarioRenta }

interface PiezaIdsEdicion {
  saco?: string | null
  chaleco?: string | null
  pantalon?: string | null
}

interface OpcionesPiezasRenta {
  piezaIds?: PiezaIdsEdicion
  /** Fecha de salida de la renta (dd/mm/aaaa) para filtrar conflictos por semana. */
  fechaSalida?: string
  /** Al editar, excluir la renta actual del chequeo. */
  rentaIdExcluir?: string | null
}

function normalizarPiezas(
  todas: Pieza[],
  idsExtra: string[],
): Pieza[] {
  const base = todas.filter((p) => p.estatus !== 'mantenimiento')
  const faltantes = idsExtra.filter((id) => !base.some((p) => p.id === id))
  const extras = faltantes.length ? todas.filter((p) => faltantes.includes(p.id)) : []
  return [...extras, ...base]
}

/** Piezas para renta + rentas activas (conflictos por semana). */
export function usePiezasDisponibles(open: boolean, opciones: OpcionesPiezasRenta = {}) {
  const { piezaIds, fechaSalida = '', rentaIdExcluir } = opciones
  const idsExtra = useMemo(
    () =>
      [piezaIds?.saco, piezaIds?.chaleco, piezaIds?.pantalon].filter(Boolean) as string[],
    [piezaIds?.saco, piezaIds?.chaleco, piezaIds?.pantalon],
  )

  const cacheInicial = leerInventarioRentaCache()
  const [piezas, setPiezas] = useState<Pieza[]>(() =>
    cacheInicial ? normalizarPiezas(cacheInicial.piezas, idsExtra) : [],
  )
  const [rentas, setRentas] = useState<Renta[]>(() => cacheInicial?.rentas ?? [])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!open) return
    let activo = true

    const aplicar = (todas: Pieza[], rentasData: Renta[]) => {
      if (!activo) return
      setPiezas(normalizarPiezas(todas, idsExtra))
      setRentas(rentasData)
    }

    const cache = leerInventarioRentaCache()
    if (cache) {
      aplicar(cache.piezas, cache.rentas)
    } else {
      setCargando(true)
    }

    prefetchInventarioRenta()
      .then(({ piezas: todas, rentas: rentasData }) => aplicar(todas, rentasData))
      .catch(() => {
        if (!activo) return
        if (!leerInventarioRentaCache()) {
          setPiezas([])
          setRentas([])
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [open, idsExtra.join('|'), fechaSalida])

  const piezasSeleccionables = useMemo(() => {
    const base = piezasParaSeleccionRenta(piezas, fechaSalida, rentas, rentaIdExcluir)
    const out = [...base]
    for (const id of idsExtra) {
      if (!out.some((p) => p.id === id)) {
        const extra = piezas.find((p) => p.id === id)
        if (extra) out.push(extra)
      }
    }
    return out
  }, [piezas, fechaSalida, rentas, rentaIdExcluir, idsExtra])

  return { piezas: piezasSeleccionables, piezasTodas: piezas, rentas, cargando }
}

/** @deprecated usar usePiezasDisponibles */
export const useInventarioDisponible = usePiezasDisponibles
