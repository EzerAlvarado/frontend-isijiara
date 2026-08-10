const MINUTOS_ENV = Number(import.meta.env.VITE_SESSION_INACTIVITY_MINUTES)

/** Tiempo sin actividad antes de cerrar sesión (por defecto 8 horas). */
export const SESSION_INACTIVITY_MS =
  Number.isFinite(MINUTOS_ENV) && MINUTOS_ENV > 0
    ? MINUTOS_ENV * 60 * 1000
    : 8 * 60 * 60 * 1000

/** Aviso previo al cierre automático. */
export const SESSION_WARNING_MS = 5 * 60 * 1000

export const LAST_ACTIVITY_KEY = 'isijara_last_activity'
