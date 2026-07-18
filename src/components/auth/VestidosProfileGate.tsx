import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  PERFIL_VESTIDO_DEFAULT,
  esPerfilVestidoSlug,
  paginaPerfilDesdePath,
  rutaVestidos,
} from '../../utils/perfilVestido'

export function VestidosProfileGate() {
  const { lineaNegocio, usuario } = useAuth()
  const { perfil } = useParams<{ perfil: string }>()
  const location = useLocation()

  const perfilUsuario = usuario?.perfilVestido ?? PERFIL_VESTIDO_DEFAULT

  if (lineaNegocio !== 'vestidos') {
    return <Navigate to="/rentas" replace />
  }

  if (!perfil || !esPerfilVestidoSlug(perfil)) {
    return <Navigate to={rutaVestidos(perfilUsuario, 'rentas')} replace />
  }

  if (usuario?.perfilVestido && perfil !== usuario.perfilVestido) {
    const pagina = paginaPerfilDesdePath(location.pathname) ?? 'rentas'
    return <Navigate to={rutaVestidos(usuario.perfilVestido, pagina)} replace />
  }

  return <Outlet />
}
