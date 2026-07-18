import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'warning' | 'danger' | 'default'
  children?: ReactNode
  confirming?: boolean
}

const VARIANT_STYLES = {
  warning: {
    header: 'bg-gradient-to-r from-amber-500 to-amber-600',
    icon: 'bg-amber-100 text-amber-700',
    confirm: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  danger: {
    header: 'bg-gradient-to-r from-red-600 to-red-700',
    icon: 'bg-red-100 text-red-700',
    confirm: 'btn-danger',
  },
  default: {
    header: 'bg-brand-600',
    icon: 'bg-brand-50 text-brand-700',
    confirm: 'btn-primary',
  },
} as const

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  children,
  confirming = false,
}: ConfirmDialogProps) {
  if (!open) return null

  const styles = VARIANT_STYLES[variant]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className={`px-5 py-4 ${styles.header}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-base font-semibold leading-snug text-white"
              >
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-white/90">{description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {children}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={confirming}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className={
                variant === 'danger'
                  ? 'btn-danger'
                  : variant === 'warning'
                    ? `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${styles.confirm}`
                    : 'btn-primary disabled:opacity-60'
              }
            >
              {confirming ? 'Guardando…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
