import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import type { Renta } from '../../types'
import type { Pieza, TipoPieza } from '../../types/pieza'
import { etiquetaTipoVestido } from '../../types/pieza'
import {
  DIAS_RENTA_DEFAULT,
  crearFormularioVacio,
  formularioAPayload,
  rentaAFormulario,
  type RentaFormValues,
} from '../../utils/rentaForm'
import { sumarDiasFecha } from '../../utils/semanasRentas'
import { calcularMultaAutomatica, getMultaPorDia } from '../../utils/multa'
import { aMayusculas } from '../../utils/mayusculas'
import { semanaKeyDesdeFechaSalida } from '../../utils/semanasRentas'
import { METODOS_PAGO } from '../../utils/metodoPago'
import type { MetodoPago } from '../../types'
import {
  calcularPagoEfectivo,
  calcularRestante,
  calcularRestanteEfectivo,
  esPagoEfectivo,
  fmtMoneyMxn,
  fmtMontoConDlls,
  getTipoCambioMxUsd,
} from '../../utils/tipoCambio'
import { valoresDesdePieza } from '../../utils/piezaRenta'
import { usePiezasDisponibles } from '../../hooks/usePiezasDisponibles'
import { InventarioAutocomplete } from './InventarioAutocomplete'
import { SelectorTipoOperacion } from './VestidoPiezasSugeridas'
import { useAuth } from '../../context/AuthContext'
import { usePerfilVestido } from '../../context/PerfilVestidoContext'
import { useFinanzas } from '../../context/FinanzasContext'
import { buscarPiezaVestido, resolverPiezasDesdeFormulario } from '../../utils/inventarioSugerencias'
import {
  avisosPiezasVinculadas,
  conflictosTrajePorPrenda,
  ETIQUETA_PRENDA_TRAJE,
  validarTrajeParaRenta,
  validarPiezasParaRenta,
  type PrendaTraje,
} from '../../utils/disponibilidadPieza'
import {
  BannerAvisoDisponibilidad,
  ListaAvisosDisponibilidad,
  type AvisoDisponibilidadItem,
} from '../inventario/AvisoDisponibilidad'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  calcularPrecioVestido,
  esPrecioOperacionManual,
  esPatrocinio,
  etiquetaTipoOperacionVestido,
  type TipoOperacion,
} from '../../utils/precioVestido'
const CAMPOS_MAYUS: (keyof RentaFormValues)[] = [
  'color',
  'marca',
  'colorChaleco',
  'marcaChaleco',
  'colorPantalon',
  'marcaPantalon',
  'saco',
  'chaleco',
  'pantalon',
  'camisa',
  'corbataMono',
  'cinto',
  'accesorio',
  'empleado',
  'cliente',
  'telefono',
  'direccion',
  'detalles',
  'ajustes',
]

