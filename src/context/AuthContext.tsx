import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe, loginApi, logoutApi } from '../api/auth'
import {
  clearAuth,
  getStoredToken,
  getStoredUser,
  storeAuth,
  type AuthUser,
  type LineaNegocio,
} from '../types/auth'

interface AuthContextValue {
  usuario: AuthUser | null
  lineaNegocio: LineaNegocio | null
  cargando: boolean
  autenticado: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<AuthUser | null>(() => getStoredUser())
  const [cargando, setCargando] = useState(true)

  const validarSesion = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUsuario(null)
      setCargando(false)
      return
    }

    try {
      const data = await fetchMe()
      setUsuario(data.usuario)
      storeAuth(token, data.usuario)
    } catch {
      clearAuth()
      setUsuario(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    validarSesion()
  }, [validarSesion])

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginApi(username, password)
    storeAuth(data.token, data.usuario)
    setUsuario(data.usuario)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      /* limpiar sesión local aunque falle el servidor */
    }
    clearAuth()
    setUsuario(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      lineaNegocio: usuario?.lineaNegocio ?? null,
      cargando,
      autenticado: !!usuario,
      login,
      logout,
    }),
    [usuario, cargando, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
