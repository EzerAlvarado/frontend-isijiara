import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  headerClass?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
}

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const

export function Modal({
  open,
  onClose,
  title,
  headerClass = 'bg-brand-600',
  size = 'md',
  children,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${SIZE_CLASS[size]} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl`}>
        {title && (
          <div className={`flex items-center justify-between rounded-t-xl px-4 py-3 ${headerClass}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
