import { useState, useMemo, useEffect, useRef } from 'react'
import { adminApi, type ApiLesson, type ApiStudent } from '../../services/api'
import { useToast } from '../ui/Toast'
import { timeAgo } from '../../lib/utils'
import { ConfirmDialog } from './AdminShared'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LessonAssignment {
  id: string
  contentType: string
  contentId: string
  grade: string
  assignedAt: string
  assignedBy: string
  dueDate?: string
  note?: string
  status: string
}

type AssignMode = 'individual' | 'multiple' | 'grade' | 'reading_level' | 'skill_group'

interface FormState {
  lessonId:     string
  assignMode:   AssignMode
  studentIds:   string[]
  grade:        string
  readingLevel: string
  skillGroup:   string
  startDate:    string
  dueDate:      string
  priority:     'Normal' | 'High' | 'Urgent'
  required:     boolean
  instructions: string
}

const BLANK: FormState = {
  lessonId:     '',
  assignMode:   'grade',    // grade is the safest default — always has targets
  studentIds:   [],
  grade:        'ALL',      // default to ALL so it always matches regardless of DB grades
  readingLevel: '',
  skillGroup:   '',
  startDate:    '',
  dueDate:      '',
  priority:     'Normal',
  required:     true,
  instructions: '',
}

const SKILL_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  PHONEMIC_AWARENESS: { label: 'Phonemic Awareness', icon: '🔊', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  PHONICS_DECODING:   { label: 'Phonics & Decoding', icon: '🔤', color: 'text-brand-700',   bg: 'bg-brand-50',   border: 'border-brand-200'   },
  FLUENCY:            { label: 'Fluency',            icon: '🎤', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200'  },
  VOCABULARY:         { label: 'Vocabulary',         icon: '📚', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
  COMPREHENSION:      { label: 'Comprehension',      icon: '🧠', color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200'   },
}

// ─── Small shared components ──────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const palette  = ['bg-brand-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']
  const color    = palette[name.charCodeAt(0) % palette.length]
  const sz       = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none`}>
      {initials}
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </div>
  )
}

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <StepBadge n={step} />
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

// ─── Lesson searchable picker ─────────────────────────────────────────────────
function LessonPicker({ lessons, value, onChange, loading }: {
  lessons: ApiLesson[]
  value:   string
  onChange: (id: string) => void
  loading: boolean
}) {
  const [search, setSearch] = useState('')
  const [open,   setOpen]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() =>
    search.trim()
      ? lessons.filter(l =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.skillArea.toLowerCase().includes(search.toLowerCase()) ||
          (l.subskill ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : lessons
  , [lessons, search])

  const grouped = useMemo(() =>
    Object.entries(SKILL_META)
      .map(([skill, meta]) => ({
        skill, meta,
        items: filtered.filter(l => l.skillArea === skill).sort((a, b) => a.order - b.order),
      }))
      .filter(g => g.items.length > 0)
  , [filtered])

  const selected = lessons.find(l => l.id === value)
  const selMeta  = selected ? SKILL_META[selected.skillArea] : null

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Select Lesson <span className="text-red-500">*</span>
      </label>

      <div ref={ref} className="relative">
        {/* Trigger */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-brand-400 transition-colors"
          onClick={() => { if (!loading) setOpen(o => !o) }}
        >
          {/* search icon */}
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search and select a lesson..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
          {loading && (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin flex-shrink-0" />
          )}
          {/* chevron */}
          <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown list */}
        {open && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-gray-400">Loading lessons…</p>
            ) : grouped.length === 0 && lessons.length === 0 ? (
              <div className="p-5 text-center space-y-2">
                <p className="text-2xl">🎓</p>
                <p className="text-sm font-semibold text-gray-700">No lessons in the database yet</p>
                <p className="text-xs text-gray-400">Go to Content → Lessons and add some lessons first, then come back to assign them.</p>
              </div>
            ) : grouped.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-400">No lessons match your search</p>
            ) : (
              grouped.map(({ skill, meta, items }) => (
                <div key={skill}>
                  <div className={`px-3 py-1.5 text-xs font-semibold ${meta.color} ${meta.bg} sticky top-0 z-10`}>
                    {meta.icon} {meta.label}
                  </div>
                  {items.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => { onChange(l.id); setOpen(false); setSearch('') }}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors ${value === l.id ? 'bg-brand-50' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${meta.bg}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{l.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Grade {l.grade.replace('GRADE_', '')} · Level {l.order} · {meta.label}
                          {l.subskill ? ` · ${l.subskill.replace(/_/g, ' ')}` : ''}
                        </p>
                      </div>
                      {value === l.id && (
                        <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full font-medium flex-shrink-0 self-center">
                          Selected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected lesson card */}
      {selected && selMeta && (
        <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${selMeta.border} ${selMeta.bg}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-white border ${selMeta.border}`}>
            {selMeta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${selMeta.color}`}>{selected.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Grade {selected.grade.replace('GRADE_', '')} · Level {selected.order} · {selMeta.label}
              {selected.subskill ? ` · ${selected.subskill.replace(/_/g, ' ')}` : ''}
            </p>
          </div>
          <span className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-full font-medium flex-shrink-0 self-center">
            Selected
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Student checkbox list ────────────────────────────────────────────────────
function StudentSelector({ students, selected, onToggle, loading }: {
  students:  ApiStudent[]
  selected:  string[]
  onToggle:  (id: string) => void
  loading:   boolean
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    search.trim()
      ? students.filter(s =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
        )
      : students
  , [students, search])

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Students <span className="text-red-500">*</span>
      </label>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Student rows */}
      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No students found</p>
        ) : (
          filtered.map(s => {
            const checked = selected.includes(s.id)
            const name    = `${s.firstName} ${s.lastName}`
            return (
              <label
                key={s.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(s.id)}
                  className="w-4 h-4 accent-brand-600 rounded flex-shrink-0"
                />
                <Avatar name={name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{name}</p>
                  <p className="text-xs text-gray-400">
                    Grade {s.grade.replace('GRADE_', '')} · Level {s.level}
                  </p>
                </div>
              </label>
            )
          })
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-brand-700 font-medium">
          <div className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {selected.length} student{selected.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}

// ─── Assignment Preview sidebar ───────────────────────────────────────────────
function AssignmentPreview({ form, lesson, students }: {
  form:     FormState
  lesson:   ApiLesson | undefined
  students: ApiStudent[]
}) {
  const meta = lesson ? SKILL_META[lesson.skillArea] : null

  const targetCount =
    (form.assignMode === 'individual' || form.assignMode === 'multiple')
      ? students.filter(s => form.studentIds.includes(s.id)).length
      : form.assignMode === 'grade'
        ? (form.grade === 'ALL' ? students.length : students.filter(s => s.grade === form.grade).length)
        : form.assignMode === 'reading_level' && form.readingLevel
          ? students.filter(s => String(s.level) === form.readingLevel).length
          : 0

  const rows = [
    { icon: '📖', label: 'Lesson',        value: lesson?.title ?? '—',                        color: meta?.color },
    { icon: '👥', label: 'Students',       value: targetCount > 0 ? `${targetCount} student${targetCount !== 1 ? 's' : ''}` : '—' },
    { icon: '🎓', label: 'School Grade',   value: form.assignMode === 'grade' ? (form.grade === 'ALL' ? 'All Grades' : `Grade ${form.grade.replace('GRADE_', '')}`) : lesson ? `Grade ${lesson.grade.replace('GRADE_', '')}` : '—' },
    { icon: '📊', label: 'Reading Level',  value: form.readingLevel ? `Level ${form.readingLevel}` : lesson ? `Level ${lesson.order}` : '—' },
    { icon: '📅', label: 'Due Date',       value: form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
    { icon: '⚡', label: 'Priority',       value: form.priority },
    { icon: '✅', label: 'Required',       value: form.required ? 'Yes' : 'No' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">Assignment Preview</h3>
      </div>

      {/* Detail rows */}
      <div className="px-5 py-4 space-y-3.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
              {row.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{row.label}</p>
              <p className={`text-sm font-semibold mt-0.5 ${row.color ?? 'text-gray-800'}`}>{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 flex-shrink-0 mt-0.5">💡</span>
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-0.5">How it works</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              The selected students will see this lesson in their assignments. They can complete
              it at their own pace before the due date.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Lesson page (the multi-step form) ─────────────────────────────────
function AssignLessonPage({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const toast = useToast()

  const [lessons,  setLessons]  = useState<ApiLesson[]>([])
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [loadingL, setLoadingL] = useState(true)
  const [loadingS, setLoadingS] = useState(true)
  const [saving,   setSaving]   = useState(false)

  const [form, setForm] = useState<FormState>(BLANK)

  useEffect(() => {
    adminApi.lessons()
      .then(d => setLessons(d))
      .catch(() => toast.error('Error', 'Could not load lessons'))
      .finally(() => setLoadingL(false))

    adminApi.students()
      .then(d => setStudents(d))
      .catch(() => {}) // students failing is non-fatal; grade mode still works
      .finally(() => setLoadingS(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const toggleStudent = (id: string) =>
    setForm(p => ({
      ...p,
      studentIds: p.studentIds.includes(id)
        ? p.studentIds.filter(s => s !== id)
        : [...p.studentIds, id],
    }))

  const selectedLesson = lessons.find(l => l.id === form.lessonId)

  // Which students will receive the lesson — used for counter + validation
  const targetStudents = useMemo(() => {
    if (form.assignMode === 'individual' || form.assignMode === 'multiple') {
      return students.filter(s => form.studentIds.includes(s.id))
    }
    if (form.assignMode === 'grade') {
      return students.filter(s => form.grade === 'ALL' || s.grade === form.grade)
    }
    if (form.assignMode === 'reading_level' && form.readingLevel) {
      return students.filter(s => String(s.level) === form.readingLevel)
    }
    if (form.assignMode === 'skill_group') {
      // skill_group → assign to ALL grades; no per-student filtering in backend
      return students
    }
    return []
  }, [form, students])

  // ── Core submit logic ────────────────────────────────────────────────────
  const handleAssign = async () => {
    // ── Validation ──────────────────────────────────────────────────────────
    if (!form.lessonId) {
      toast.error('Select a lesson', 'Please pick a lesson before assigning.')
      return
    }
    const needsStudents = form.assignMode === 'individual' || form.assignMode === 'multiple'
    if (needsStudents && form.studentIds.length === 0) {
      toast.error('No students selected', 'Please select at least one student.')
      return
    }
    if (form.assignMode === 'reading_level' && !form.readingLevel) {
      toast.error('Select a level', 'Please choose a reading level.')
      return
    }
    if (form.assignMode === 'skill_group' && !form.skillGroup) {
      toast.error('Select a skill group', 'Please choose a skill group.')
      return
    }

    setSaving(true)

    const note    = form.instructions.trim() || undefined
    const dueDate = form.dueDate             || undefined
    const payload = {
      contentType: 'lesson' as const,
      contentId:   form.lessonId,
      note,
      dueDate,
    }

    try {
      if (form.assignMode === 'grade') {
        // ── Grade mode: single API call, backend fans out notifications ──────
        await adminApi.createAssignment({ ...payload, grade: form.grade })

      } else if (form.assignMode === 'skill_group') {
        // ── Skill group: broadcast to all grades ──────────────────────────────
        await adminApi.createAssignment({ ...payload, grade: 'ALL' })

      } else {
        // ── Individual / multiple / reading_level ─────────────────────────────
        // The backend only supports grade-based targeting.
        // Strategy: derive unique grades from selected students, fire one
        // createAssignment per grade so the backend notifies each grade's students.
        const gradeSet = new Set(targetStudents.map(s => s.grade))

        if (gradeSet.size === 0) {
          // Fallback: if students didn't load or none match, assign to the
          // lesson's own grade so the action never silently fails.
          const fallbackGrade = selectedLesson?.grade ?? 'ALL'
          await adminApi.createAssignment({ ...payload, grade: fallbackGrade })
        } else {
          await Promise.all(
            Array.from(gradeSet).map(grade =>
              adminApi.createAssignment({ ...payload, grade })
            )
          )
        }
      }

      // ── Success ────────────────────────────────────────────────────────────
      const count = targetStudents.length || (form.assignMode === 'grade' && form.grade !== 'ALL'
        ? students.filter(s => s.grade === form.grade).length
        : students.length)

      toast.success(
        'Lesson assigned! 🎉',
        `"${selectedLesson?.title ?? 'Lesson'}" has been sent to ${count > 0 ? `${count} student${count !== 1 ? 's' : ''}` : 'students'}.`,
      )
      onDone()

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      toast.error('Assignment failed', msg)
    } finally {
      setSaving(false)
    }
  }

  const needsStudentPick = form.assignMode === 'individual' || form.assignMode === 'multiple'
  const canSubmit = !saving && !!form.lessonId && (!needsStudentPick || form.studentIds.length > 0)

  const ASSIGN_MODES: { id: AssignMode; label: string; icon: string }[] = [
    { id: 'individual',    label: 'Individual students', icon: '👤' },
    { id: 'multiple',      label: 'Multiple students',   icon: '👥' },
    { id: 'grade',         label: 'Grade',               icon: '🎓' },
    { id: 'reading_level', label: 'Reading level',       icon: '📊' },
    { id: 'skill_group',   label: 'Skill group',         icon: '⚡' },
  ]

  return (
    <div className="space-y-5">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Assignment Center
      </button>

      <div className="flex gap-6 items-start">
        {/* ── Left column: steps ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Page header */}
          <div className="flex items-center gap-4 pb-1">
            <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              📖
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assign Lesson</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Assign an existing lesson to students. Target individual students or groups
                based on grade, reading level, or skill.
              </p>
            </div>
          </div>

          {/* Step 1 — Lesson */}
          <SectionCard step={1} title="Lesson">
            <LessonPicker
              lessons={lessons}
              value={form.lessonId}
              onChange={id => set('lessonId', id)}
              loading={loadingL}
            />
          </SectionCard>

          {/* Step 2 — Assign To */}
          <SectionCard step={2} title="Assign To">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ASSIGN_MODES.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => set('assignMode', m.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.assignMode === m.id
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      <span>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual / Multiple → student checklist */}
              {(form.assignMode === 'individual' || form.assignMode === 'multiple') && (
                <StudentSelector
                  students={students}
                  selected={form.studentIds}
                  onToggle={toggleStudent}
                  loading={loadingS}
                />
              )}

              {/* Grade mode */}
              {form.assignMode === 'grade' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <select
                    value={form.grade}
                    onChange={e => set('grade', e.target.value)}
                    className="input-field"
                  >
                    <option value="ALL">🌍 All Grades</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={`GRADE_${i + 1}`}>Grade {i + 1}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">
                    {form.grade === 'ALL'
                      ? `${students.length} students across all grades`
                      : `${students.filter(s => s.grade === form.grade).length} students in Grade ${form.grade.replace('GRADE_', '')}`}
                  </p>
                </div>
              )}

              {/* Reading level mode */}
              {form.assignMode === 'reading_level' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Reading Level</label>
                  <select
                    value={form.readingLevel}
                    onChange={e => set('readingLevel', e.target.value)}
                    className="input-field"
                  >
                    <option value="">— Select level —</option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>Level {i + 1}</option>
                    ))}
                  </select>
                  {form.readingLevel && (
                    <p className="text-xs text-gray-400">
                      {students.filter(s => String(s.level) === form.readingLevel).length} students at Level {form.readingLevel}
                    </p>
                  )}
                </div>
              )}

              {/* Skill group mode */}
              {form.assignMode === 'skill_group' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Skill Group</label>
                  <select
                    value={form.skillGroup}
                    onChange={e => set('skillGroup', e.target.value)}
                    className="input-field"
                  >
                    <option value="">— Select skill group —</option>
                    {Object.entries(SKILL_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">
                    Assigns this lesson to all {students.length} students regardless of grade
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Step 3 — Assignment Settings */}
          <SectionCard step={3} title="Assignment Settings">
            <div className="grid grid-cols-2 gap-4">
              {/* Start date */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Start Date <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="input-field pl-9" />
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Due Date <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className="input-field pl-9" />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none ${
                    form.priority === 'Normal' ? 'bg-amber-400' :
                    form.priority === 'High'   ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                  <select value={form.priority} onChange={e => set('priority', e.target.value as FormState['priority'])} className="input-field pl-8">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Required toggle */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Required</label>
                <div className="flex items-center gap-3" style={{ height: 42 }}>
                  <button
                    type="button"
                    onClick={() => set('required', !form.required)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${
                      form.required ? 'bg-brand-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle required"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.required ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-700 font-medium">{form.required ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Step 4 — Instructions */}
          <SectionCard step={4} title="Instructions">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-500">
                  Instructions <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <span className="text-xs text-gray-400">{form.instructions.length}/500</span>
              </div>
              <textarea
                value={form.instructions}
                onChange={e => set('instructions', e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Add instructions for students..."
                className="input-field resize-none"
              />
            </div>
          </SectionCard>

          {/* Bottom action bar */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between">
            {/* Student count indicator */}
            <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
              <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {!form.lessonId
                ? 'Select a lesson above to continue'
                : needsStudentPick && form.studentIds.length === 0
                  ? 'Select at least one student above'
                  : targetStudents.length > 0
                    ? `${targetStudents.length} student${targetStudents.length !== 1 ? 's' : ''} will receive this lesson`
                    : 'Ready to assign to all matching students'}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={onBack} className="btn-secondary px-6">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!canSubmit}
                className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Assigning…
                  </>
                ) : (
                  <>
                    {/* Paper-plane send icon */}
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    Assign Lesson
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column: preview ── */}
        <div className="w-72 flex-shrink-0 hidden xl:block">
          <AssignmentPreview
            form={form}
            lesson={selectedLesson}
            students={students}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Assignment Center (list view — default) ──────────────────────────────────
export default function LessonAssignmentsTab() {
  const toast = useToast()

  const [view,        setView]    = useState<'list' | 'assign'>('list')
  const [assignments, setAssigns] = useState<LessonAssignment[]>([])
  const [lessons,     setLessons] = useState<ApiLesson[]>([])
  const [loading,     setLoading] = useState(true)
  const [delTgt,      setDelTgt]  = useState<LessonAssignment | null>(null)

  const refresh = () => {
    setLoading(true)
    Promise.all([
      adminApi.assignments().catch(() => []),
      adminApi.lessons().catch(() => []),
    ])
      .then(([raw, less]) => {
        setAssigns((raw as LessonAssignment[]).filter(a => a.contentType === 'lesson'))
        setLessons(less as ApiLesson[])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const handleDelete = async (a: LessonAssignment) => {
    try {
      await adminApi.deleteAssignment(a.id)
      toast.success('Assignment removed')
      refresh()
    } catch {
      toast.error('Failed', 'Could not remove assignment')
    }
    setDelTgt(null)
  }

  // Switch to assign page
  if (view === 'assign') {
    return (
      <AssignLessonPage
        onBack={() => setView('list')}
        onDone={() => { setView('list'); refresh() }}
      />
    )
  }

  // ── List view ──
  const statCards = [
    { label: 'Total Assigned', value: assignments.length,                                              icon: '📋', color: 'text-brand-600',  bg: 'bg-brand-50'  },
    { label: 'Active',         value: assignments.filter(a => a.status !== 'archived').length,         icon: '✅', color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'With Due Date',  value: assignments.filter(a => a.dueDate).length,                       icon: '📅', color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { label: 'Skill Areas',    value: new Set(assignments.map(a => lessons.find(l => l.id === a.contentId)?.skillArea).filter(Boolean)).size, icon: '🎯', color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assignment Center</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage lesson assignments for your students</p>
          </div>
          <button
            type="button"
            onClick={() => setView('assign')}
            className="btn-primary flex items-center gap-2 px-5"
          >
            <span>🎓</span> Assign Lesson
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">All Lesson Assignments</p>
          </div>

          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-3xl">🎓</div>
              <p className="font-semibold text-gray-700">No lesson assignments yet</p>
              <p className="text-sm text-gray-400 max-w-xs">
                Assign a lesson to a grade group and students will see it on their dashboard
              </p>
              <button type="button" onClick={() => setView('assign')} className="btn-primary mt-1 px-5">
                + Assign Lesson
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {assignments.map(a => {
                const lesson = lessons.find(l => l.id === a.contentId)
                const meta   = lesson ? SKILL_META[lesson.skillArea] : null
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 border ${
                      meta ? `${meta.bg} ${meta.border}` : 'bg-green-50 border-green-200'
                    }`}>
                      {meta?.icon ?? '🎓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{lesson?.title ?? a.contentId}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-500">
                        {meta && <span className={`font-medium ${meta.color}`}>{meta.label}</span>}
                        <span>·</span>
                        <span>👥 {a.grade === 'ALL' ? 'All grades' : 'Grade ' + a.grade.replace('GRADE_', '')}</span>
                        <span>· {timeAgo(a.assignedAt)}</span>
                        {a.dueDate && <span className="text-warning-600">· Due {new Date(a.dueDate).toLocaleDateString()}</span>}
                        {a.note && <span className="text-brand-600 italic">· "{a.note}"</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDelTgt(a)}
                      className="text-xs text-danger-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-danger-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!delTgt}
        onClose={() => setDelTgt(null)}
        onConfirm={() => delTgt && handleDelete(delTgt)}
        title="Remove Assignment?"
        confirmLabel="Remove"
        message={`Remove "${lessons.find(l => l.id === delTgt?.contentId)?.title ?? 'this lesson'}"? Students will no longer see it on their dashboard.`}
      />
    </>
  )
}
