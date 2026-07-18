import { useEffect, useMemo, useState } from 'react'
import type { Pieza } from '../types/pieza'
import type { Renta } from '../types'
import { fetchPiezas } from '../api/piezas'
import { fetchRentas } from '../api/rentas'
import { piezasParaSeleccionRenta } from '../utils/disponibilidadPieza'

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

/** Piezas para renta + rentas activas (conflictos por semana). */
export function usePiezasDisponibles(open: boolean, opciones: OpcionesPiezasRenta = {}) {
  const { piezaIds, fechaSalida = '', rentaIdExcluir } = opciones
  const [piezas, setPiezas] = useState<Pieza[]>([])
  const [rentas, setRentas] = useState<Renta[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!open) return
    let activo = true
    setCargando(true)

    const idsExtra = [piezaIds?.saco, piezaIds?.chaleco, piezaIds?.pantalon].filter(
      Boolean,
    ) as string[]

    Promise.all([fetchPiezas(), fetchRentas()])
      .then(([todas, rentasData]) => {
        if (!activo) return
        const base = todas.filter((p) => p.estatus !== 'mantenimiento')
        const faltantes = idsExtra.filter((id) => !base.some((p) => p.id === id))
        const extras = faltantes.length
          ? todas.filter((p) => faltantes.includes(p.id))
          : []
        setPiezas([...extras, ...base])
        setRentas(rentasData)
      })
      .catch(() => {
        if (activo) {
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
  }, [open, piezaIds?.saco, piezaIds?.chaleco, piezaIds?.pantalon])

  const piezasSeleccionables = useMemo(() => {
    const base = piezasParaSeleccionRenta(piezas, fechaSalida, rentas, rentaIdExcluir)
    const idsExtra = [piezaIds?.saco, piezaIds?.chaleco, piezaIds?.pantalon].filter(
      Boolean,
    ) as string[]
    const out = [...base]
    for (const id of idsExtra) {
      if (!out.some((p) => p.id === id)) {
        const extra = piezas.find((p) => p.id === id)
        if (extra) out.push(extra)
      }
    }
    return out
  }, [piezas, fechaSalida, rentas, rentaIdExcluir, piezaIds?.saco, piezaIds?.chaleco, piezaIds?.pantalon])

  return { piezas: piezasSeleccionables, piezasTodas: piezas, rentas, cargando }
}

/** @deprecated usar usePiezasDisponibles */
export const useInventarioDisponible = usePiezasDisponibles
