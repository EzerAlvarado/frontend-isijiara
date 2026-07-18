import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PERFIL_VESTIDO_DEFAULT, rutaVestidos } from '../../utils/perfilVestido'

type DestinoTrajes = 'rentas' | 'inventario' | 'archivo-rentas'

interface LineaNegocioRedirectProps {
  destinoTrajes: DestinoTrajes
  children: React.ReactNode
}

export function LineaNegocioRedirect({ destinoTrajes, children }: LineaNegocioRedirectProps) {
  const { lineaNegocio, usuario } = useAuth()

  if (lineaNegocio === 'vestidos') {
    const perfil = usuario?.perfilVestido ?? PERFIL_VESTIDO_DEFAULT
    return <Navigate to={rutaVestidos(perfil, destinoTrajes)} replace />
  }

  return <>{children}</>
}
