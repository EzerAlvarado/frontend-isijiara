import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { ApiError } from '../api/client'
import {
  createPedido,
  deletePedido,
  fetchPedidos,
  updatePedido,
  type PedidoPayload,
} from '../api/pedidos'
import { Modal } from '../components/ui/Modal'
import { aMayusculas } from '../utils/mayusculas'
import {
  ESTATUS_PEDIDO,
  SERVICIOS_PEDIDO,
  TIPOS_PEDIDO,
  etiquetaTipoPedido,
  estiloEstatusPedido,
  type EstatusPedido,
  type Pedido,
  type ServicioPedido,
  type TipoPedido,
} from '../types/pedido'

type FormState = {
  cliente: string
  tipoPedido: TipoPedido
  estatus: EstatusPedido
  estiloPiezas: string
  servicio: ServicioPedido
  fechaEntrega: string
  comentarios: string
  mesEtiqueta: string
}

const FORM_VACIO: FormState = {
  cliente: '',
  tipoPedido: 'tuxedo',
  estatus: 'pendiente',
  estiloPiezas: '',
  servicio: 'venta',
  fechaEntrega: '',
  comentarios: '',
  mesEtiqueta: '',
}

function colorTextoServicio(servicio: ServicioPedido): string {
  if (servicio === 'premier') return 'text-violet-700'
  if (servicio === 'faltante') return 'text-amber-700'
  return 'text-blue-700'
}

function normalizarServicio(servicio: string): ServicioPedido {
  if (servicio === 'premier') return 'premier'
  if (servicio === 'faltante' || servicio === 'faltante_boutique') return 'faltante'
  return 'venta'
}

function pedidoAForm(p: Pedido): FormState {
  return {
    cliente: p.cliente,
    tipoPedido: p.tipoPedido,
    estatus: p.estatus,
    estiloPiezas: p.estiloPiezas,
    servicio: normalizarServicio(p.servicio),
    fechaEntrega: p.fechaEntrega,
    comentarios: p.comentarios,
    mesEtiqueta: p.mesEtiqueta,
  }
}

