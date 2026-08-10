import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LAST_ACTIVITY_KEY,
  SESSION_INACTIVITY_MS,
  SESSION_WARNING_MS,
} from '../config/sessionConfig'

function leerUltimaActividad(): number {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function guardarUltimaActividad(ts = Date.now()) {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(ts))
}

function msInactivo(): number {
  return Date.now() - leerUltimaActividad()
}

export function useSessionInactivity(enabled: boolean, onLogout: () => void | Promise<void>) {
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const logoutRef = useRef(onLogout)
  logoutRef.current = onLogout

  const registrarActividad = useCallback(() => {
    guardarUltimaActividad()
    setMostrarAviso(false)
  }, [])

  const extenderSesion = useCallback(() => {
    registrarActividad()
  }, [registrarActividad])

  useEffect(() => {
    if (!enabled) return

    registrarActividad()

    const eventos: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    let ultimoRegistro = 0
    const onActividad = () => {
      const ahora = Date.now()
      if (ahora - ultimoRegistro < 30_000) return
      ultimoRegistro = ahora
      registrarActividad()
    }

    for (const evento of eventos) {
      window.addEventListener(evento, onActividad, { passive: true })
    }

    const intervalo = window.setInterval(() => {
      const inactivo = msInactivo()
      if (inactivo >= SESSION_INACTIVITY_MS) {
        void logoutRef.current()
        return
      }
      setMostrarAviso(inactivo >= SESSION_INACTIVITY_MS - SESSION_WARNING_MS)
    }, 30_000)

    return () => {
      for (const evento of eventos) {
        window.removeEventListener(evento, onActividad)
      }
      window.clearInterval(intervalo)
    }
  }, [enabled, registrarActividad])

  return { mostrarAviso, extenderSesion, minutosRestantes: Math.ceil(SESSION_WARNING_MS / 60_000) }
}
