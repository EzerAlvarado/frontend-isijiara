import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  History,
  CalendarDays,
  Settings,
  FolderOpen,
  Wallet,
  LogOut,
  Archive,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePerfilVestido } from '../../context/PerfilVestidoContext'
import { rutaVestidos } from '../../utils/perfilVestido'

export function Sidebar() {
  const { logout, lineaNegocio } = useAuth()
  const { perfilSlug } = usePerfilVestido()
  const navigate = useNavigate()

  const esVestidos = lineaNegocio === 'vestidos'

  const navItems = esVestidos
    ? [
        { to: '/', icon: Home, label: 'Inicio', end: true },
        { to: '/devoluciones', icon: History, label: 'Devoluciones', end: false },
        { to: rutaVestidos(perfilSlug, 'rentas'), icon: CalendarDays, label: 'Rentas', end: true },
        {
          to: rutaVestidos(perfilSlug, 'archivo-rentas'),
          icon: Archive,
          label: 'Archivo rentas',
          end: true,
        },
        { to: '/corte', icon: Wallet, label: 'Corte del Día', end: false },
        { to: rutaVestidos(perfilSlug, 'inventario'), icon: FolderOpen, label: 'Inventario', end: true },
        { to: '/finanzas', icon: Settings, label: 'Finanzas', end: false },
      ]
    : [
        { to: '/', icon: Home, label: 'Inicio', end: true },
        { to: '/devoluciones', icon: History, label: 'Devoluciones', end: false },
        { to: '/rentas', icon: CalendarDays, label: 'Rentas', end: false },
        { to: '/archivo-rentas', icon: Archive, label: 'Archivo rentas', end: false },
        { to: '/corte', icon: Wallet, label: 'Corte del Día', end: false },
        { to: '/inventario', icon: FolderOpen, label: 'Inventario', end: false },
        { to: '/finanzas', icon: Settings, label: 'Finanzas', end: false },
      ]

  const cerrarSesion = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex w-16 flex-col items-center border-r border-gray-200 bg-white py-4">
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`
            }
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        title="Cerrar sesión"
        onClick={cerrarSesion}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </aside>
  )
}
