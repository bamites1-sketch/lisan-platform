import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { useToast } from '../ui/Toast'
import { Modal, ConfirmDialog, Field, EmptyState } from './AdminShared'

const BLANK = {
  contentType: 'passage' as 'passage' | 'lesson',
  contentId: '', grade: 'GRADE_6', note: '', dueDate: '', assignedBy: 'Admin',
}

interface ContentItem { id: string; title: string; grade: string; difficulty?: string; skillArea?: string }

// ─── AssignForm ───────────────────────────────────────────────────────────────
// Defined at module level so React never remounts it on parent re-renders.
function AssignForm({ form, errors, onChange, passages, lessons, contentLoading }: {
  form: typeof BLANK
  errors: Record<string, string>
  onChange: (k: string, v: string) => void
  passages: ContentItem[]
  lessons: ContentItem[]
  contentLoading: boolean
}) {
  const contentOptions = [
    ...passages.map(p => ({ id: p.id, type: 'passage' as const })),
    ...lessons.map(l  => ({ id: l.id, type: 'lesson'  as const })),
  ]

  return (
    <div className="space-y-4">
      <Field label="Content" required error={errors.contentId} hint="Choose a passage or lesson to assign">
        {contentLoading ? (
          <div className="input-field flex items-center gap-2 text-gray-400 text-sm">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            Loading content…
          </div>
        ) : (
          <select value={form.contentId} onChange={e => {
            const opt = contentOptions.find(c => c.id === e.target.value)
            onChange('contentId', e.target.value)
            if (opt) onChange('contentType', opt.type)
          }} className="input-field">
            <option value="">— Select content —</option>
            <optgroup label="📖 Passages">
              {passages.length === 0
                ? <option disabled>No passages available</option>
                : passages.map(p => <option key={p.id} value={p.id}>{p.title} · Grade {p.grade?.replace('GRADE_','') ?? '?'} · {p.difficulty}</option>)
              }
            </optgroup>
            <optgroup label="🎓 Lessons">
              {lessons.length === 0
                ? <option disabled>No lessons available</option>
                : lessons.map(l => <option key={l.id} value={l.id}>{l.title} · Grade {l.grade?.replace('GRADE_','') ?? '?'} · {l.skillArea}</option>)
              }
            </optgroup>
          </select>
        )}
      </Field>

      <Field label="Assign to Grade" required hint="Students of this grade will see this content">
        <select value={form.grade} onChange={e => onChange('grade', e.target.value)} className="input-field">
          <option value="ALL">🌍 All Grades</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={`GRADE_${i+1}`}>Grade {i+1}</option>
          ))}
        </select>
      </Field>

      <Field label="Note to Students" hint="Optional instruction shown to students">
        <input value={form.note} onChange={e => onChange('note', e.target.value)} className="input-field"
          placeholder="Focus on identifying the main idea…" />
      </Field>

      <Field label="Due Date" hint="Optional">
        <input type="date" value={form.dueDate} onChange={e => onChange('dueDate', e.target.value)} className="input-field" />
      </Field>

      {/* Preview: who will be notified */}
      {form.grade && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-800">
          <p className="font-semibold mb-1">📣 Who will be notified</p>
          <p>{form.grade === 'ALL' ? 'All students will receive a notification.' : `All students in Grade ${form.grade.replace('GRADE_','')} will receive a notification.`}</p>
        </div>
      )}
    </div>
  )
}

