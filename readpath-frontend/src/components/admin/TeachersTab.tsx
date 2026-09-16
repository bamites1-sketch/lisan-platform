import { useState, useMemo } from 'react'
import { adminApi, type ApiTeacher } from '../../services/api'
import { useAdminTeachers } from '../../hooks/useAdminData'
import { useToast } from '../ui/Toast'
import {
  Modal, ConfirmDialog, Field,
  SearchBar, SectionHeader, RowActions, EmptyState, Th, Td
} from './AdminShared'

const BLANK = { firstName: '', lastName: '', email: '', phone: '' }

function TeacherForm({ value, onChange, errors }: {
  value: typeof BLANK
  onChange: (k: string, v: string) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required error={errors.firstName}>
          <input value={value.firstName} onChange={e => onChange('firstName', e.target.value)} className="input-field" placeholder="Tigist" />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <input value={value.lastName} onChange={e => onChange('lastName', e.target.value)} className="input-field" placeholder="Bekele" />
        </Field>
      </div>
      <Field label="Email" required error={errors.email}>
        <input type="email" value={value.email} onChange={e => onChange('email', e.target.value)} className="input-field" placeholder="teacher@email.com" />
      </Field>
      <Field label="Phone" hint="Optional">
        <input value={value.phone} onChange={e => onChange('phone', e.target.value)} className="input-field" placeholder="+251 9…" />
      </Field>
    </div>
  )
}

export default function TeachersTab() {
  const toast = useToast()
  const { data, loading, error, reload } = useAdminTeachers()
  const rows = data ?? []

  const [search, setSearch]       = useState('')
  const [addOpen, setAddOpen]     = useState(false)
  const [deleteTarget, setDelete] = useState<ApiTeacher | null>(null)
  const [form, setForm]           = useState<typeof BLANK>(BLANK)
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [saving, setSaving]       = useState(false)

  const setField = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await adminApi.createUser({ ...form, role: 'TEACHER' })
      reload()
      setAddOpen(false)
      setForm(BLANK)
      toast.success('Teacher added', `${form.firstName} ${form.lastName} added.`)
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Could not add teacher')
    }
    setSaving(false)
  }

  const handleDelete = async (t: ApiTeacher) => {
    try {
      await adminApi.deleteUser(t.userId)
      reload()
      toast.success('Teacher removed', `${t.firstName} ${t.lastName} removed.`)
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Could not remove teacher')
    }
  }

  const filtered = useMemo(() =>
    rows.filter(t => search === '' || `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()))
  , [rows, search])

  return (
    <>
      <div className="space-y-5">
        <SectionHeader title="Teachers" count={rows.length}
          subtitle="Manage teacher accounts" onAdd={() => { setForm(BLANK); setErrors({}); setAddOpen(true) }} addLabel="+ Add Teacher" />

        {error && <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-700 text-sm">⚠️ {error}</div>}

        <SearchBar value={search} onChange={setSearch} placeholder="Search by name…" />

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <Th>Teacher</Th>
                    <Th>Students</Th>
                    <Th className="hidden md:table-cell">Joined</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">{t.firstName[0]}</div>
                          <div>
                            <p className="font-semibold text-gray-800">{t.firstName} {t.lastName}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-sm font-bold text-gray-700">👥 {t.students?.length ?? 0}</span>
                      </Td>
                      <Td className="hidden md:table-cell text-xs text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </Td>
                      <Td><RowActions onDelete={() => setDelete(t)} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length === 0 && <EmptyState title="No teachers found" onAdd={() => setAddOpen(true)} action="+ Add Teacher" />}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">{filtered.length} of {rows.length} teachers</div>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Teacher" size="md">
        <TeacherForm value={form} onChange={setField} errors={errors} />
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setAddOpen(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Add Teacher'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDelete(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Remove Teacher?" confirmLabel="Remove Teacher"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? Students will be unassigned.`} />
    </>
  )
}
