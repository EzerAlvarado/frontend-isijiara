const TOKEN_KEY = 'isijara_auth_token'
const USER_KEY = 'isijara_auth_user'

export type LineaNegocio = 'trajes' | 'vestidos'

/** Slug de perfil vestidos devuelto por la API (noche | xv | novia). */
export type PerfilVestidoAuth = 'noche' | 'xv' | 'novia'

export interface AuthUser {
  username: string
  lineaNegocio: LineaNegocio
  lineaLabel: string
  /** Presente cuando el usuario está ligado a un perfil de vestidos. */
  perfilVestido?: PerfilVestidoAuth
}

export interface LoginResponse {
  token: string
  usuario: AuthUser
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function storeAuth(token: string, usuario: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const LINEA_LABELS: Record<LineaNegocio, string> = {
  trajes: 'Trajes',
  vestidos: 'Vestidos',
}

export const LINEA_TITULOS: Record<LineaNegocio, string> = {
  trajes: 'Isijara Tuxedos',
  vestidos: 'Isijara Boutique',
}

export const LINEA_LOGOS: Record<LineaNegocio, string> = {
  trajes: '/branding/logo-tuxedo.png',
  vestidos: '/branding/logo-boutique.png',
}
