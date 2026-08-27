/** Marcas conocidas de trajes: se sugieren aunque no haya pieza en inventario. */
export const MARCAS_CATALOGO = [
  'ANTONIO UOMO',
  'CREATIVO',
  'BELLIO',
  'RIZZA',
  'RETRO PARIS',
  'GINO VITALE',
  'FERRECCI',
  'GQ',
] as const

function sinAcentos(valor: string): string {
  return valor.normalize('NFD').replace(/\p{M}/gu, '')
}

/** Clave comparable: ANTONIO UOMO y antoniou oumo → ANTONIOUOMO / ANTONIOUOUMO */
export function claveMarca(valor: string): string {
  return sinAcentos(valor)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
}

function distancia(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  const prev = new Array<number>(n + 1)
  const curr = new Array<number>(n + 1)
  for (let j = 0; j <= n; j += 1) prev[j] = j
  for (let i = 1; i <= m; i += 1) {
    curr[0] = i
    for (let j = 1; j <= n; j += 1) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + costo)
    }
    for (let j = 0; j <= n; j += 1) prev[j] = curr[j]
  }
  return prev[n]
}

export function marcasEquivalentes(a: string, b: string): boolean {
  const x = claveMarca(a)
  const y = claveMarca(b)
  if (!x || !y) return false
  if (x === y) return true

  // Subcadena solo si el lado corto tiene ≥3 letras (evitar "G" ≈ "GQ")
  const corta = x.length <= y.length ? x : y
  const larga = x.length <= y.length ? y : x
  if (corta.length >= 3 && larga.includes(corta)) return true

  // Marcas cortas (GQ, PQ…): sin fuzzy — distancia 1 convertía "PQ" → "GQ"
  const maxLen = Math.max(x.length, y.length)
  if (maxLen <= 3) return false

  const tope = maxLen >= 6 ? 2 : 1
  return distancia(x, y) <= tope
}

export function marcaCoincideBusqueda(marca: string, texto: string): boolean {
  const q = claveMarca(texto)
  if (!q) return true
  const clave = claveMarca(marca)
  if (!clave) return false
  if (clave.includes(q) || q.includes(clave)) return true
  return marcasEquivalentes(marca, texto)
}

/** Devuelve la marca canónica si el texto se reconoce. */
export function reconocerMarca(texto: string, extras: string[] = []): string | null {
  const q = texto.trim()
  if (!q) return null
  const catalogo = [...new Set([...MARCAS_CATALOGO, ...extras.map((m) => m.trim().toUpperCase())])]
  const exacta = catalogo.find((m) => claveMarca(m) === claveMarca(q))
  if (exacta) return exacta
  const equivalentes = catalogo.filter((m) => marcasEquivalentes(m, q))
  if (equivalentes.length === 1) return equivalentes[0]
  const porPrefijo = catalogo.filter((m) => claveMarca(m).startsWith(claveMarca(q)))
  if (porPrefijo.length === 1 && claveMarca(q).length >= 4) return porPrefijo[0]
  return null
}

export function sugerenciasMarcaCatalogo(
  texto: string,
  extras: string[] = [],
  limite = 8,
  incluirCatalogo = true,
): string[] {
  const base = incluirCatalogo ? [...MARCAS_CATALOGO] : []
  const catalogo = [...new Set([...base, ...extras.map((m) => m.trim().toUpperCase()).filter(Boolean)])]
  const q = texto.trim()
  const filtradas = q ? catalogo.filter((m) => marcaCoincideBusqueda(m, q)) : [...catalogo]
  const claveQ = claveMarca(q)
  return filtradas
    .sort((a, b) => {
      const aStart = claveMarca(a).startsWith(claveQ)
      const bStart = claveMarca(b).startsWith(claveQ)
      if (aStart !== bStart) return aStart ? -1 : 1
      return a.localeCompare(b, 'es')
    })
    .slice(0, limite)
}
