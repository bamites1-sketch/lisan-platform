import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminApi } from '../../services/api'
import { useToast } from '../ui/Toast'
import {
  Modal, ConfirmDialog, Field, ActivePill,
  SearchBar, SectionHeader, RowActions, EmptyState, Th, Td
} from './AdminShared'
import { timeAgo } from '../../lib/utils'

// The backend schema only has ADMIN users — role differentiation is at the User.role level.
// The "adminRole" concept (SUPER_ADMIN / CONTENT_ADMIN / VIEWER) is a frontend-only UI grouping
// stored in the profile's adminRole field when creating via the admin API.
// We map it through the profile on load.

type AdminRole = 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'VIEWER'

interface AdminUser {
  id: string           // User.id
  email: string
  firstName: string
  lastName: string
  role: AdminRole
  active: boolean
  createdAt: string
}

const ROLES: AdminRole[] = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN:   '🔑 Super Admin',
  CONTENT_ADMIN: '📚 Content Admin',
  VIEWER:        '👁️ Viewer',
}
const ROLE_DESC: Record<AdminRole, string> = {
  SUPER_ADMIN:   'Full access: users, content, analytics, settings',
  CONTENT_ADMIN: 'Manage passages, questions, vocabulary and lessons',
  VIEWER:        'Read-only access to analytics and reports',
}
const ROLE_COLORS: Record<AdminRole, string> = {
  SUPER_ADMIN:   'bg-red-100 text-red-700',
  CONTENT_ADMIN: 'bg-brand-100 text-brand-700',
  VIEWER:        'bg-gray-100 text-gray-600',
}

const BLANK = { firstName: '', lastName: '', email: '', role: 'VIEWER' as AdminRole, password: '' }

function AdminForm({ value, onChange, errors, isSelf }: {
  value: typeof BLANK
  onChange: (k: string, v: string | boolean) => void
  errors: Record<string, string>
  isSelf?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required error={errors.firstName}>
          <input value={value.firstName} onChange={e => onChange('firstName', e.target.value)}
            className="input-field" placeholder="Admin" />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <input value={value.lastName} onChange={e => onChange('lastName', e.target.value)}
            className="input-field" placeholder="User" />
        </Field>
      </div>

      <Field label="Email" required error={errors.email}>
        <input type="email" value={value.email} onChange={e => onChange('email', e.target.value)}
          className="input-field" placeholder="admin@example.com" />
      </Field>

      <Field label="Initial Password" error={errors.password} hint="Leave blank to auto-generate a secure temporary password">
        <input type="password" value={value.password} onChange={e => onChange('password', e.target.value)}
          className="input-field" placeholder="Leave blank to auto-generate" autoComplete="new-password" />
      </Field>

      <Field label="Role" required hint="Controls what this admin can access">
        <div className="space-y-2 mt-1">
          {ROLES.map(r => (
            <label key={r} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              value.role === r ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
            } ${isSelf && r !== 'SUPER_ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input type="radio" name="role" value={r} checked={value.role === r}
                onChange={() => !isSelf && onChange('role', r)}
                disabled={isSelf && r !== 'SUPER_ADMIN'}
                className="mt-0.5 w-4 h-4 accent-brand-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{ROLE_LABELS[r]}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ROLE_DESC[r]}</p>
              </div>
            </label>
          ))}
        </div>
      </Field>

      {isSelf && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          ⚠️ You cannot demote or deactivate your own admin account.
        </div>
      )}
    </div>
  )
}

