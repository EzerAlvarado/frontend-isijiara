import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '../ui/Modal'
import type { ValeCorte } from '../../types'
import {
  MXN_BILLETES,
  MXN_MONEDAS,
  USD_BILLETES,
  calcularTotalesConteo,
  conteoVacio,
  etiquetaDenominacion,
  normalizarConteo,
  type ConteoFisico,
} from '../../utils/conteoCaja'
import { getTipoCambioMxUsd } from '../../utils/tipoCambio'

function formatMxn(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function formatUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function equivalenteMxn(
  conteo: ConteoFisico,
  tc: number,
): number {
  const totales = calcularTotalesConteo(conteo)
  return totales.mxnTotal + totales.usdTotal * tc
}

interface FilaDenominacionProps {
  label: string
  value: number
  onChange: (v: number) => void
  subtotal: number
  moneda: 'mxn' | 'usd'
  readOnly?: boolean
  hint?: string
}

function FilaDenominacion({
  label,
  value,
  onChange,
  subtotal,
  moneda,
  readOnly,
  hint,
}: FilaDenominacionProps) {
  return (
    <div className="border-b border-gray-100 py-2 last:border-0">
      <div className="grid grid-cols-[1fr_72px_88px] items-center gap-2">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <input
          type="number"
          min={0}
          step={1}
          readOnly={readOnly}
          className={`input-field py-1.5 text-center text-sm ${readOnly ? 'bg-gray-50' : ''}`}
          value={value || ''}
          onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          placeholder="0"
        />
        <span className="text-right text-sm font-semibold text-gray-600">
          {moneda === 'usd' ? formatUsd(subtotal) : formatMxn(subtotal)}
        </span>
      </div>
      {hint && <p className="mt-1 text-[10px] text-gray-500">{hint}</p>}
    </div>
  )
}

interface BloqueDenominacionesProps {
  titulo: string
  denominaciones: readonly number[]
  conteo: Record<string, number>
  onChange: (denom: string, cantidad: number) => void
  moneda: 'mxn' | 'usd'
  readOnly?: boolean
}

function BloqueDenominaciones({
  titulo,
  denominaciones,
  conteo,
  onChange,
  moneda,
  readOnly,
}: BloqueDenominacionesProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">{titulo}</p>
      <div className="mb-1 grid grid-cols-[1fr_72px_88px] gap-2 text-[10px] font-semibold uppercase text-gray-400">
        <span>Denominación</span>
        <span className="text-center">Cant.</span>
        <span className="text-right">Subtotal</span>
      </div>
      {denominaciones.map((d) => {
        const key = String(d)
        const cant = conteo[key] ?? 0
        return (
          <FilaDenominacion
            key={key}
            label={etiquetaDenominacion(d, moneda)}
            value={cant}
            onChange={(v) => onChange(key, v)}
            subtotal={d * cant}
            moneda={moneda}
            readOnly={readOnly}
          />
        )
      })}
    </div>
  )
}

interface FormularioConteoProps {
  conteo: ConteoFisico
  onChange: (conteo: ConteoFisico) => void
  readOnly?: boolean
  mostrarVales?: boolean
  valesHint?: string
  modoFondo?: boolean
}

