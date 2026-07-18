import { createContext, useContext, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { TipoPiezaVestido } from '../types/pieza'
import {
  PERFIL_VESTIDO_DEFAULT,
  esPerfilVestidoSlug,
  etiquetaPerfilSlug,
  guardarPerfilActivo,
  leerPerfilActivo,
  tipoVestidoDesdeSlug,
  type PerfilVestidoSlug,
} from '../utils/perfilVestido'

interface PerfilVestidoContextValue {
  perfilSlug: PerfilVestidoSlug
  tipoVestido: TipoPiezaVestido
  etiquetaPerfil: ReturnType<typeof etiquetaPerfilSlug>
  perfilEnRuta: boolean
}

const PerfilVestidoContext = createContext<PerfilVestidoContextValue | null>(null)

export function PerfilVestidoProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  const { perfil } = useParams<{ perfil?: string }>()

  const perfilEnRuta = perfil != null && esPerfilVestidoSlug(perfil)

  const perfilSlug = useMemo((): PerfilVestidoSlug => {
    if (perfilEnRuta) return perfil
    if (usuario?.perfilVestido) return usuario.perfilVestido
    return leerPerfilActivo()
  }, [perfil, perfilEnRuta, usuario?.perfilVestido])

  const tipoVestido = useMemo(() => tipoVestidoDesdeSlug(perfilSlug), [perfilSlug])
  const etiquetaPerfil = useMemo(() => etiquetaPerfilSlug(perfilSlug), [perfilSlug])

  useEffect(() => {
    if (perfilEnRuta) {
      guardarPerfilActivo(perfilSlug)
    }
  }, [perfilEnRuta, perfilSlug])

  const value = useMemo(
    () => ({
      perfilSlug,
      tipoVestido,
      etiquetaPerfil,
      perfilEnRuta,
    }),
    [perfilSlug, tipoVestido, etiquetaPerfil, perfilEnRuta],
  )

  return <PerfilVestidoContext.Provider value={value}>{children}</PerfilVestidoContext.Provider>
}

export function usePerfilVestido(): PerfilVestidoContextValue {
  const ctx = useContext(PerfilVestidoContext)
  if (!ctx) {
    return {
      perfilSlug: PERFIL_VESTIDO_DEFAULT,
      tipoVestido: tipoVestidoDesdeSlug(PERFIL_VESTIDO_DEFAULT),
      etiquetaPerfil: etiquetaPerfilSlug(PERFIL_VESTIDO_DEFAULT),
      perfilEnRuta: false,
    }
  }
  return ctx
}
