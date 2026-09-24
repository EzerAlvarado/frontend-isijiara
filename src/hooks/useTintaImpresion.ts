import { useEffect, useState } from 'react'
import {
  aplicarTintaImpresion,
  guardarTintaImpresion,
  leerTintaImpresion,
  suscribirTintaImpresion,
  type TintaImpresion,
} from '../utils/tintaImpresion'

export function useTintaImpresion() {
  const [tinta, setTinta] = useState<TintaImpresion>(() => leerTintaImpresion())

  useEffect(() => {
    aplicarTintaImpresion(leerTintaImpresion())
    return suscribirTintaImpresion(setTinta)
  }, [])

  return {
    tinta,
    setTinta: guardarTintaImpresion,
    esAzul: tinta === 'azul',
  }
}
