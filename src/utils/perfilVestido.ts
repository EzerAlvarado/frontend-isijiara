import { etiquetaTipoVestido, type TipoPiezaVestido } from '../types/pieza'

export type PerfilVestidoSlug = 'noche' | 'xv' | 'novia'

export type PaginaPerfilVestido = 'rentas' | 'inventario' | 'archivo-rentas'

export const PERFIL_VESTIDO_DEFAULT: PerfilVestidoSlug = 'noche'

export const PERFILES_VESTIDO: PerfilVestidoSlug[] = ['noche', 'xv', 'novia']

const STORAGE_KEY = 'isijara_perfil_vestido'

export function esPerfilVestidoSlug(value: string): value is PerfilVestidoSlug {
  return value === 'noche' || value === 'xv' || value === 'novia'
}

export function tipoVestidoDesdeSlug(slug: PerfilVestidoSlug): TipoPiezaVestido {
  if (slug === 'xv') return 'quince'
  if (slug === 'novia') return 'boda'
  return 'noche'
}

export function slugDesdeTipoVestido(tipo: TipoPiezaVestido): PerfilVestidoSlug {
  if (tipo === 'quince') return 'xv'
  if (tipo === 'boda') return 'novia'
  return 'noche'
}

export function etiquetaPerfilSlug(slug: PerfilVestidoSlug): 'NOCHE' | 'XV' | 'NOVIA' {
  if (slug === 'xv') return 'XV'
  if (slug === 'novia') return 'NOVIA'
  return 'NOCHE'
}

export function etiquetaPerfilLegible(slug: PerfilVestidoSlug): string {
  return etiquetaTipoVestido(tipoVestidoDesdeSlug(slug))
}

export function rutaVestidos(perfil: PerfilVestidoSlug, pagina: PaginaPerfilVestido): string {
  return `/vestidos/${perfil}/${pagina}`
}

export function paginaPerfilDesdePath(pathname: string): PaginaPerfilVestido | null {
  const match = pathname.match(/^\/vestidos\/[^/]+\/(rentas|inventario|archivo-rentas)/)
  if (!match) return null
  return match[1] as PaginaPerfilVestido
}

export function guardarPerfilActivo(slug: PerfilVestidoSlug): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, slug)
  } catch {
    /* ignore */
  }
}

export function leerPerfilActivo(): PerfilVestidoSlug {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored && esPerfilVestidoSlug(stored)) return stored
  } catch {
    /* ignore */
  }
  return PERFIL_VESTIDO_DEFAULT
}
