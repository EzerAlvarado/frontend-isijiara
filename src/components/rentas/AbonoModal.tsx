import { useEffect, useMemo, useState } from 'react'
import type { MetodoPago, Renta } from '../../types'
import { Modal } from '../ui/Modal'
import { METODOS_PAGO } from '../../utils/metodoPago'
import { restanteRenta, totalCobrarRenta } from '../../utils/pagoRenta'
import {
  calcularPagoEfectivo,
  esPagoEfectivo,
  fmtMoneyMxn,
  getTipoCambioMxUsd,
  inferirMetodoEfectivo,
} from '../../utils/tipoCambio'

interface AbonoModalProps {
  open: boolean
  renta: Renta | null
  onClose: () => void
  onSubmit: (payload: {
    monto?: number
    metodoPago: MetodoPago
    pagoPesos?: number
    pagoDlls?: number
  }) => Promise<void>
}

export function AbonoModal({ open, renta, onClose, onSubmit }: AbonoModalProps) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('pesos')
  const [monto, setMonto] = useState('')
  const [pagoPesos, setPagoPesos] = useState('')
  const [pagoDlls, setPagoDlls] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saldo = renta ? restanteRenta(renta) : 0
  const total = renta ? totalCobrarRenta(renta) : 0
  const esEfectivo = esPagoEfectivo(metodoPago)

  const pagoCalculado = useMemo(() => {
    if (!esEfectivo) return null
    return calcularPagoEfectivo(saldo, Number(pagoPesos) || 0, Number(pagoDlls) || 0)
  }, [esEfectivo, saldo, pagoPesos, pagoDlls])

  useEffect(() => {
    if (!open) return
    setMetodoPago('pesos')
    setMonto('')
    setPagoPesos('')
    setPagoDlls('')
    setError(null)
  }, [open, renta?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renta) return
    setGuardando(true)
    setError(null)
    try {
      if (esEfectivo) {
        const pesos = Number(pagoPesos) || 0
        const dlls = Number(pagoDlls) || 0
        if (pesos <= 0 && dlls <= 0) {
          setError('Indica el efectivo recibido.')
          return
        }
        const pago = calcularPagoEfectivo(saldo, pesos, dlls)
        if (pago.aplicadoMxn <= 0) {
          setError('El abono debe ser mayor a cero.')
          return
        }
        await onSubmit({
          metodoPago: metodoPago === 'mixto' ? 'mixto' : inferirMetodoEfectivo(pesos, dlls),
          pagoPesos: pesos,
          pagoDlls: dlls,
        })
      } else {
        const valor = Number(monto)
        if (!valor || valor <= 0) {
          setError('El monto debe ser mayor a cero.')
          return
        }
        if (valor > saldo + 0.01) {
          setError(`El abono no puede exceder el saldo pendiente (${fmtMoneyMxn(saldo)}).`)
          return
        }
        await onSubmit({ metodoPago, monto: valor })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el abono.')
    } finally {
      setGuardando(false)
    }
  }

  if (!renta) return null

  return (
    <Modal open={open} onClose={() => !guardando && onClose()} title="Registrar abono">
      <p className="mb-4 text-sm text-gray-600">
        Cliente: <strong className="uppercase">{renta.cliente.valor}</strong>
        <br />
        Total: {fmtMoneyMxn(total)} · Saldo pendiente:{' '}
        <strong className="text-amber-800">{fmtMoneyMxn(saldo)}</strong>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
            Forma de pago
          </span>
          <select
            className="input-field"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
          >
            {METODOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        {esEfectivo ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Pesos recibidos
              </span>
              <input
                type="number"
                className="input-field"
                value={pagoPesos}
                onChange={(e) => setPagoPesos(e.target.value)}
                min={0}
                step={1}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Dólares recibidos
              </span>
              <input
                type="number"
                className="input-field"
                value={pagoDlls}
                onChange={(e) => setPagoDlls(e.target.value)}
                min={0}
                step={1}
              />
              <span className="mt-1 block text-xs text-gray-500">
                TC {getTipoCambioMxUsd()} — puedes combinar pesos y dólares
              </span>
            </label>
            {pagoCalculado &&
              (pagoCalculado.recibidoMxn > 0 || pagoCalculado.recibidoUsd > 0) && (
                <div
                  className={`sm:col-span-2 rounded-lg border px-3 py-2 text-sm ${
                    pagoCalculado.feriaMxn > 0
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : pagoCalculado.faltaMxn > 0
                        ? 'border-blue-200 bg-blue-50 text-blue-900'
                        : 'border-green-200 bg-green-50 text-green-900'
                  }`}
                >
                  <p className="font-semibold">
                    Saldo pendiente: {fmtMoneyMxn(pagoCalculado.totalCobrar)}
                  </p>
                  <p>
                    Recibido (equiv.): {fmtMoneyMxn(pagoCalculado.recibidoTotalMxn)}
                    {pagoCalculado.recibidoUsd > 0 && (
                      <span className="text-xs opacity-80">
                        {' '}
                        ({fmtMoneyMxn(pagoCalculado.recibidoMxn)} +{' '}
                        {pagoCalculado.recibidoUsd} USD)
                      </span>
                    )}
                  </p>
                  <p className="mt-1">
                    Se aplicarán {fmtMoneyMxn(pagoCalculado.aplicadoMxn)} al saldo.
                  </p>
                  {pagoCalculado.feriaMxn > 0 ? (
                    <p className="mt-1 text-base font-bold">
                      Feria a dar: {fmtMoneyMxn(pagoCalculado.feriaMxn)}
                    </p>
                  ) : pagoCalculado.faltaMxn > 0 ? (
                    <p className="mt-1 font-medium">
                      Falta por cobrar: {fmtMoneyMxn(pagoCalculado.faltaMxn)}
                    </p>
                  ) : (
                    <p className="mt-1 font-medium">Pago exacto — sin feria</p>
                  )}
                </div>
              )}
          </div>
        ) : (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
              Monto $ MXN
            </span>
            <input
              type="number"
              className="input-field"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min={1}
              max={saldo}
              step={1}
              required
            />
          </label>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={guardando || saldo <= 0}>
            {guardando ? 'Guardando…' : 'Registrar abono'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
