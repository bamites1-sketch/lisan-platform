import { useState, useCallback, createContext, useContext } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void
  showToast: (message: string, type: ToastType) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = (id: string) => setToasts(p => p.filter(t => t.id !== id))

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`
    setToasts(p => [...p, { id, type, title, message }])
    setTimeout(() => remove(id), 3500)
  }, [])

  const success = useCallback((t: string, m?: string) => toast('success', t, m), [toast])
  const error   = useCallback((t: string, m?: string) => toast('error',   t, m), [toast])
  const warning = useCallback((t: string, m?: string) => toast('warning', t, m), [toast])
  const info    = useCallback((t: string, m?: string) => toast('info',    t, m), [toast])
  const showToast = useCallback((message: string, type: ToastType) => toast(type, message), [toast])

  const icons: Record<ToastType, string> = {
    success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
  }
  const styles: Record<ToastType, string> = {
    success: 'border-success-300 bg-success-50',
    error:   'border-danger-300  bg-danger-50',
    warning: 'border-warning-300 bg-warning-50',
    info:    'border-brand-300   bg-brand-50',
  }
  const titleStyles: Record<ToastType, string> = {
    success: 'text-success-800',
    error:   'text-danger-800',
    warning: 'text-warning-800',
    info:    'text-brand-800',
  }

  return (
    <ToastContext.Provider value={{ toast, showToast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-in transition-all ${styles[t.type]}`}
          >
            <span className="text-base mt-0.5 flex-shrink-0">{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${titleStyles[t.type]}`}>{t.title}</p>
              {t.message && <p className="text-xs text-gray-600 mt-0.5 leading-snug">{t.message}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 text-xs ml-1 flex-shrink-0">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
