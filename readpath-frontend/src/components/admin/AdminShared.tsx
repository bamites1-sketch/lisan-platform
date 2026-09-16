import { useEffect, useRef } from 'react'

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
export function Modal({
  open, onClose, title, size = 'md', children,
}: {
  open: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-6 px-4 pb-4 overflow-y-auto">
      <div
        ref={ref}
        className={`w-full ${widths[size]} bg-white rounded-3xl shadow-2xl animate-in`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >✕</button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-in p-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">{danger ? '🗑️' : '⚠️'}</div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-all ${
              danger ? 'bg-danger-600 hover:bg-danger-700 text-white' : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Form field wrapper ────────────────────────────────────────────────────────
export function Field({
  label, required, error, hint, children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ─── Grade select ──────────────────────────────────────────────────────────────
export function GradeSelect({
  value, onChange, className = '',
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`input-field ${className}`}>
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i} value={`GRADE_${i + 1}`}>Grade {i + 1}</option>
      ))}
    </select>
  )
}

// ─── Difficulty select ────────────────────────────────────────────────────────
export function DifficultySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input-field">
      {['EASY', 'MEDIUM', 'HARD', 'ADVANCED'].map(d => (
        <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
      ))}
    </select>
  )
}

// ─── Skill area select ────────────────────────────────────────────────────────
export function SkillSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input-field">
      <option value="PHONEMIC_AWARENESS">🔊 Phonemic Awareness</option>
      <option value="PHONICS_DECODING">🔤 Phonics &amp; Decoding</option>
      <option value="FLUENCY">🎤 Reading Fluency</option>
      <option value="VOCABULARY">📚 Vocabulary</option>
      <option value="COMPREHENSION">🧠 Comprehension</option>
    </select>
  )
}

// ─── Status pill ──────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    READY:          'bg-success-100 text-success-700',
    DEVELOPING:     'bg-warning-100 text-warning-700',
    NEEDS_SUPPORT:  'bg-danger-100  text-danger-700',
    NOT_ASSESSED:   'bg-gray-100    text-gray-500',
  }
  const labels: Record<string, string> = {
    READY: '🟢 Ready', DEVELOPING: '🟡 Developing',
    NEEDS_SUPPORT: '🔴 Needs Support', NOT_ASSESSED: '⚪ Not Assessed',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ─── Active pill ──────────────────────────────────────────────────────────────
export function ActivePill({ active }: { active: boolean }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${active ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
      {active ? '● Active' : '○ Inactive'}
    </span>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ emoji = '🔍', title, subtitle, action, onAction, onAdd }: {
  emoji?: string; title: string; subtitle?: string; action?: string; onAction?: () => void; onAdd?: () => void
}) {
  const handler = onAction ?? onAdd
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">{emoji}</p>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {action && handler && (
        <button onClick={handler} className="mt-4 btn-primary text-sm">{action}</button>
      )}
    </div>
  )
}

// ─── Table header cell ────────────────────────────────────────────────────────
export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${className}`}>
      {children}
    </th>
  )
}

// ─── Table data cell ──────────────────────────────────────────────────────────
export function Td({ children, className = '', onClick }: { children?: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <td className={`px-4 py-3.5 ${className}`} onClick={onClick}>{children}</td>
  )
}

// ─── Row action buttons (show on hover) ───────────────────────────────────────
export function RowActions({ onEdit, onDelete, onView }: {
  onEdit?: () => void; onDelete?: () => void; onView?: () => void
}) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onView && (
        <button onClick={onView} className="text-xs text-gray-500 hover:text-brand-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
          View
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="text-xs text-danger-600 hover:text-danger-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-danger-50 transition-colors">
          Delete
        </button>
      )}
    </div>
  )
}

// ─── Search + filter bar ──────────────────────────────────────────────────────
export function SearchBar({
  value, onChange, placeholder, rightSlot,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="flex gap-3 items-center">
      <div className="relative flex-1">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'Search…'}
          className="input-field pl-9"
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>
      {rightSlot}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({
  title, subtitle, count, onAdd, addLabel = '+ Add',
}: {
  title: string; subtitle?: string; count?: number; onAdd?: () => void; addLabel?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{count}</span>
          )}
        </h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {onAdd && (
        <button onClick={onAdd} className="btn-primary text-sm py-2.5 px-4">
          {addLabel}
        </button>
      )}
    </div>
  )
}
