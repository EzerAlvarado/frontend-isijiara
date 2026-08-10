import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { prefetchInventarioRenta } from '../../utils/inventarioRentaCache'

/** Precarga inventario y rentas al entrar al sistema (evita bug en la 1.ª renta). */
export function AppBootstrap() {
  const { autenticado, cargando } = useAuth()

  useEffect(() => {
    if (cargando || !autenticado) return
    prefetchInventarioRenta().catch(() => {
      /* se reintenta al abrir el formulario */
    })
  }, [autenticado, cargando])

  return null
}
