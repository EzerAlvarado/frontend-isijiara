import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PERFIL_VESTIDO_DEFAULT, rutaVestidos } from '../../utils/perfilVestido'

export function HomeRedirect() {
  const { lineaNegocio, usuario } = useAuth()

  if (lineaNegocio === 'vestidos') {
    const perfil = usuario?.perfilVestido ?? PERFIL_VESTIDO_DEFAULT
    return <Navigate to={rutaVestidos(perfil, 'rentas')} replace />
  }

  return <Navigate to="/rentas" replace />
}
