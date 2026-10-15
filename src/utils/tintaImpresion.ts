export type TintaImpresion = 'negro' | 'azul'

const STORAGE_KEY = 'isijara.tintaImpresion'
const EVENTO = 'isijara-tinta-impresion'
const ATTR = 'data-tinta-impresion'

export function leerTintaImpresion(): TintaImpresion {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'azul' ? 'azul' : 'negro'
  } catch {
    return 'negro'
  }
}

export function aplicarTintaImpresion(tinta: TintaImpresion) {
  document.documentElement.setAttribute(ATTR, tinta)
}

export function guardarTintaImpresion(tinta: TintaImpresion) {
  try {
    localStorage.setItem(STORAGE_KEY, tinta)
  } catch {
    /* ignore quota */
  }
  aplicarTintaImpresion(tinta)
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: tinta }))
}

export function suscribirTintaImpresion(cb: (tinta: TintaImpresion) => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb(leerTintaImpresion())
  }
  const onCustom = (e: Event) => {
    const tinta = (e as CustomEvent).detail
    cb(tinta === 'azul' ? 'azul' : 'negro')
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(EVENTO, onCustom)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(EVENTO, onCustom)
  }
}