function formAPayload(f: FormState): PedidoPayload {
  return {
    cliente: aMayusculas(f.cliente.trim()),
    tipoPedido: f.tipoPedido,
    estatus: f.estatus,
    estiloPiezas: aMayusculas(f.estiloPiezas.trim()),
    servicio: f.servicio,
    fechaEntrega: aMayusculas(f.fechaEntrega.trim()),
    comentarios: f.comentarios.trim(),
    mesEtiqueta: aMayusculas(f.mesEtiqueta.trim()),
    orden: 0,
  }
}

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoPedido | ''>('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Pedido | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await fetchPedidos({
        search: busqueda.trim() || undefined,
        tipo_pedido: filtroTipo || undefined,
      })
      setPedidos(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los pedidos.')
    } finally {
      setCargando(false)
    }
  }, [busqueda, filtroTipo])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const grupos = useMemo(() => {
    const map = new Map<string, Pedido[]>()
    for (const p of pedidos) {
      const key = p.mesEtiqueta.trim() || 'SIN MES'
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [pedidos])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setModalAbierto(true)
  }

  const abrirEditar = (p: Pedido) => {
    setEditando(p)
    setForm(pedidoAForm(p))
    setModalAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente.trim()) {
      setError('El cliente es obligatorio.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload = formAPayload(form)
      if (editando) {
        const actualizado = await updatePedido(editando.id, payload)
        setPedidos((prev) => prev.map((p) => (p.id === editando.id ? actualizado : p)))
      } else {
        const nuevo = await createPedido(payload)
        setPedidos((prev) => [nuevo, ...prev])
      }
      setModalAbierto(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el pedido.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstatus = async (p: Pedido, estatus: EstatusPedido) => {
    const anterior = p.estatus
    setPedidos((prev) => prev.map((x) => (x.id === p.id ? { ...x, estatus } : x)))
    try {
      const actualizado = await updatePedido(p.id, { estatus })
      setPedidos((prev) => prev.map((x) => (x.id === p.id ? actualizado : x)))
    } catch {
      setPedidos((prev) => prev.map((x) => (x.id === p.id ? { ...x, estatus: anterior } : x)))
      setError('No se pudo actualizar el estatus.')
    }
  }

  const eliminar = async (p: Pedido) => {
    const ok = window.confirm(`¿Eliminar el pedido de ${p.cliente}?`)
    if (!ok) return
    try {
      await deletePedido(p.id)
      setPedidos((prev) => prev.filter((x) => x.id !== p.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar.')
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">
            Tablero general · Tuxedo, Noche, XV y Novia
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void cargar()} className="btn-secondary" title="Recargar">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={abrirNuevo} className="btn-primary inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo pedido
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-8"
            placeholder="Buscar cliente, estilo, comentarios…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
        <select
          className="input-field w-auto min-w-[140px]"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoPedido | '')}
        >
          <option value="">Todos los pedidos</option>
          {TIPOS_PEDIDO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-900 text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Pedido</th>
              <th className="px-3 py-2.5">Estatus</th>
              <th className="px-3 py-2.5">Estilo y piezas</th>
              <th className="px-3 py-2.5">Servicio</th>
              <th className="px-3 py-2.5">Fecha de entrega</th>
              <th className="px-3 py-2.5">Comentarios</th>
              <th className="px-3 py-2.5 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {cargando && pedidos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-gray-500">
                  Cargando pedidos…
                </td>
              </tr>
            ) : pedidos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-gray-500">
                  No hay pedidos. Crea el primero con “Nuevo pedido”.
                </td>
              </tr>
            ) : (
              grupos.map(([mes, items]) => (
                <Fragment key={`grupo-${mes}`}>
                  <tr className="bg-amber-50">
                    <td
                      colSpan={8}
                      className="px-3 py-2 text-center text-base font-black tracking-[0.2em] text-gray-900"
                    >
                      {mes}
                    </td>
                  </tr>
                  {items.map((p) => {
                    const colorTxt = colorTextoServicio(normalizarServicio(p.servicio))
                    return (
                    <tr key={p.id} className="border-t border-gray-200 hover:bg-gray-50/80">
                      <td className={`px-3 py-2 font-semibold uppercase ${colorTxt}`}>
                        {p.cliente}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-white">
                          {etiquetaTipoPedido(p.tipoPedido)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className={`rounded-md border-0 px-2 py-1 text-[11px] font-bold uppercase outline-none ${estiloEstatusPedido(p.estatus)}`}
                          value={p.estatus}
                          onChange={(e) => void cambiarEstatus(p, e.target.value as EstatusPedido)}
                        >
                          {ESTATUS_PEDIDO.map((e) => (
                            <option key={e.value} value={e.value}>
                              {e.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={`max-w-[280px] px-3 py-2 text-xs font-medium uppercase ${colorTxt}`}>
                        {p.estiloPiezas || '—'}
                      </td>
                      <td className={`px-3 py-2 text-xs font-bold uppercase ${colorTxt}`}>
                        {SERVICIOS_PEDIDO.find((s) => s.value === normalizarServicio(p.servicio))
                          ?.label ?? 'VENTA'}
                      </td>
                      <td className={`px-3 py-2 text-xs font-semibold uppercase ${colorTxt}`}>
                        {p.fechaEntrega || '—'}
                      </td>
                      <td className={`max-w-[260px] px-3 py-2 text-xs ${colorTxt}`}>
                        {p.comentarios || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => abrirEditar(p)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar"
                            onClick={() => void eliminar(p)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? `Editar pedido #${editando.id}` : 'Nuevo pedido'}
        size="lg"
      >
        <form onSubmit={guardar} className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Cliente *</span>
              <input
                className="input-field uppercase"
                required
                value={form.cliente}
                onChange={(e) => setForm((f) => ({ ...f, cliente: aMayusculas(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Pedido *</span>
              <select
                className="input-field"
                value={form.tipoPedido}
                onChange={(e) => setForm((f) => ({ ...f, tipoPedido: e.target.value as TipoPedido }))}
              >
                {TIPOS_PEDIDO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Estatus</span>
              <select
                className="input-field"
                value={form.estatus}
                onChange={(e) => setForm((f) => ({ ...f, estatus: e.target.value as EstatusPedido }))}
              >
                {ESTATUS_PEDIDO.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Estilo y piezas
              </span>
              <input
                className="input-field uppercase"
                value={form.estiloPiezas}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estiloPiezas: aMayusculas(e.target.value) }))
                }
                placeholder="Ej. SACO Y CHALECO 46R, PANTALON 32R RIZZA"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Servicio</span>
              <select
                className="input-field"
                value={form.servicio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, servicio: e.target.value as ServicioPedido }))
                }
              >
                {SERVICIOS_PEDIDO.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Fecha de entrega
              </span>
              <input
                className="input-field uppercase"
                value={form.fechaEntrega}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fechaEntrega: aMayusculas(e.target.value) }))
                }
                placeholder="Ej. 31 DE AGOSTO / ENCARGAR YA"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Mes (grupo)
              </span>
              <input
                className="input-field uppercase"
                value={form.mesEtiqueta}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mesEtiqueta: aMayusculas(e.target.value) }))
                }
                placeholder="Ej. JULIO"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Comentarios
              </span>
              <textarea
                className="input-field min-h-[80px]"
                value={form.comentarios}
                onChange={(e) => setForm((f) => ({ ...f, comentarios: e.target.value }))}
                placeholder="Ajustes, notas, etc."
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear pedido'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
