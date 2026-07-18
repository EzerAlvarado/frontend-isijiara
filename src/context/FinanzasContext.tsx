import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  actualizarFinanzas,
  fetchFinanzas,
  type FinanzasConfig,
  type PrecioReferencia,
} from '../api/finanzas'
import { useAuth } from './AuthContext'
import { setMultaPorDia } from '../utils/multa'
import { setTipoCambioMxUsd } from '../utils/tipoCambio'

interface FinanzasContextValue {
  config: FinanzasConfig | null
  cargando: boolean
  error: string | null
  recargar: () => Promise<void>
  guardar: (
    payload: Partial<
      Pick<
        FinanzasConfig,
        'tipoCambioUsd' | 'multaPorDia' | 'fondoFeria' | 'preciosReferencia' | 'usarCodigosNuevosPantalon'
      >
    >,
  ) => Promise<void>
  tipoCambioUsd: number
  multaPorDia: number
  fondoFeria: number
  preciosReferencia: PrecioReferencia[]
  usarCodigosNuevosPantalon: boolean
}

const FinanzasContext = createContext<FinanzasContextValue | null>(null)

export function FinanzasProvider({ children }: { children: React.ReactNode }) {
  const { autenticado } = useAuth()
  const [config, setConfig] = useState<FinanzasConfig | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    if (!autenticado) {
      setConfig(null)
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      const data = await fetchFinanzas()
      setConfig(data)
      setTipoCambioMxUsd(data.tipoCambioUsd)
      setMultaPorDia(data.multaPorDia)
    } catch {
      setError('No se pudo cargar la configuración de finanzas.')
    } finally {
      setCargando(false)
    }
  }, [autenticado])

  useEffect(() => {
    recargar()
  }, [recargar, autenticado])

  const guardar = useCallback(
    async (
      payload: Partial<
        Pick<
          FinanzasConfig,
          'tipoCambioUsd' | 'multaPorDia' | 'fondoFeria' | 'preciosReferencia' | 'usarCodigosNuevosPantalon'
        >
      >,
    ) => {
      const data = await actualizarFinanzas(payload)
      setConfig(data)
      setTipoCambioMxUsd(data.tipoCambioUsd)
      setMultaPorDia(data.multaPorDia)
    },
    [],
  )

  const value = useMemo<FinanzasContextValue>(
    () => ({
      config,
      cargando,
      error,
      recargar,
      guardar,
      tipoCambioUsd: config?.tipoCambioUsd ?? 18.5,
      multaPorDia: config?.multaPorDia ?? 15,
      fondoFeria: config?.fondoFeria ?? 2732,
      preciosReferencia: config?.preciosReferencia ?? [],
      usarCodigosNuevosPantalon: config?.usarCodigosNuevosPantalon ?? false,
    }),
    [config, cargando, error, recargar, guardar],
  )

  return <FinanzasContext.Provider value={value}>{children}</FinanzasContext.Provider>
}

export function useFinanzas() {
  const ctx = useContext(FinanzasContext)
  if (!ctx) throw new Error('useFinanzas debe usarse dentro de FinanzasProvider')
  return ctx
}
