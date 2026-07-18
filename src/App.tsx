import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { VestidosProfileGate } from './components/auth/VestidosProfileGate'
import { LineaNegocioRedirect } from './components/auth/LineaNegocioRedirect'
import { HomeRedirect } from './components/auth/HomeRedirect'
import { AppLayout } from './components/layout/AppLayout'
import { ArchivoRentasPage } from './pages/ArchivoRentasPage'
import { RentasPage } from './pages/RentasPage'
import { DevolucionesPage } from './pages/DevolucionesPage'
import { InventarioPage } from './pages/InventarioPage'
import { CorteDiaPage } from './pages/CorteDiaPage'
import { FinanzasPage } from './pages/FinanzasPage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route
            path="rentas"
            element={
              <LineaNegocioRedirect destinoTrajes="rentas">
                <RentasPage />
              </LineaNegocioRedirect>
            }
          />
          <Route
            path="archivo-rentas"
            element={
              <LineaNegocioRedirect destinoTrajes="archivo-rentas">
                <ArchivoRentasPage />
              </LineaNegocioRedirect>
            }
          />
          <Route
            path="inventario"
            element={
              <LineaNegocioRedirect destinoTrajes="inventario">
                <InventarioPage />
              </LineaNegocioRedirect>
            }
          />
          <Route path="devoluciones" element={<DevolucionesPage />} />
          <Route path="corte" element={<CorteDiaPage />} />
          <Route path="finanzas" element={<FinanzasPage />} />
          <Route path="vestidos/:perfil" element={<VestidosProfileGate />}>
            <Route path="rentas" element={<RentasPage />} />
            <Route path="archivo-rentas" element={<ArchivoRentasPage />} />
            <Route path="inventario" element={<InventarioPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