interface RentaFormModalProps {
  open: boolean
  onClose: () => void
  renta?: Renta | null
  onSubmit: (payload: Omit<Renta, 'id'>) => Promise<void>
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  readOnly,
  hint,
  type = 'text',
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  hint?: string
  type?: 'text' | 'time'
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">{label}</span>
      <input
        type={type}
        className={`input-field uppercase ${readOnly ? 'bg-gray-50 text-gray-600' : ''} ${type === 'time' ? 'max-w-[140px] normal-case' : ''}`}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
      />
      {hint && <span className="mt-0.5 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  )
}

function FilaPieza({
  titulo,
  color,
  marca,
  talla,
  tipo,
  piezas,
  onColor,
  onMarca,
  onTalla,
  onElegirPieza,
  usarCodigosNuevosPantalon,
}: {
  titulo: string
  color: string
  marca: string
  talla: string
  tipo: TipoPieza
  piezas: Pieza[]
  onColor: (v: string) => void
  onMarca: (v: string) => void
  onTalla: (v: string) => void
  onElegirPieza: (pieza: Pieza) => void
  usarCodigosNuevosPantalon?: boolean
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">{titulo}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Color" value={color} onChange={onColor} placeholder="NEGRO" />
        <InventarioAutocomplete
          label="Marca"
          modo="marca"
          value={marca}
          tipo={tipo}
          color={color}
          marca={marca}
          talla={talla}
          piezas={piezas}
          onChange={onMarca}
          onElegirPieza={onElegirPieza}
        />
        <InventarioAutocomplete
          label="Talla"
          modo="talla"
          value={talla}
          tipo={tipo}
          color={color}
          marca={marca}
          talla={talla}
          piezas={piezas}
          onChange={onTalla}
          onElegirPieza={onElegirPieza}
          usarCodigosNuevosPantalon={tipo === 'pantalon' ? usarCodigosNuevosPantalon : undefined}
        />
      </div>
    </div>
  )
}

export function RentaFormModal({
  open,
  onClose,
  renta,
  onSubmit,
}: RentaFormModalProps) {
  const esEdicion = renta != null
  const { usuario } = useAuth()
  const { tipoVestido: categoriaPerfil } = usePerfilVestido()
  const { preciosReferencia, usarCodigosNuevosPantalon } = useFinanzas()
  const esVestidos = usuario?.lineaNegocio === 'vestidos'
  const [values, setValues] = useState<RentaFormValues>(crearFormularioVacio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmProximaSemana, setConfirmProximaSemana] = useState(false)

  const { piezas: inventario, piezasTodas, rentas: rentasActivas } = usePiezasDisponibles(open, {
    piezaIds: {
      saco: renta?.piezaSacoId,
      chaleco: renta?.piezaChalecoId,
      pantalon: renta?.piezaPantalonId,
    },
    fechaSalida: values.fechaSalida,
    rentaIdExcluir: renta?.id,
  })

  const piezaVestidoVinculada = useMemo(() => {
    if (!esVestidos) return undefined
    if (values.piezaSacoId) {
      return piezasTodas.find((p) => p.id === values.piezaSacoId)
    }
    return buscarPiezaVestido(
      inventario,
      values.categoriaVestido,
      values.color,
      values.marca,
      values.pantalon,
      values.saco,
    )
  }, [esVestidos, inventario, piezasTodas, values])

  const piezasVinculadasIds = useMemo(() => {
    if (esVestidos) {
      const id =
        values.piezaSacoId ||
        piezaVestidoVinculada?.id ||
        ''
      return id ? [id] : []
    }
    return [values.piezaSacoId, values.piezaChalecoId, values.piezaPantalonId].filter(
      Boolean,
    ) as string[]
  }, [esVestidos, values, piezaVestidoVinculada])

  const avisosDisponibilidad = useMemo(
    () =>
      esVestidos
        ? avisosPiezasVinculadas(
            piezasVinculadasIds,
            values.fechaSalida,
            rentasActivas,
            renta?.id,
          )
        : [],
    [esVestidos, piezasVinculadasIds, values.fechaSalida, rentasActivas, renta?.id],
  )

  const conflictosTraje = useMemo(
    () =>
      !esVestidos
        ? conflictosTrajePorPrenda(
            values,
            piezasTodas,
            values.fechaSalida,
            rentasActivas,
            renta?.id,
          )
        : {},
    [esVestidos, values, piezasTodas, rentasActivas, renta?.id],
  )

  const itemsAvisoDisponibilidad = useMemo((): AvisoDisponibilidadItem[] => {
    if (esVestidos) {
      return avisosDisponibilidad.map((conflicto) => ({ conflicto }))
    }
    const items: AvisoDisponibilidadItem[] = []
    for (const prenda of ['saco', 'chaleco', 'pantalon'] as PrendaTraje[]) {
      const conflicto = conflictosTraje[prenda]
      if (conflicto) {
        items.push({ prenda: ETIQUETA_PRENDA_TRAJE[prenda], conflicto })
      }
    }
    return items
  }, [esVestidos, avisosDisponibilidad, conflictosTraje])

  const piezasPorTipo = useCallback(
    (tipo: TipoPieza) => inventario.filter((p) => p.tipo === tipo),
    [inventario],
  )

  const piezaPrecioReferencia = useMemo(() => {
    if (esVestidos) return piezaVestidoVinculada
    if (values.piezaSacoId) {
      return piezasTodas.find((p) => p.id === values.piezaSacoId)
    }
    const resueltas = resolverPiezasDesdeFormulario(
      piezasTodas,
      { color: values.color, marca: values.marca, talla: values.saco },
      { color: values.colorChaleco, marca: values.marcaChaleco, talla: values.chaleco },
      { color: values.colorPantalon, marca: values.marcaPantalon, talla: values.pantalon },
    )
    return resueltas.saco
  }, [esVestidos, piezaVestidoVinculada, piezasTodas, values])

  const precioDesdeInventario = useMemo(() => {
    const precio = calcularPrecioVestido(
      piezaPrecioReferencia,
      values.tipoOperacion,
      preciosReferencia,
    )
    return precio > 0 ? precio : 0
  }, [piezaPrecioReferencia, values.tipoOperacion, preciosReferencia])

  const aplicarPrecioOperacion = useCallback(
    (pieza: Pieza | undefined, tipo: TipoOperacion) => {
      if (esPrecioOperacionManual(tipo)) return
      const precio = calcularPrecioVestido(pieza, tipo, preciosReferencia)
      if (precio <= 0) return
      setValues((prev) => {
        if (prev.precio === String(precio)) return prev
        return { ...prev, precio: String(precio) }
      })
    },
    [preciosReferencia],
  )

  const multaAuto = useMemo(
    () => calcularMultaAutomatica(values.fechaSalida),
    [values.fechaSalida],
  )

  const totalCobrar = useMemo(() => {
    const precio = Number(values.precio) || 0
    return precio + multaAuto
  }, [values.precio, multaAuto])

  const esEfectivo = esPagoEfectivo(values.metodoPago)

  const pagoCalculado = useMemo(() => {
    if (!esEfectivo) return null
    return calcularPagoEfectivo(
      totalCobrar,
      Number(values.pagoPesos) || 0,
      Number(values.pagoDlls) || 0,
    )
  }, [esEfectivo, totalCobrar, values.pagoPesos, values.pagoDlls])

  const restante = useMemo(() => {
    if (esEfectivo) {
      return calcularRestanteEfectivo(
        Number(values.precio) || 0,
        multaAuto,
        Number(values.pagoPesos) || 0,
        Number(values.pagoDlls) || 0,
      )
    }
    const precio = Number(values.precio) || 0
    const anticipo = Number(values.anticipo) || 0
    return calcularRestante(precio, anticipo, multaAuto, values.metodoPago)
  }, [
    esEfectivo,
    values.precio,
    values.anticipo,
    values.pagoPesos,
    values.pagoDlls,
    multaAuto,
    values.metodoPago,
  ])

  useEffect(() => {
    if (!open) return
    if (renta) {
      setValues(rentaAFormulario(renta, esVestidos))
    } else {
      const base = crearFormularioVacio()
      if (esVestidos) {
        setValues({ ...base, categoriaVestido: categoriaPerfil })
      } else {
        setValues(base)
      }
    }
    setError(null)
    setConfirmProximaSemana(false)
  }, [open, renta, esVestidos, categoriaPerfil])

  useEffect(() => {
    if (!open) return
    if (esPatrocinio(values.tipoOperacion)) {
      setValues((prev) => (prev.precio === '0' ? prev : { ...prev, precio: '0' }))
      return
    }
    if (esPrecioOperacionManual(values.tipoOperacion)) return
    aplicarPrecioOperacion(piezaPrecioReferencia, values.tipoOperacion)
  }, [open, piezaPrecioReferencia, values.tipoOperacion, aplicarPrecioOperacion])

  const cambiarTipoOperacion = (tipo: TipoOperacion) => {
    setValues((prev) => ({
      ...prev,
      tipoOperacion: tipo,
      tipoEntrega: tipo === 'premier' ? 'premier' : 'recoger',
      ...(esPatrocinio(tipo)
        ? { precio: '0', anticipo: '', pagoPesos: '', pagoDlls: '' }
        : esPrecioOperacionManual(tipo)
          ? { precio: '' }
          : {}),
    }))
  }

  const set = (key: keyof RentaFormValues) => (v: string) => {
    const valor = CAMPOS_MAYUS.includes(key) ? aMayusculas(v) : v
    setValues((prev) => {
      const next = { ...prev, [key]: valor }
      if (key === 'fechaSalida') {
        const semana = semanaKeyDesdeFechaSalida(valor)
        if (semana) next.semanaInicio = semana
        const nuevaFechaRegreso = sumarDiasFecha(valor, DIAS_RENTA_DEFAULT)
        if (nuevaFechaRegreso) next.fechaRegreso = nuevaFechaRegreso
      }
      if (key === 'color') next.piezaSacoId = ''
      if (key === 'marca') next.piezaSacoId = ''
      if (key === 'colorChaleco') next.piezaChalecoId = ''
      if (key === 'marcaChaleco') next.piezaChalecoId = ''
      if (key === 'colorPantalon') next.piezaPantalonId = ''
      if (key === 'marcaPantalon') next.piezaPantalonId = ''
      if (key === 'saco') next.piezaSacoId = ''
      if (key === 'chaleco') next.piezaChalecoId = ''
      if (key === 'pantalon') next.piezaPantalonId = ''
      if (key === 'categoriaVestido') {
        next.piezaSacoId = ''
        next.color = ''
        next.marca = ''
        next.chaleco = ''
        next.saco = ''
        next.pantalon = ''
      }
      return next
    })
  }

  const aplicarPieza = useCallback(
    (pieza: Pieza) => {
      setValues((prev) => {
        const next = { ...prev, ...valoresDesdePieza(pieza, usarCodigosNuevosPantalon) }
        let ref: Pieza | undefined
        if (esVestidos) {
          ref = pieza
        } else if (pieza.tipo === 'saco') {
          ref = pieza
        } else if (next.piezaSacoId) {
          ref = piezasTodas.find((p) => p.id === next.piezaSacoId)
        }
        if (!esPrecioOperacionManual(next.tipoOperacion)) {
          const precio = calcularPrecioVestido(ref, next.tipoOperacion, preciosReferencia)
          if (precio > 0) next.precio = String(precio)
        }
        return next
      })
    },
    [esVestidos, piezasTodas, preciosReferencia, usarCodigosNuevosPantalon],
  )

  const ejecutarGuardado = async () => {
    setGuardando(true)
    setError(null)
    try {
      await onSubmit(
        formularioAPayload(
          values,
          piezasTodas,
          usuario?.lineaNegocio ?? 'trajes',
          usarCodigosNuevosPantalon,
        ),
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la renta.')
    } finally {
      setGuardando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.cliente.trim()) {
      setError('El nombre del cliente es obligatorio.')
      return
    }
    if (esVestidos && !esEdicion && !piezaVestidoVinculada) {
      setError('Selecciona un vestido del inventario usando las sugerencias de color o marca.')
      return
    }
    if (esVestidos && !esPatrocinio(values.tipoOperacion) && !(Number(values.precio) > 0)) {
      setError('El precio debe venir del inventario. Elige tipo renta, premier, venta o sesión de fotos.')
      return
    }
    if (!values.fechaRegreso) {
      setError('La fecha de regreso es obligatoria.')
      return
    }

    const errorDisponibilidad = esVestidos
      ? validarPiezasParaRenta(
          piezasVinculadasIds,
          values.fechaSalida,
          rentasActivas,
          renta?.id,
        )
      : validarTrajeParaRenta(
          values,
          piezasTodas,
          values.fechaSalida,
          rentasActivas,
          renta?.id,
        )
    if (errorDisponibilidad) {
      setError(errorDisponibilidad)
      return
    }

    if (
      !esVestidos &&
      itemsAvisoDisponibilidad.some(
        (i) => i.conflicto.estado === 'reservada_semana_siguiente',
      )
    ) {
      setConfirmProximaSemana(true)
      return
    }

    await ejecutarGuardado()
  }

  const handleConfirmProximaSemana = async () => {
    setConfirmProximaSemana(false)
    await ejecutarGuardado()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? `Editar Renta #${renta?.id}` : 'Agregar Nueva Renta'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">
            Cliente y fechas
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Cliente *" value={values.cliente} onChange={set('cliente')} required />
            <Field label="Teléfono" value={values.telefono} onChange={set('telefono')} placeholder="6531234567" />
            <Field label="Dirección" value={values.direccion} onChange={set('direccion')} />
            <Field label="Empleado" value={values.empleado} onChange={set('empleado')} />
            <Field
              label="Fecha salida *"
              value={values.fechaSalida}
              onChange={set('fechaSalida')}
              placeholder="dd/mm/aaaa"
              required
            />
            <Field
              label="Fecha regreso *"
              value={values.fechaRegreso}
              onChange={set('fechaRegreso')}
              placeholder="dd/mm/aaaa"
              required
              hint={`Por defecto ${DIAS_RENTA_DEFAULT} días después`}
            />
            <Field label="Horario" type="time" value={values.horario} onChange={set('horario')} />
            <Field label="Ajustes" value={values.ajustes} onChange={set('ajustes')} placeholder="Ej. subir mangas, ensanchar cintura" />
            <Field label="Detalles" value={values.detalles} onChange={set('detalles')} />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            La multa se calcula sola (${getMultaPorDia()}/día) si no regresa antes del plazo de 3 días.
          </p>
        </section>

        <section>
          <SelectorTipoOperacion
            value={values.tipoOperacion}
            pieza={piezaPrecioReferencia}
            preciosReferencia={preciosReferencia}
            esVestidos={esVestidos}
            onChange={cambiarTipoOperacion}
          />
          <p className="mt-2 text-xs text-gray-500">
            Semana asignada: <span className="font-medium">{values.semanaInicio}</span>
          </p>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">Pagos</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Precio $ MXN"
              value={esPatrocinio(values.tipoOperacion) ? '0' : values.precio}
              onChange={set('precio')}
              readOnly={esPatrocinio(values.tipoOperacion)}
              hint={
                esPatrocinio(values.tipoOperacion)
                  ? 'Gratis — patrocinio'
                  : precioDesdeInventario
                    ? `Sugerido desde inventario (${etiquetaTipoOperacionVestido(values.tipoOperacion)}) — editable`
                    : esPrecioOperacionManual(values.tipoOperacion)
                      ? 'Ingresa el precio manualmente'
                      : undefined
              }
              placeholder="1400"
            />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Método de pago
              </span>
              <select
                className="input-field"
                value={values.metodoPago}
                onChange={(e) => set('metodoPago')(e.target.value as MetodoPago)}
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            {!esEfectivo && (
              <Field
                label="Anticipo $ MXN"
                value={values.anticipo}
                onChange={set('anticipo')}
                placeholder="0"
              />
            )}
            <Field
              label="Restante"
              value={restante ? fmtMontoConDlls(restante) : '—'}
              readOnly
              hint={
                esEfectivo
                  ? `Tipo de cambio ${getTipoCambioMxUsd()} MXN/USD`
                  : 'Precio − anticipo'
              }
            />
          </div>

          {esEfectivo && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Efectivo recibido $ MXN"
                  value={values.pagoPesos}
                  onChange={set('pagoPesos')}
                  placeholder="1000"
                />
                <Field
                  label="Efectivo recibido $ USD"
                  value={values.pagoDlls}
                  onChange={set('pagoDlls')}
                  placeholder="40"
                  hint={`TC ${getTipoCambioMxUsd()} — puedes combinar pesos y dólares`}
                />
              </div>

              {pagoCalculado && (pagoCalculado.recibidoMxn > 0 || pagoCalculado.recibidoUsd > 0) && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    pagoCalculado.feriaMxn > 0
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : pagoCalculado.faltaMxn > 0
                        ? 'border-blue-200 bg-blue-50 text-blue-900'
                        : 'border-green-200 bg-green-50 text-green-900'
                  }`}
                >
                  <p className="font-semibold">
                    Total a cobrar: {fmtMoneyMxn(pagoCalculado.totalCobrar)}
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
          )}
        </section>

        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">
            {esVestidos ? 'Vestido' : 'Prendas'}
          </h4>
          {itemsAvisoDisponibilidad.length > 0 && (
            <div className="mb-3">
              <BannerAvisoDisponibilidad items={itemsAvisoDisponibilidad} />
            </div>
          )}
          {esVestidos ? (
            <>
              <p className="mb-3 text-xs text-gray-500">
                Escribe color mero o marca y elige una sugerencia del desplegable. No se muestran
                piezas ocupadas la misma semana; si sale la próxima semana verás un aviso arriba.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                    Categoría
                  </span>
                  <input
                    type="text"
                    className="input-field bg-gray-50 uppercase"
                    value={etiquetaTipoVestido(values.categoriaVestido)}
                    readOnly
                    tabIndex={-1}
                  />
                </label>
                <InventarioAutocomplete
                  label="Color mero"
                  modo="color"
                  value={values.color}
                  tipo={values.categoriaVestido}
                  color={values.color}
                  marca={values.marca}
                  talla={values.pantalon}
                  codigo={values.saco}
                  piezas={inventario}
                  onChange={set('color')}
                  onElegirPieza={aplicarPieza}
                  sinRequisitoColor
                />
                <InventarioAutocomplete
                  label="Color vestido"
                  modo="colorVestido"
                  value={values.chaleco}
                  tipo={values.categoriaVestido}
                  color={values.color}
                  marca={values.marca}
                  talla={values.pantalon}
                  codigo={values.saco}
                  colorVestido={values.chaleco}
                  piezas={inventario}
                  onChange={set('chaleco')}
                  onElegirPieza={aplicarPieza}
                  sinRequisitoColor
                />
                <InventarioAutocomplete
                  label="Marca"
                  modo="marca"
                  value={values.marca}
                  tipo={values.categoriaVestido}
                  color={values.color}
                  marca={values.marca}
                  talla={values.pantalon}
                  codigo={values.saco}
                  piezas={inventario}
                  onChange={set('marca')}
                  onElegirPieza={aplicarPieza}
                  sinRequisitoColor
                />
                <InventarioAutocomplete
                  label="Código"
                  modo="codigo"
                  value={values.saco}
                  tipo={values.categoriaVestido}
                  color={values.color}
                  marca={values.marca}
                  talla={values.pantalon}
                  codigo={values.saco}
                  piezas={inventario}
                  onChange={set('saco')}
                  onElegirPieza={aplicarPieza}
                  sinRequisitoColor
                />
                <InventarioAutocomplete
                  label="Talla"
                  modo="talla"
                  value={values.pantalon}
                  tipo={values.categoriaVestido}
                  color={values.color}
                  marca={values.marca}
                  talla={values.pantalon}
                  codigo={values.saco}
                  piezas={inventario}
                  onChange={set('pantalon')}
                  onElegirPieza={aplicarPieza}
                  sinRequisitoColor
                />
                <Field
                  label="Accesorios"
                  value={values.accesorio}
                  onChange={set('accesorio')}
                  placeholder="VELO, TOCADO, CADENA…"
                  hint="Texto libre: velo, tocado, joyería, etc."
                />
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-xs text-gray-500">
                Cada prenda (saco, chaleco, pantalón) se elige por separado. No se sugieren piezas
                ocupadas la misma semana; si alguna sale la próxima semana verás un aviso arriba.
              </p>
              <div className="space-y-3">
                <FilaPieza
                  titulo="Saco"
                  color={values.color}
                  marca={values.marca}
                  talla={values.saco}
                  tipo="saco"
                  piezas={piezasPorTipo('saco')}
                  onColor={set('color')}
                  onMarca={set('marca')}
                  onTalla={set('saco')}
                  onElegirPieza={aplicarPieza}
                />
                <FilaPieza
                  titulo="Chaleco"
                  color={values.colorChaleco}
                  marca={values.marcaChaleco}
                  talla={values.chaleco}
                  tipo="chaleco"
                  piezas={piezasPorTipo('chaleco')}
                  onColor={set('colorChaleco')}
                  onMarca={set('marcaChaleco')}
                  onTalla={set('chaleco')}
                  onElegirPieza={aplicarPieza}
                />
                <FilaPieza
                  titulo="Pantalón"
                  color={values.colorPantalon}
                  marca={values.marcaPantalon}
                  talla={values.pantalon}
                  tipo="pantalon"
                  piezas={piezasPorTipo('pantalon')}
                  onColor={set('colorPantalon')}
                  onMarca={set('marcaPantalon')}
                  onTalla={set('pantalon')}
                  onElegirPieza={aplicarPieza}
                  usarCodigosNuevosPantalon={usarCodigosNuevosPantalon}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Camisa" value={values.camisa} onChange={set('camisa')} />
                <Field label="Corbata / Moño" value={values.corbataMono} onChange={set('corbataMono')} />
                <Field label="Cinto" value={values.cinto} onChange={set('cinto')} />
                <Field label="Accesorio" value={values.accesorio} onChange={set('accesorio')} />
              </div>
            </>
          )}
        </section>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar renta'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmProximaSemana}
        onClose={() => setConfirmProximaSemana(false)}
        onConfirm={handleConfirmProximaSemana}
        title="¿Confirmar renta con semana cercana?"
        description="Hay piezas con otra renta la semana siguiente. ¿Deseas guardar de todos modos?"
        confirmLabel="Sí, guardar renta"
        cancelLabel="Revisar piezas"
        variant="warning"
        confirming={guardando}
      >
        <ListaAvisosDisponibilidad items={itemsAvisoDisponibilidad} />
      </ConfirmDialog>
    </Modal>
  )
}

/** @deprecated usar RentaFormModal */
export const NuevaRentaModal = RentaFormModal
