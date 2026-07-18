export const FONDO_FERIA_DEFAULT = 2732

export const MXN_BILLETES = [1000, 500, 200, 100, 50, 20] as const
export const MXN_MONEDAS = [20, 10, 5, 2, 1, 0.5] as const
export const USD_BILLETES = [100, 50, 20, 10, 5, 1] as const

export type DenominacionKey = string

export interface ConteoFisico {
  mxnBilletes: Record<DenominacionKey, number>
  mxnMonedas: Record<DenominacionKey, number>
  usdBilletes: Record<DenominacionKey, number>
  /** Monto en vales pendientes (1 unidad = $1 MXN). */
  valesMxn?: number
}

export interface TotalesConteo {
  mxnBilletes: number
  mxnMonedas: number
  mxnVales: number
  mxnTotal: number
  usdTotal: number
  equivalenteMxn: number
  tipoCambioUsd: number
  diferenciaMxn: number | null
}

export function conteoVacio(): ConteoFisico {
  return {
    mxnBilletes: Object.fromEntries(MXN_BILLETES.map((d) => [String(d), 0])),
    mxnMonedas: Object.fromEntries(MXN_MONEDAS.map((d) => [String(d), 0])),
    usdBilletes: Object.fromEntries(USD_BILLETES.map((d) => [String(d), 0])),
  }
}

function sumDenominaciones(
  conteo: Record<DenominacionKey, number>,
  denominaciones: readonly number[],
): number {
  return denominaciones.reduce((sum, d) => {
    const n = Math.max(0, Number(conteo[String(d)] ?? 0) || 0)
    return sum + d * n
  }, 0)
}

export function normalizarConteo(raw: Partial<ConteoFisico> | null | undefined): ConteoFisico {
  const base = conteoVacio()
  if (!raw) return base

  const norm = (keys: readonly number[], src?: Record<string, number>) =>
    Object.fromEntries(
      keys.map((d) => [String(d), Math.max(0, Math.floor(Number(src?.[String(d)] ?? 0) || 0))]),
    )

  return {
    mxnBilletes: norm(MXN_BILLETES, raw.mxnBilletes),
    mxnMonedas: norm(MXN_MONEDAS, raw.mxnMonedas),
    usdBilletes: norm(USD_BILLETES, raw.usdBilletes),
    valesMxn: Math.max(0, Math.floor(Number(raw.valesMxn ?? 0) || 0)),
  }
}

export function calcularTotalesConteo(conteo: ConteoFisico): Omit<
  TotalesConteo,
  'equivalenteMxn' | 'tipoCambioUsd' | 'diferenciaMxn'
> {
  const mxnBilletes = sumDenominaciones(conteo.mxnBilletes, MXN_BILLETES)
  const mxnMonedas = sumDenominaciones(conteo.mxnMonedas, MXN_MONEDAS)
  const mxnVales = Math.max(0, Number(conteo.valesMxn ?? 0) || 0)
  const usdTotal = sumDenominaciones(conteo.usdBilletes, USD_BILLETES)
  return {
    mxnBilletes,
    mxnMonedas,
    mxnVales,
    mxnTotal: mxnBilletes + mxnMonedas + mxnVales,
    usdTotal,
  }
}

export function etiquetaDenominacion(d: number, moneda: 'mxn' | 'usd'): string {
  if (moneda === 'usd') {
    return d === 1 ? '$1 USD' : `$${d} USD`
  }
  if (d < 1) return `${d.toLocaleString('es-MX')} MXN`
  return `$${d.toLocaleString('es-MX')} MXN`
}
