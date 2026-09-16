import { useState, useMemo } from 'react'
import { adminApi, type ApiStudent, type ApiTeacher, type ApiParent } from '../../services/api'
import { useAdminStudents, useAdminTeachers, useAdminParents } from '../../hooks/useAdminData'
import { useToast } from '../ui/Toast'
import {
  Modal, ConfirmDialog, Field, GradeSelect, StatusPill,
  SearchBar, SectionHeader, RowActions, EmptyState, Th, Td
} from './AdminShared'
import { timeAgo } from '../../lib/utils'

type ReadinessStatus = 'READY' | 'DEVELOPING' | 'NEEDS_SUPPORT' | 'NOT_ASSESSED'

const BLANK = {
  firstName: '', lastName: '', email: '', phone: '',
  grade: 'GRADE_6', teacherId: '', parentId: '',
}

function StudentForm({ value, onChange, errors, teachers, parents }: {
  value: typeof BLANK
  onChange: (k: string, v: string) => void
  errors: Record<string, string>
  teachers: ApiTeacher[]
  parents: ApiParent[]
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required error={errors.firstName}>
          <input value={value.firstName} onChange={e => onChange('firstName', e.target.value)} className="input-field" placeholder="Sara" />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <input value={value.lastName} onChange={e => onChange('lastName', e.target.value)} className="input-field" placeholder="Tadesse" />
        </Field>
      </div>
      <Field label="Email" required error={errors.email}>
        <input type="email" value={value.email} onChange={e => onChange('email', e.target.value)} className="input-field" placeholder="sara@email.com" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" hint="Optional">
          <input value={value.phone ?? ''} onChange={e => onChange('phone', e.target.value)} className="input-field" placeholder="+251 9â€¦" />
        </Field>
        <Field label="Grade" required>
          <GradeSelect value={value.grade} onChange={v => onChange('grade', v)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Assigned Teacher">
          <select value={value.teacherId ?? ''} onChange={e => onChange('teacherId', e.target.value)} className="input-field">
            <option value="">â€” None â€”</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
        </Field>
        <Field label="Parent / Guardian">
          <select value={value.parentId ?? ''} onChange={e => onChange('parentId', e.target.value)} className="input-field">
            <option value="">â€” None â€”</option>
            {parents.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  )
}

// â”€â”€â”€ Students Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function StudentsTab() {
  const toast = useToast()
  const { data: apiStudents, loading, error, reload } = useAdminStudents()
  const { data: apiTeachers } = useAdminTeachers()
  const { data: apiParents }  = useAdminParents()

  const rows     = apiStudents ?? []
  const teachers = apiTeachers ?? []
  const parents  = apiParents  ?? []

  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('ALL')
  const [filterGrade, setGrade]   = useState('ALL')
  const [sortBy, setSort]         = useState<'name' | 'score' | 'grade'>('name')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [addOpen, setAddOpen]     = useState(false)
  const [deleteTarget, setDelete] = useState<ApiStudent | null>(null)
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
      await adminApi.createUser({ ...form, role: 'STUDENT', grade: form.grade })
      reload()
      setAddOpen(false)
      setForm(BLANK)
      toast.success('Student added', `${form.firstName} ${form.lastName} has been added.`)
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Could not add student')
    }
    setSaving(false)
  }

  const handleDelete = async (s: ApiStudent) => {
    try {
      await adminApi.deleteUser(s.userId)
      reload()
      toast.success('Student removed', `${s.firstName} ${s.lastName} has been removed.`)
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Could not remove student')
    }
  }

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSort(col); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let list = rows.filter(s => {
      const matchSearch = search === '' || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'ALL' || (s.status ?? 'NOT_ASSESSED') === filterStatus
      const matchGrade  = filterGrade  === 'ALL' || s.grade === filterGrade
      return matchSearch && matchStatus && matchGrade
    })
    list = [...list].sort((a, b) => {
      let av: string | number, bv: string | number
      if (sortBy === 'score') { av = a.score ?? 0; bv = b.score ?? 0 }
      else if (sortBy === 'grade') { av = a.grade; bv = b.grade }
      else { av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}` }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return list
  }, [rows, search, filterStatus, filterGrade, sortBy, sortDir])

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? <span className="ml-1">{sortDir === 'asc' ? 'â†‘' : 'â†“'}</span> : null

  const grades = ['ALL','GRADE_1','GRADE_2','GRADE_3','GRADE_4','GRADE_5','GRADE_6','GRADE_7','GRADE_8','GRADE_9','GRADE_10','GRADE_11','GRADE_12']

  return (
    <>
      <div className="space-y-5">
        <SectionHeader title="Students" count={rows.length}
          subtitle="Manage all registered students" onAdd={() => { setForm(BLANK); setErrors({}); setAddOpen(true) }} addLabel="+ Add Student" />

        {error && <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-700 text-sm">âš ï¸ {error}</div>}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by nameâ€¦" />
          <select value={filterStatus} onChange={e => setFilter(e.target.value)} className="input-field w-auto text-sm">
            <option value="ALL">All Status</option>
            <option value="READY">ðŸŸ¢ Ready</option>
            <option value="DEVELOPING">ðŸŸ¡ Developing</option>
            <option value="NEEDS_SUPPORT">ðŸ”´ Needs Support</option>
            <option value="NOT_ASSESSED">âšª Not Assessed</option>
          </select>
          <select value={filterGrade} onChange={e => setGrade(e.target.value)} className="input-field w-auto text-sm">
            {grades.map(g => <option key={g} value={g}>{g === 'ALL' ? 'All Grades' : 'Grade ' + g.replace('GRADE_','')}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <Th><span className="cursor-pointer" onClick={() => toggleSort('name')}>Student <SortIcon col="name" /></span></Th>
                    <Th><span className="cursor-pointer" onClick={() => toggleSort('grade')}>Grade <SortIcon col="grade" /></span></Th>
                    <Th><span className="cursor-pointer" onClick={() => toggleSort('score')}>Score <SortIcon col="score" /></span></Th>
                    <Th>Status</Th>
                    <Th className="hidden lg:table-cell">Teacher</Th>
                    <Th className="hidden md:table-cell">XP</Th>
                    <Th className="hidden xl:table-cell">Last Active</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(s => {
                    const status = (s.status ?? 'NOT_ASSESSED') as ReadinessStatus
                    const teacher = teachers.find(t => t.id === s.teacherId)
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              status === 'READY' ? 'bg-success-100 text-success-700' :
                              status === 'DEVELOPING' ? 'bg-warning-100 text-warning-700' :
                              status === 'NOT_ASSESSED' ? 'bg-gray-100 text-gray-500' :
                              'bg-danger-100 text-danger-700'
                            }`}>{s.firstName[0]}</div>
                            <div>
                              <p className="font-semibold text-gray-800">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-gray-400">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</p>
                            </div>
                          </div>
                        </Td>
                        <Td><span className="text-sm text-gray-600">Gr {s.grade.replace('GRADE_','')}</span></Td>
                        <Td>
                          <span className={`text-base font-bold ${(s.score ?? 0) >= 75 ? 'text-success-600' : (s.score ?? 0) >= 60 ? 'text-warning-600' : (s.score ?? 0) > 0 ? 'text-danger-600' : 'text-gray-400'}`}>
                            {(s.score ?? 0) > 0 ? s.score : 'â€”'}
                          </span>
                        </Td>
                        <Td><StatusPill status={status} /></Td>
                        <Td className="hidden lg:table-cell text-xs text-gray-500">
                          {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'â€”'}
                        </Td>
                        <Td className="hidden md:table-cell">
                          <span className="text-xs font-semibold text-amber-700">âš¡ {s.xp}</span>
                        </Td>
                        <Td className="hidden xl:table-cell text-xs text-gray-400">
                          {timeAgo(s.lastActiveAt)}
                        </Td>
                        <Td>
                          <RowActions onDelete={() => setDelete(s)} />
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <EmptyState title="No students found" subtitle="Try adjusting your filters" onAdd={() => setAddOpen(true)} action="+ Add Student" />
          )}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} of {rows.length} students
          </div>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Student" size="md">
        <StudentForm value={form} onChange={setField} errors={errors} teachers={teachers} parents={parents} />
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setAddOpen(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Savingâ€¦' : 'Add Student'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDelete(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Remove Student?"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This cannot be undone.`}
        confirmLabel="Remove Student"
      />
    </>
  )
}

