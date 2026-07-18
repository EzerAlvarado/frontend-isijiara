import { Outlet } from 'react-router-dom'
import { PerfilVestidoProvider } from '../../context/PerfilVestidoContext'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <PerfilVestidoProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-surface p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </PerfilVestidoProvider>
  )
}