function FormularioConteo({
  conteo,
  onChange,
  readOnly,
  mostrarVales,
  valesHint,
  modoFondo,
}: FormularioConteoProps) {
  const setCantidad = (
    bloque: 'mxnBilletes' | 'mxnMonedas' | 'usdBilletes',
    denom: string,
    cantidad: number,
  ) => {
    onChange({
      ...conteo,
      [bloque]: { ...conteo[bloque], [denom]: cantidad },
    })
  }

  const totales = calcularTotalesConteo(conteo)
  const tc = getTipoCambioMxUsd()

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase text-gray-700">Pesos mexicanos</h4>
        <BloqueDenominaciones
          titulo="Billetes"
          denominaciones={MXN_BILLETES}
          conteo={conteo.mxnBilletes}
          onChange={(d, v) => setCantidad('mxnBilletes', d, v)}
          moneda="mxn"
          readOnly={readOnly}
        />
        <BloqueDenominaciones
          titulo="Monedas"
          denominaciones={MXN_MONEDAS}
          conteo={conteo.mxnMonedas}
          onChange={(d, v) => setCantidad('mxnMonedas', d, v)}
          moneda="mxn"
          readOnly={readOnly}
        />
        {mostrarVales && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-800">Vales</p>
            <div className="mb-1 grid grid-cols-[1fr_72px_88px] gap-2 text-[10px] font-semibold uppercase text-gray-400">
              <span>Denominación</span>
              <span className="text-center">Cant.</span>
              <span className="text-right">Subtotal</span>
            </div>
            <FilaDenominacion
              label="Vales ($1 c/u)"
              value={conteo.valesMxn ?? 0}
              onChange={(v) => onChange({ ...conteo, valesMxn: v })}
              subtotal={conteo.valesMxn ?? 0}
              moneda="mxn"
              readOnly={readOnly}
              hint={
                valesHint
                  ? modoFondo
                    ? `Pendientes: ${valesHint}. Baja la cantidad al reponer efectivo.`
                    : `Pendientes: ${valesHint}. Cuenta los vales que aún tienes; pueden reponerse después.`
                  : '1 en cantidad = $1 MXN en vales pendientes.'
              }
            />
          </div>
        )}
        <p className="text-right text-sm font-semibold text-gray-800">
          Total MXN: {formatMxn(totales.mxnTotal)}
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase text-gray-700">Dólares (USD)</h4>
        <BloqueDenominaciones
          titulo="Billetes"
          denominaciones={USD_BILLETES}
          conteo={conteo.usdBilletes}
          onChange={(d, v) => setCantidad('usdBilletes', d, v)}
          moneda="usd"
          readOnly={readOnly}
        />
        <p className="text-right text-sm font-semibold text-gray-800">
          Total USD: {formatUsd(totales.usdTotal)}
          {tc > 0 && totales.usdTotal > 0 && (
            <span className="ml-2 text-gray-500">≈ {formatMxn(totales.usdTotal * tc)}</span>
          )}
        </p>
      </div>
    </div>
  )
}

type TabConteo = 'caja' | 'fondo'

interface ConteoCajaModalProps {
  open: boolean
  onClose: () => void
  onConfirm?: (conteo: ConteoFisico, empleado?: string) => void
  onConfirmSeparado?: (
    conteoFondo: ConteoFisico,
    conteoCaja: ConteoFisico,
    empleado?: string,
  ) => void
  expectedMxn: number
  tipoCambioUsd?: number
  initialConteo?: ConteoFisico | null
  initialConteoFondo?: ConteoFisico | null
  initialConteoCaja?: ConteoFisico | null
  readOnly?: boolean
  guardando?: boolean
  titulo?: string
  descripcion?: string
  fondoMxn?: number
  cajaMxn?: number
  expectedFondoMxn?: number
  expectedCajaMxn?: number
  modoFondo?: boolean
  modoSeparado?: boolean
  fondoReferencia?: number
  valesPendientes?: ValeCorte[]
  valesEsperadosFondo?: number
  confirmLabel?: string
  pedirNombreEmpleado?: boolean
  empleadoInicial?: string
  mostrarVales?: boolean
}

function diferenciaClass(diferencia: number) {
  if (Math.abs(diferencia) < 0.01) return 'text-green-700'
  if (diferencia > 0) return 'text-amber-700'
  return 'text-red-700'
}

function conteoTieneDatos(conteo: ConteoFisico): boolean {
  const totales = calcularTotalesConteo(conteo)
  return totales.mxnTotal > 0 || totales.usdTotal > 0
}

function valesEsperadosEnFondo(conteo: ConteoFisico, valesPendientesTotal: number): number {
  return Math.max(valesPendientesTotal, conteo.valesMxn ?? 0)
}

function prefijarValesFondo(conteo: ConteoFisico, valesPendientesTotal: number): ConteoFisico {
  const objetivo = valesEsperadosEnFondo(conteo, valesPendientesTotal)
  if (objetivo <= 0) return conteo
  return { ...conteo, valesMxn: objetivo }
}

function tabsInicialesVisitadas(
  conteoFondo: ConteoFisico,
  conteoCaja: ConteoFisico,
): Set<TabConteo> {
  const visitadas = new Set<TabConteo>(['caja'])
  if (conteoTieneDatos(conteoFondo)) visitadas.add('fondo')
  if (conteoTieneDatos(conteoCaja)) visitadas.add('caja')
  return visitadas
}