export default function AdminsTab() {
  const { user } = useAuth()
  const toast = useToast()

  const [rows, setRows]             = useState<AdminUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [addOpen, setAddOpen]       = useState(false)
  const [deleteTarget, setDelete]   = useState<AdminUser | null>(null)
  const [form, setForm]             = useState<typeof BLANK>(BLANK)
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [saving, setSaving]         = useState(false)
  const [tempPassword, setTempPass] = useState<string | null>(null)

  const selfId = user?.id ?? ''

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await adminApi.users()
      // Filter to ADMIN-role users only and shape them
      const admins: AdminUser[] = (data as unknown as Record<string, unknown>[])
        .filter((u) => u.role === 'ADMIN')
        .map((u) => {
          const profile = (u.profile ?? {}) as Record<string, unknown>
          return {
            id:        u.id as string,
            email:     u.email as string,
            firstName: (profile.firstName as string) ?? '',
            lastName:  (profile.lastName  as string) ?? '',
            role:      ((profile.adminRole as AdminRole) ?? 'SUPER_ADMIN'),
            active:    true,
            createdAt: u.createdAt as string,
          }
        })
      setRows(admins)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setField = (k: string, v: string | boolean) => {
    setForm(p => ({ ...p, [k]: v }))
    if (typeof v === 'string' && errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lisan_token')}`,
        },
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          role: 'ADMIN',
          ...(form.password ? { password: form.password } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create admin')

      if (json.temporaryPassword) {
        setTempPass(json.temporaryPassword)
      }
      await load()
      setAddOpen(false)
      setForm(BLANK)
      toast.success('Admin added', `${form.firstName} ${form.lastName} added.`)
    } catch (err) {
      toast.error('Failed', err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (a: AdminUser) => {
    if (a.id === selfId) { toast.error('Cannot delete yourself'); return }
    try {
      await adminApi.deleteUser(a.id)
      await load()
      toast.success('Admin removed', `${a.firstName} ${a.lastName} removed.`)
    } catch (err) {
      toast.error('Failed', err instanceof Error ? err.message : 'Error')
    }
    setDelete(null)
  }

  const filtered = useMemo(() => rows.filter(a =>
    search === '' || `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  ), [rows, search])

  return (
    <>
      <div className="space-y-5">
        <SectionHeader title="Admin Users" count={rows.length}
          subtitle="Manage platform administrators and their permissions"
          onAdd={() => { setForm(BLANK); setErrors({}); setTempPass(null); setAddOpen(true) }}
          addLabel="+ Add Admin" />

        {/* Permission matrix */}
        <div className="card bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Role Permission Matrix</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Permission</th>
                  {ROLES.map(r => (
                    <th key={r} className="py-2 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[r]}`}>{ROLE_LABELS[r]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Manage Students & Users', true, false, false],
                  ['Manage Content',          true, true,  false],
                  ['View Analytics',          true, true,  true ],
                  ['Platform Settings',       true, false, false],
                  ['Add/Remove Admins',       true, false, false],
                ].map(([label, ...perms]) => (
                  <tr key={String(label)}>
                    <td className="py-2 pr-4 text-gray-600">{label as string}</td>
                    {perms.map((p, i) => (
                      <td key={i} className="py-2 px-3 text-center">
                        {p ? <span className="text-success-600">✓</span> : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search admins…" />

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && loadError && (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="font-semibold text-gray-700 mb-1">Could not load admins</p>
            <p className="text-sm text-gray-400">{loadError}</p>
            <button onClick={load} className="btn-secondary mt-4 text-sm">Retry</button>
          </div>
        )}

        {!loading && !loadError && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <Th>Admin</Th>
                    <Th>Role</Th>
                    <Th className="hidden md:table-cell">Joined</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors group">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">
                            {a.firstName[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-800 whitespace-nowrap">{a.firstName} {a.lastName}</p>
                              {a.id === selfId && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">You</span>}
                            </div>
                            <p className="text-xs text-gray-400">{a.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[a.role]}`}>
                          {ROLE_LABELS[a.role]}
                        </span>
                      </Td>
                      <Td className="hidden md:table-cell text-xs text-gray-500">
                        {timeAgo(a.createdAt)}
                      </Td>
                      <Td><ActivePill active={a.active} /></Td>
                      <Td>
                        <RowActions
                          onDelete={a.id !== selfId ? () => setDelete(a) : undefined}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <EmptyState title="No admins found"
                onAdd={() => { setForm(BLANK); setErrors({}); setAddOpen(true) }}
                action="+ Add Admin" />
            )}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {filtered.length} admin{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Temporary password display */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">🔑 Temporary Password</h3>
            <p className="text-sm text-gray-600 mb-3">
              Copy and share this password with the new admin. It will not be shown again.
            </p>
            <div className="p-3 bg-gray-100 rounded-xl font-mono text-sm text-gray-900 mb-4 select-all">
              {tempPassword}
            </div>
            <button onClick={() => setTempPass(null)} className="btn-primary w-full">I've copied it</button>
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Admin User" size="md">
        <AdminForm value={form} onChange={setField} errors={errors} />
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setAddOpen(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Add Admin'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDelete(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Remove Admin?" confirmLabel="Remove Admin"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? They will lose all platform access immediately.`}
      />
    </>
  )
}