// ─── AssignmentsTab ───────────────────────────────────────────────────────────
export default function AssignmentsTab() {
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows]   = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [passages, setPassages] = useState<ContentItem[]>([])
  const [lessons, setLessons]   = useState<ContentItem[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [addOpen, setAdd] = useState(false)
  const [editTgt, setEdt] = useState<Record<string, unknown> | null>(null)
  const [delTgt, setDel]  = useState<Record<string, unknown> | null>(null)
  const [form, setForm]   = useState(BLANK)
  const [errors, setErrs] = useState<Record<string, string>>({})
  const [saving, setSave] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All Types')
  const [filterGrade, setFilterGrade] = useState('All Grades')
  const [filterStatus, setFilterStatus] = useState('All Statuses')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const refresh = () => {
    setLoading(true)
    adminApi.assignments().then(d => { setRows(d as Record<string, unknown>[]); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => {
    refresh()
    setContentLoading(true)
    Promise.all([
      adminApi.passages().catch(() => []),
      adminApi.lessons().catch(() => []),
    ]).then(([p, l]) => {
      setPassages((p as ContentItem[]) ?? [])
      setLessons((l as ContentItem[]) ?? [])
    }).finally(() => setContentLoading(false))
  }, [])

  const f = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.contentId) e.contentId = 'Please select content'
    setErrs(e); return Object.keys(e).length === 0
  }

  const fireNotifications = (_grade: string, _contentTitle: string) => {
    // Notifications handled server-side via POST /api/admin/assignments
  }

  const handleSave = async (isEdit: boolean) => {
    if (!validate()) return
    setSave(true)

    const allContent = [...passages, ...lessons]
    const content = allContent.find(c => c.id === form.contentId)
    const contentTitle = content?.title ?? form.contentId

    try {
      if (isEdit && editTgt) {
        await adminApi.updateAssignment(editTgt.id as string, form)
        toast.success('Assignment updated', `"${contentTitle}" updated.`)
      } else {
        await adminApi.createAssignment(form)
        fireNotifications(form.grade, contentTitle)
        toast.success('Content assigned!', `"${contentTitle}" sent to ${form.grade === 'ALL' ? 'all grades' : 'Grade ' + form.grade.replace('GRADE_','')}.`)
      }
      refresh()
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Error')
    }
    setSave(false)
    setAdd(false); setEdt(null); setForm(BLANK)
  }

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteAssignment(id)
      refresh()
      toast.success('Assignment deleted')
    } catch { toast.error('Failed') }
  }

  const filtered = useMemo(() => rows.filter((a: Record<string, unknown>) => {
    const allContent = [...passages, ...lessons]
    const content = allContent.find(c => c.id === a.contentId)
    
    const matchesSearch = !searchQuery || 
      content?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.note as string)?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'All Types' || 
      (filterType === 'Reading Passage' && a.contentType === 'passage') ||
      (filterType === 'Lesson' && a.contentType === 'lesson')
    
    const matchesGrade = filterGrade === 'All Grades' || a.grade === filterGrade || a.grade === 'ALL'
    
    const matchesStatus = filterStatus === 'All Statuses' || 
      (filterStatus === 'Active' && (a.status === 'active' || !a.status)) ||
      (filterStatus === 'Scheduled' && a.status === 'pending') ||
      (filterStatus === 'Draft' && a.status === 'completed')
    
    return matchesSearch && matchesType && matchesGrade && matchesStatus
  }), [rows, searchQuery, filterType, filterGrade, filterStatus, passages, lessons])

  const stats = useMemo(() => {
    const total = rows.length
    const assigned = rows.filter(a => (a.status === 'active' || !a.status)).length
    const pending = rows.filter(a => a.status === 'pending').length
    const completed = rows.filter(a => a.status === 'completed').length
    return { total, assigned, pending, completed }
  }, [rows])

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg sm:text-xl">📋</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Assignments</h1>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 sm:line-clamp-none">Create, manage and assign reading lessons, passages, quizzes and activities to your students</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm"
            >
              <span className="text-base sm:text-lg">+</span>
              Create Assignment
            </button>
            <button 
              onClick={() => { setForm(BLANK); setErrs({}); setAdd(true) }}
              className="btn-secondary flex-1 sm:flex-none justify-center flex items-center gap-1.5 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm"
            >
              Quick Assign
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center text-base sm:text-xl shrink-0">
                <span>📝</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">Total Assignments</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center text-base sm:text-xl shrink-0">
                <span>👥</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.assigned}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">Assigned to Students</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-base sm:text-xl shrink-0">
                <span>⏰</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-base sm:text-xl shrink-0">
                <span>✅</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3.5 sm:p-4">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {/* Search */}
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search assignments, lessons, or students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs sm:text-sm"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-2 sm:px-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs sm:text-sm min-w-0"
              >
                <option>All Types</option>
                <option>Reading Passage</option>
                <option>Lesson</option>
              </select>

              <select 
                value={filterGrade} 
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-2.5 py-2 sm:px-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs sm:text-sm min-w-0"
              >
                <option>All Grades</option>
                <option value="ALL">All Students</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={`GRADE_${i+1}`}>Grade {i+1}</option>
                ))}
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-2 sm:px-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs sm:text-sm min-w-0"
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Scheduled</option>
                <option>Draft</option>
              </select>

              <button 
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('All Types')
                  setFilterGrade('All Grades')
                  setFilterStatus('All Statuses')
                }}
                className="px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-600 font-medium col-span-2 sm:col-span-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Assignments Container: Cards on mobile, Table on desktop */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          
          {/* ── MOBILE CARD VIEW (md:hidden) ── */}
          <div className="md:hidden">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filtered.map((a: Record<string, unknown>) => {
                  const allContent = [...passages, ...lessons]
                  const content = allContent.find(c => c.id === a.contentId)
                  const status = (a.status as string) || 'active'

                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'pending': return 'text-yellow-700 bg-yellow-50 border border-yellow-200/60'
                      case 'completed': return 'text-gray-600 bg-gray-50 border border-gray-200/60'
                      case 'active':
                      default: return 'text-green-700 bg-green-50 border border-green-200/60'
                    }
                  }

                  const getTypeColor = (type: string) => {
                    return type === 'passage' ? 'text-brand-700 bg-brand-50' : 'text-emerald-700 bg-emerald-50'
                  }

                  return (
                    <div key={a.id as string} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 ${getTypeColor(a.contentType as string)}`}>
                            {a.contentType === 'passage' ? '📖' : '🎓'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 leading-snug">
                              {content?.title ?? (a.contentId as string)}
                            </p>
                            {(a.note as string) && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 italic">
                                "{a.note as string}"
                              </p>
                            )}
                          </div>
                        </div>

                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${getStatusColor(status)}`}>
                          <span className="w-1.5 h-1.5 bg-current rounded-full mr-1"></span>
                          {status === 'pending' ? 'Scheduled' : status === 'completed' ? 'Draft' : 'Active'}
                        </span>
                      </div>

                      {/* Info tags row */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 pt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${getTypeColor(a.contentType as string)}`}>
                          {a.contentType === 'passage' ? 'Passage' : 'Lesson'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                          <span>👥</span> {a.grade === 'ALL' ? 'All Grades' : 'Grade ' + (a.grade as string).replace('GRADE_', '')}
                        </span>
                        {Boolean(a.dueDate) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-medium">
                            <span>📅</span> {new Date(a.dueDate as string).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Action buttons with generous touch targets */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-50">
                        <button 
                          onClick={() => {
                            setForm({ 
                              contentType: a.contentType as 'passage' | 'lesson', 
                              contentId: a.contentId as string, 
                              grade: a.grade as string, 
                              note: (a.note as string) ?? '', 
                              dueDate: (a.dueDate as string) ?? '', 
                              assignedBy: 'Admin' 
                            })
                            setErrs({}); setEdt(a)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          onClick={() => setDel(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-10 px-4">
                <EmptyState 
                  emoji="📋" 
                  title="No assignments found"
                  subtitle="Create an assignment or adjust your filters"
                  action="+ Create Assignment" 
                  onAction={() => { setForm(BLANK); setErrs({}); setAdd(true) }} 
                />
              </div>
            )}
          </div>

          {/* ── DESKTOP TABLE VIEW (hidden md:block) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade Level</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((a: Record<string, unknown>) => {
                    const allContent = [...passages, ...lessons]
                    const content = allContent.find(c => c.id === a.contentId)
                    const status = (a.status as string) || 'active'

                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'pending': return 'text-yellow-600 bg-yellow-50'
                        case 'completed': return 'text-gray-600 bg-gray-50'
                        case 'active':
                        default: return 'text-green-600 bg-green-50'
                      }
                    }

                    const getTypeColor = (type: string) => {
                      return type === 'passage' ? 'text-brand-600 bg-brand-50' : 'text-green-600 bg-green-50'
                    }

                    return (
                      <tr key={a.id as string} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${getTypeColor(a.contentType as string)}`}>
                              {a.contentType === 'passage' ? '📖' : '🎓'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                {content?.title ?? (a.contentId as string)}
                              </p>
                              {(a.note as string) && (
                                <p className="text-xs text-gray-500 line-clamp-1">{a.note as string}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(a.contentType as string)}`}>
                            {a.contentType === 'passage' ? 'Reading Passage' : 'Lesson'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {a.grade === 'ALL' ? 'All Grades' : 'Grade ' + (a.grade as string).replace('GRADE_', '')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">👥</span>
                            <span className="text-sm text-gray-900">
                              {a.grade === 'ALL' ? 'All Students' : `Grade ${(a.grade as string).replace('GRADE_', '')} Students`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">📅</span>
                            <span className="text-sm text-gray-900">
                              {a.dueDate ? new Date(a.dueDate as string).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5"></span>
                            {status === 'pending' ? 'Scheduled' : status === 'completed' ? 'Draft' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setForm({ 
                                  contentType: a.contentType as 'passage' | 'lesson', 
                                  contentId: a.contentId as string, 
                                  grade: a.grade as string, 
                                  note: (a.note as string) ?? '', 
                                  dueDate: (a.dueDate as string) ?? '', 
                                  assignedBy: 'Admin' 
                                })
                                setErrs({}); setEdt(a)
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => setDel(a)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <EmptyState 
                        emoji="📋" 
                        title="No assignments found"
                        subtitle="Create an assignment or adjust your filters"
                        action="+ Create Assignment" 
                        onAction={() => { setForm(BLANK); setErrs({}); setAdd(true) }} 
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {Math.min(filtered.length, 7)} of {filtered.length} assignments
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  ←
                </button>
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-brand-600 text-white rounded-lg font-bold">1</span>
                <button className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-50 rounded-lg">2</button>
                <button className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-50 rounded-lg">3</button>
                <span className="px-1 text-xs text-gray-400">...</span>
                <button className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAdd(false)} title="Create Assignment" size="md">
        <AssignForm form={form} errors={errors} onChange={f} passages={passages} lessons={lessons} contentLoading={contentLoading} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setAdd(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating…' : '📣 Create Assignment'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editTgt} onClose={() => setEdt(null)} title="Edit Assignment" size="md">
        <AssignForm form={form} errors={errors} onChange={f} passages={passages} lessons={lessons} contentLoading={contentLoading} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setEdt(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!delTgt} onClose={() => setDel(null)}
        onConfirm={() => { if (delTgt) handleDelete(delTgt.id as string) }}
        title="Delete Assignment?" confirmLabel="Delete"
        message="Students will no longer see this content in their dashboard." />

      {/* Full Assignment Creation Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full sm:min-h-screen items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowCreateForm(false)} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-6xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-lg sm:text-xl">📋</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Create Assignment</h2>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Assign readings, passages, quizzes or practice activities</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-3.5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Left Column - Form */}
                  <div className="lg:col-span-2 space-y-5 sm:space-y-6">
                    {/* Step 1: Basic Information */}
                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Basic Information</h3>
                      </div>
                      <div className="space-y-3.5 sm:space-y-4">
                        <div>
                          <label className="label">Title *</label>
                          <input
                            type="text"
                            value={form.contentId}
                            onChange={(e) => f('contentId', e.target.value)}
                            placeholder="e.g. Reading Practice Set 1"
                            className="input-field"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="label">Assignment Type *</label>
                            <select
                              value={form.contentType}
                              onChange={(e) => f('contentType', e.target.value)}
                              className="input-field"
                            >
                              <option value="passage">Reading Passage</option>
                              <option value="lesson">Lesson</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">Grade Level *</label>
                            <select
                              value={form.grade}
                              onChange={(e) => f('grade', e.target.value)}
                              className="input-field"
                            >
                              <option value="ALL">All Grades</option>
                              {Array.from({length: 12}, (_, i) => (
                                <option key={i} value={`GRADE_${i + 1}`}>Grade {i + 1}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="label">Description</label>
                          <textarea
                            value={form.note}
                            onChange={(e) => f('note', e.target.value)}
                            placeholder="Add a brief description (optional)"
                            rows={3}
                            className="input-field resize-none"
                          />
                        </div>
                        <div>
                          <label className="label">Due Date</label>
                          <input
                            type="date"
                            value={form.dueDate}
                            onChange={(e) => f('dueDate', e.target.value)}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Select Content */}
                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Select Content</h3>
                      </div>

                      {contentLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(form.contentType === 'passage' ? passages : lessons).slice(0, 5).map((content) => (
                            <label key={content.id} className="flex items-center gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-xl hover:bg-white cursor-pointer transition-colors">
                              <input
                                type="radio"
                                name="selectedContent"
                                value={content.id}
                                checked={form.contentId === content.id}
                                onChange={() => f('contentId', content.id)}
                                className="w-4 h-4 text-brand-600"
                              />
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200/80 rounded-lg flex items-center justify-center shrink-0">
                                  <span className="text-base sm:text-lg">{form.contentType === 'passage' ? '📖' : '🎓'}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{content.title}</p>
                                  <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                                    {content.grade?.replace('GRADE_', 'Grade ') || 'All Grades'} • 
                                    {content.difficulty || content.skillArea || 'Medium'}
                                  </p>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Summary */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 sticky top-6">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Assignment Summary</h3>
                      <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">Title</p>
                          <p className="font-semibold text-gray-900 mt-0.5">{form.contentId || 'Untitled Assignment'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Type</p>
                          <p className="font-semibold text-gray-900 mt-0.5">{form.contentType === 'passage' ? 'Reading Passage' : 'Lesson'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Grade Level</p>
                          <p className="font-semibold text-gray-900 mt-0.5">{form.grade === 'ALL' ? 'All Grades' : form.grade.replace('GRADE_', 'Grade ')}</p>
                        </div>
                        {form.dueDate && (
                          <div>
                            <p className="text-gray-400 text-xs">Due Date</p>
                            <p className="font-semibold text-gray-900 mt-0.5">{new Date(form.dueDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {form.note && (
                          <div>
                            <p className="text-gray-400 text-xs">Description</p>
                            <p className="font-medium text-xs text-gray-700 mt-0.5">{form.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50">
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary w-full sm:w-auto text-center justify-center py-2.5 px-5"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleSave(false)
                    setShowCreateForm(false)
                  }}
                  disabled={saving || !form.contentId}
                  className="btn-primary w-full sm:w-auto text-center justify-center py-2.5 px-5 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