export function ConteoCajaModal({
  open,
  onClose,
  onConfirm,
  onConfirmSeparado,
  expectedMxn,
  tipoCambioUsd,
  initialConteo,
  initialConteoFondo,
  initialConteoCaja,
  readOnly = false,
  guardando = false,
  titulo,
  descripcion,
  fondoMxn,
  cajaMxn,
  expectedFondoMxn,
  expectedCajaMxn,
  modoFondo = false,
  modoSeparado = false,
  fondoReferencia,
  valesPendientes = [],
  valesEsperadosFondo,
  confirmLabel,
  pedirNombreEmpleado = false,
  empleadoInicial = '',
  mostrarVales: mostrarValesProp,
}: ConteoCajaModalProps) {
  const mostrarVales = mostrarValesProp ?? modoFondo
  const totalValesPendientes = useMemo(
    () => valesPendientes.reduce((sum, v) => sum + v.montoMxn, 0),
    [valesPendientes],
  )

  const [conteo, setConteo] = useState<ConteoFisico>(() => normalizarConteo(initialConteo))
  const [conteoFondo, setConteoFondo] = useState<ConteoFisico>(() =>
    normalizarConteo(initialConteoFondo ?? initialConteo),
  )
  const [conteoCaja, setConteoCaja] = useState<ConteoFisico>(() =>
    normalizarConteo(initialConteoCaja ?? conteoVacio()),
  )
  const [empleado, setEmpleado] = useState(empleadoInicial)
  const [tabActiva, setTabActiva] = useState<TabConteo>('caja')
  const [tabsVisitadas, setTabsVisitadas] = useState<Set<TabConteo>>(() => new Set(['caja']))
  const estabaAbierto = useRef(false)

  useEffect(() => {
    const abriendo = open && !estabaAbierto.current
    estabaAbierto.current = open
    if (!abriendo) return

    if (modoSeparado) {
      const fondoBase = prefijarValesFondo(
        normalizarConteo(initialConteoFondo ?? conteoVacio()),
        valesEsperadosFondo ?? totalValesPendientes,
      )
      const cajaBase = normalizarConteo(initialConteoCaja ?? conteoVacio())
      setConteoFondo(fondoBase)
      setConteoCaja(cajaBase)
      setTabActiva('caja')
      setTabsVisitadas(tabsInicialesVisitadas(fondoBase, cajaBase))
    } else {
      const base = normalizarConteo(initialConteo ?? conteoVacio())
      if (mostrarVales || modoFondo) {
        setConteo(prefijarValesFondo(base, valesEsperadosFondo ?? totalValesPendientes))
      } else {
        setConteo(base)
      }
    }

    setEmpleado(empleadoInicial)
  }, [
    open,
    initialConteo,
    initialConteoFondo,
    initialConteoCaja,
    mostrarVales,
    modoSeparado,
    totalValesPendientes,
    valesEsperadosFondo,
    empleadoInicial,
  ])

  const empleadoValido = !pedirNombreEmpleado || empleado.trim().length > 0
  const tabsCompletas = tabsVisitadas.has('caja') && tabsVisitadas.has('fondo')

  const tc = tipoCambioUsd && tipoCambioUsd > 0 ? tipoCambioUsd : getTipoCambioMxUsd()

  const valesHint =
    valesPendientes.length > 0
      ? valesPendientes.map((v) => `${v.concepto} (${formatMxn(v.montoMxn)})`).join(' · ')
      : undefined

  const cambiarTab = (tab: TabConteo) => {
    setTabActiva(tab)
    setTabsVisitadas((prev) => new Set([...prev, tab]))
  }

  const totales = useMemo(() => calcularTotalesConteo(conteo), [conteo])
  const equivalenteMxnTotal = totales.mxnTotal + totales.usdTotal * tc

  if (modoSeparado) {
    const esperadoFondo = expectedFondoMxn ?? fondoMxn ?? 0
    const esperadoCaja = expectedCajaMxn ?? cajaMxn ?? 0
    const valesFondoEsperados = valesEsperadosEnFondo(
      conteoFondo,
      valesEsperadosFondo ?? totalValesPendientes,
    )
    const esperadoFondoTotal = esperadoFondo + valesFondoEsperados
    const esperadoTotal = esperadoFondoTotal + esperadoCaja

    const contadoFondo = equivalenteMxn(conteoFondo, tc)
    const contadoCaja = equivalenteMxn(conteoCaja, tc)
    const contadoTotal = contadoFondo + contadoCaja
    const diferenciaTotal = contadoTotal - esperadoTotal
    const diferenciaFondo = contadoFondo - esperadoFondoTotal
    const diferenciaCaja = contadoCaja - esperadoCaja

    const totalesFondo = calcularTotalesConteo(conteoFondo)
    const totalesCajaTab = calcularTotalesConteo(conteoCaja)

    return (
      <Modal
        open={open}
        onClose={() => !guardando && onClose()}
        title={titulo ?? (readOnly ? 'Conteo físico de caja' : 'Cierre de caja — conteo físico')}
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {descripcion ??
              'Cuenta el fondo de feria y la caja del turno por separado. Indica quién hace el corte.'}
          </p>

          <div className="grid gap-3 rounded-lg border border-brand-100 bg-brand-50/40 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs uppercase text-gray-500">Esperado fondo</p>
              <p className="text-base font-bold text-gray-900">{formatMxn(esperadoFondoTotal)}</p>
              {valesFondoEsperados > 0 && (
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Efectivo {formatMxn(esperadoFondo)} + vales {formatMxn(valesFondoEsperados)}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Esperado caja</p>
              <p className="text-base font-bold text-gray-900">{formatMxn(esperadoCaja)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Total esperado</p>
              <p className="text-base font-bold text-gray-900">{formatMxn(esperadoTotal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Contado total</p>
              <p className="text-base font-bold text-brand-700">{formatMxn(contadoTotal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Diferencia</p>
              <p className={`text-base font-bold ${diferenciaClass(diferenciaTotal)}`}>
                {diferenciaTotal >= 0 ? '+' : ''}
                {formatMxn(diferenciaTotal)}
              </p>
            </div>
          </div>

          {pedirNombreEmpleado && !readOnly && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Empleado que hace el corte <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                className="input-field uppercase"
                value={empleado}
                onChange={(e) => setEmpleado(e.target.value.toLocaleUpperCase('es-MX'))}
                placeholder="Nombre del empleado"
                required
                autoComplete="name"
              />
            </label>
          )}

          <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {(['caja', 'fondo'] as const).map((tab) => {
              const activa = tabActiva === tab
              const visitada = tabsVisitadas.has(tab)
              const diff = tab === 'caja' ? diferenciaCaja : diferenciaFondo
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => cambiarTab(tab)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    activa
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'caja' ? 'Caja' : 'Fondo'}
                  {!readOnly && !visitada && (
                    <span className="ml-1 text-[10px] font-normal text-amber-600">pendiente</span>
                  )}
                  {visitada && Math.abs(diff) >= 0.01 && (
                    <span className={`ml-1 text-[10px] font-normal ${diferenciaClass(diff)}`}>
                      {diff >= 0 ? '+' : ''}
                      {formatMxn(diff)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {tabActiva === 'caja' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Esperado caja del turno</p>
                  <p className="text-lg font-bold text-gray-900">{formatMxn(esperadoCaja)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-500">Contado caja</p>
                  <p className="text-lg font-bold text-brand-700">{formatMxn(contadoCaja)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-500">Diferencia caja</p>
                  <p className={`text-lg font-bold ${diferenciaClass(diferenciaCaja)}`}>
                    {diferenciaCaja >= 0 ? '+' : ''}
                    {formatMxn(diferenciaCaja)}
                  </p>
                </div>
              </div>
              <FormularioConteo conteo={conteoCaja} onChange={setConteoCaja} readOnly={readOnly} />
              {totalesCajaTab.usdTotal > 0 && (
                <p className="text-xs text-gray-500">
                  USD en caja: {formatUsd(totalesCajaTab.usdTotal)}
                  {tc > 0 && ` · TC ${tc.toFixed(2)}`}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Esperado fondo</p>
                  <p className="text-lg font-bold text-gray-900">{formatMxn(esperadoFondoTotal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-500">Contado fondo</p>
                  <p className="text-lg font-bold text-brand-700">{formatMxn(contadoFondo)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-500">Diferencia fondo</p>
                  <p className={`text-lg font-bold ${diferenciaClass(diferenciaFondo)}`}>
                    {diferenciaFondo >= 0 ? '+' : ''}
                    {formatMxn(diferenciaFondo)}
                  </p>
                </div>
              </div>
              <FormularioConteo
                conteo={conteoFondo}
                onChange={setConteoFondo}
                readOnly={readOnly}
                mostrarVales
                valesHint={valesHint}
              />
              {totalesFondo.usdTotal > 0 && (
                <p className="text-xs text-gray-500">
                  USD en fondo: {formatUsd(totalesFondo.usdTotal)}
                  {tc > 0 && ` · TC ${tc.toFixed(2)}`}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={onClose}
              disabled={guardando}
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!readOnly && onConfirmSeparado && (
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={guardando || !empleadoValido || !tabsCompletas}
                title={!tabsCompletas ? 'Revisa ambas pestañas: Caja y Fondo' : undefined}
                onClick={() =>
                  onConfirmSeparado(
                    normalizarConteo(conteoFondo),
                    normalizarConteo(conteoCaja),
                    pedirNombreEmpleado ? empleado.trim() : undefined,
                  )
                }
              >
                {guardando
                  ? 'Guardando…'
                  : (confirmLabel ?? 'Confirmar cierre de caja')}
              </button>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  const expectedTotal = modoFondo
    ? fondoReferencia && fondoReferencia > 0
      ? fondoReferencia
      : expectedMxn + valesEsperadosEnFondo(conteo, valesEsperadosFondo ?? totalValesPendientes)
    : mostrarVales
      ? expectedMxn + valesEsperadosEnFondo(conteo, valesEsperadosFondo ?? totalValesPendientes)
      : expectedMxn
  const diferencia = equivalenteMxnTotal - expectedTotal

  return (
    <Modal
      open={open}
      onClose={() => !guardando && onClose()}
      title={titulo ?? (readOnly ? 'Conteo físico de caja' : 'Cierre de caja — conteo físico')}
      size="xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {descripcion ??
            'Cuenta billetes y monedas en la caja. El sistema comparará con el efectivo esperado del día.'}
        </p>

        <div className="grid gap-4 rounded-lg border border-brand-100 bg-brand-50/40 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-gray-500">
              {modoFondo ? 'Fondo esperado' : 'Esperado en caja'}
            </p>
            <p className="text-lg font-bold text-gray-900">{formatMxn(expectedTotal)}</p>
            {modoFondo && (
              <p className="mt-1 text-xs text-gray-500">
                Efectivo {formatMxn(expectedMxn)} + vales{' '}
                {formatMxn(valesEsperadosEnFondo(conteo, valesEsperadosFondo ?? totalValesPendientes))}
              </p>
            )}
            {fondoMxn != null && cajaMxn != null && !modoFondo && (
              <p className="mt-1 text-xs text-gray-500">
                {mostrarVales &&
                valesEsperadosEnFondo(conteo, valesEsperadosFondo ?? totalValesPendientes) > 0
                  ? `Fondo ${formatMxn(fondoMxn)} + caja ${formatMxn(cajaMxn)} + vales ${formatMxn(valesEsperadosEnFondo(conteo, valesEsperadosFondo ?? totalValesPendientes))}`
                  : `Fondo ${formatMxn(fondoMxn)} + caja ${formatMxn(cajaMxn)}`}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Contado (equiv. MXN)</p>
            <p className="text-lg font-bold text-brand-700">{formatMxn(equivalenteMxnTotal)}</p>
            {mostrarVales && totales.mxnVales > 0 && (
              <p className="text-xs text-gray-500">incl. {formatMxn(totales.mxnVales)} en vales</p>
            )}
            {totales.usdTotal > 0 && (
              <p className="text-xs text-gray-500">
                incl. {formatUsd(totales.usdTotal)} USD
                {tc > 0 && ` · TC ${tc.toFixed(2)}`}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Diferencia</p>
            <p className={`text-lg font-bold ${diferenciaClass(diferencia)}`}>
              {diferencia >= 0 ? '+' : ''}
              {formatMxn(diferencia)}
            </p>
          </div>
        </div>

        {pedirNombreEmpleado && !readOnly && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
              Empleado que hace el corte <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              className="input-field uppercase"
              value={empleado}
              onChange={(e) => setEmpleado(e.target.value.toLocaleUpperCase('es-MX'))}
              placeholder="Nombre del empleado"
              required
              autoComplete="name"
            />
          </label>
        )}

        <FormularioConteo
          conteo={conteo}
          onChange={setConteo}
          readOnly={readOnly}
          mostrarVales={mostrarVales}
          valesHint={valesHint}
          modoFondo={modoFondo}
        />

        <div className="flex gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onClose}
            disabled={guardando}
          >
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!readOnly && onConfirm && (
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={guardando || !empleadoValido}
              onClick={() =>
                onConfirm(
                  normalizarConteo(conteo),
                  pedirNombreEmpleado ? empleado.trim() : undefined,
                )
              }
            >
              {guardando
                ? 'Guardando…'
                : (confirmLabel ??
                  (modoFondo ? 'Guardar conteo de fondo' : 'Confirmar cierre de caja'))}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
