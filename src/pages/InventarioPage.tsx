import { useAuth } from '../context/AuthContext'
import { InventarioTrajesPage } from './inventario/InventarioTrajesPage'
import { InventarioVestidosPage } from './inventario/InventarioVestidosPage'

export function InventarioPage() {
  const { lineaNegocio } = useAuth()
  if (lineaNegocio === 'vestidos') {
    return <InventarioVestidosPage />
  }
  return <InventarioTrajesPage />
}
