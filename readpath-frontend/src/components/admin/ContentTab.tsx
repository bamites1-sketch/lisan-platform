import { useState, useMemo, useEffect } from 'react'
import { adminApi, type ApiPassage, type ApiQuestion, type ApiVocabulary, type ApiLesson } from '../../services/api'
import { useToast } from '../ui/Toast'
import {
  Modal, ConfirmDialog, Field, GradeSelect, DifficultySelect, SkillSelect,
  SearchBar, SectionHeader, RowActions, EmptyState, Th, Td
} from './AdminShared'

type ContentTab = 'lessons' | 'passages' | 'quizzes' | 'practice' | 'vocabulary' | 'assessments' | 'pdfs' | 'resources'
const GRADES = Array.from({ length: 12 }, (_, index) => ({ value: `GRADE_${index + 1}`, label: `Grade ${index + 1}` }))

const TAB_CONFIG: { id: ContentTab; label: string; icon: string }[] = [
  { id: 'lessons',     label: 'Lessons',     icon: '📘' },
  { id: 'passages',    label: 'Passages',    icon: '📖' },
  { id: 'quizzes',     label: 'Quizzes',     icon: '📝' },
  { id: 'practice',    label: 'Practice',    icon: '✏️' },
  { id: 'vocabulary',  label: 'Vocabulary',  icon: '📚' },
  { id: 'assessments', label: 'Assessments', icon: '📊' },
  { id: 'pdfs',        label: 'PDFs',        icon: '📄' },
  { id: 'resources',   label: 'Resources',   icon: '🗂️' },
]

const DIFF_COLORS: Record<string, string> = {
  EASY:     'bg-green-100 text-green-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  HARD:     'bg-red-100 text-red-700',
  ADVANCED: 'bg-purple-100 text-purple-700',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED:  'bg-orange-100 text-orange-700',
}

// ─── Helper: Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ─── Lesson Types & Component ─────────────────────────────────────────────────
type LessonFormValues = {
  skillArea: string
  subskill: string
  title: string
  grade: string
  difficulty: string
  explanation: string
  tips: string
  order: number
  examples?: string
  demonstrationSteps?: string
  guidedPractice?: string
  independentPractice?: string
  status?: string
  assignedGrades?: string[]
  requiredPlan?: string
}

function LessonForm({ form, errors, onChange }: {
  form: LessonFormValues
  errors: Record<string, string>
  onChange: (k: string, v: string | number | string[]) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="Title" required error={errors.title}>
        <input value={form.title} onChange={e => onChange('title', e.target.value)}
          className="input-field" placeholder="Using Context Clues" />
      </Field>
      
      <div className="grid grid-cols-2 gap-4">
        <Field label="Skill Area" required>
          <SkillSelect value={form.skillArea} onChange={v => onChange('skillArea', v)} />
        </Field>
        <Field label="Subskill" hint="e.g. context_clues">
          <input value={form.subskill} onChange={e => onChange('subskill', e.target.value)}
            className="input-field" placeholder="context_clues" />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Grade" required>
          <GradeSelect value={form.grade} onChange={v => onChange('grade', v)} />
        </Field>
        <Field label="Difficulty" required>
          <DifficultySelect value={form.difficulty} onChange={v => onChange('difficulty', v)} />
        </Field>
        <Field label="Order">
          <input type="number" value={form.order} onChange={e => onChange('order', Number(e.target.value))}
            className="input-field" placeholder="0" />
        </Field>
      </div>

      <Field label="Explanation" required error={errors.explanation}>
        <textarea value={form.explanation} onChange={e => onChange('explanation', e.target.value)}
          className="input-field resize-y" rows={4} placeholder="Explain the concept..." />
      </Field>

      <Field label="Tips" hint="Helpful tips for students">
        <textarea value={form.tips} onChange={e => onChange('tips', e.target.value)}
          className="input-field resize-y" rows={2} placeholder="Tips and strategies..." />
      </Field>

      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Publishing & Access Control</h4>
        
        <Field label="Status">
          <select value={form.status || 'DRAFT'} onChange={e => onChange('status', e.target.value)}
            className="input-field">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>

        <Field label="Required Plan" hint="Leave empty for all plans">
          <select value={form.requiredPlan || ''} onChange={e => onChange('requiredPlan', e.target.value)}
            className="input-field">
            <option value="">All Plans</option>
            <option value="BASIC">Basic Plan</option>
            <option value="PREMIUM">Premium Plan</option>
            <option value="DIAGNOSTIC">Diagnostic Only</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Lessons Section ──────────────────────────────────────────────────────────
function LessonsSection() {
  const toast = useToast()
  const BLANK: LessonFormValues = {
    skillArea: 'VOCABULARY',
    subskill: '',
    title: '',
    grade: 'GRADE_6',
    difficulty: 'MEDIUM',
    explanation: '',
    examples: '[]',
    tips: '',
    demonstrationSteps: '[]',
    guidedPractice: '[]',
    independentPractice: '[]',
    order: 0,
    status: 'DRAFT',
    assignedGrades: [],
    requiredPlan: ''
  }

  const [rows, setRows] = useState<ApiLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSrc] = useState('')
  const [filterGrade, setFilterGrade] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [addOpen, setAdd] = useState(false)
  const [editTgt, setEdt] = useState<ApiLesson | null>(null)
  const [viewTgt, setVew] = useState<ApiLesson | null>(null)
  const [delTgt, setDel] = useState<ApiLesson | null>(null)
  const [form, setForm] = useState<LessonFormValues>(BLANK)
  const [errors, setErrs] = useState<Record<string, string>>({})
  const [saving, setSave] = useState(false)

  const refresh = () => {
    setLoading(true)
    adminApi.lessons()
      .then(d => { setRows(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const f = (k: string, v: string | number | string[]) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrs(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.explanation.trim()) e.explanation = 'Required'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (isEdit: boolean) => {
    if (!validate()) return
    setSave(true)
    try {
      if (isEdit && editTgt) await adminApi.updateContent('lesson', editTgt.id, form)
      else await adminApi.createContent('lesson', form)
      if (isEdit) {
        setEdt(null)
        toast.success('Lesson updated')
      } else {
        setAdd(false)
        setForm(BLANK)
        toast.success('Lesson created')
      }
      refresh()
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Error')
    }
    setSave(false)
  }

  const handlePublish = async (lesson: ApiLesson) => {
    try {
      await adminApi.updateContent('lesson', lesson.id, { ...lesson, status: 'PUBLISHED' })
      toast.success('Lesson published')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to publish')
    }
  }

  const handleArchive = async (lesson: ApiLesson) => {
    try {
      await adminApi.updateContent('lesson', lesson.id, { ...lesson, status: 'ARCHIVED' })
      toast.success('Lesson archived')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to archive')
    }
  }

  const filtered = useMemo(() => {
    return rows.filter(l => {
      const matchSearch = search === '' || l.title.toLowerCase().includes(search.toLowerCase())
      const matchGrade = filterGrade === 'ALL' || l.grade === filterGrade
      const matchStatus = filterStatus === 'ALL' || (l as unknown as { status?: string }).status === filterStatus
      return matchSearch && matchGrade && matchStatus
    })
  }, [rows, search, filterGrade, filterStatus])

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSrc} placeholder="Search lessons..." />
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="ALL">All Grades</option>
            {[6, 7, 8, 9, 10, 11, 12].map(g => (
              <option key={g} value={`GRADE_${g}`}>Grade {g}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button onClick={() => { setForm(BLANK); setErrs({}); setAdd(true) }}
            className="btn-primary text-sm py-2.5 px-4 flex-shrink-0">
            + Create Lesson
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#2d5f5f] text-white">
              <tr>
                <Th className="text-white">Title</Th>
                <Th className="text-white">Skill</Th>
                <Th className="text-white">Grade</Th>
                <Th className="text-white hidden md:table-cell">Difficulty</Th>
                <Th className="text-white hidden lg:table-cell">Status</Th>
                <Th className="text-white"></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => setVew(l)}>
                  <Td>
                    <p className="font-medium text-gray-800">{l.title}</p>
                    <span className="text-xs text-gray-500">{l.subskill}</span>
                  </Td>
                  <Td><span className="text-xs text-gray-600">{l.skillArea}</span></Td>
                  <Td><span className="text-xs text-gray-600">Gr {l.grade.replace('GRADE_', '')}</span></Td>
                  <Td className="hidden md:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${DIFF_COLORS[l.difficulty]}`}>
                      {l.difficulty}
                    </span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <StatusBadge status={(l as unknown as { status?: string }).status || 'DRAFT'} />
                  </Td>
                  <Td onClick={e => e.stopPropagation()}>
                    <RowActions
                      onView={() => setVew(l)}
                      onEdit={() => { setForm(l as unknown as LessonFormValues); setErrs({}); setEdt(l) }}
                      onDelete={() => setDel(l)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState emoji="📘" title="No lessons found" onAction={() => { setForm(BLANK); setAdd(true) }}
              action="+ Create Lesson" />
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAdd(false)} title="Create Lesson" size="lg">
        <LessonForm form={form} errors={errors} onChange={f} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setAdd(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Create Lesson'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTgt} onClose={() => setEdt(null)} title={`Edit — ${editTgt?.title}`} size="lg">
        <LessonForm form={form} errors={errors} onChange={f} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setEdt(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTgt} onClose={() => setVew(null)} title={viewTgt?.title ?? ''} size="lg">
        {viewTgt && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={(viewTgt as unknown as { status?: string }).status || 'DRAFT'} />
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${DIFF_COLORS[viewTgt.difficulty]}`}>
                {viewTgt.difficulty}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">
                Grade {viewTgt.grade.replace('GRADE_', '')}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {viewTgt.skillArea}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-[#2d5f5f]">
              <p className="text-sm text-gray-800 leading-relaxed">{viewTgt.explanation}</p>
            </div>
            {viewTgt.tips && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 mb-1">💡 Tips</p>
                <p className="text-sm text-gray-700">{viewTgt.tips}</p>
              </div>
            )}
            <div className="flex gap-3">
              {(viewTgt as unknown as { status?: string }).status === 'DRAFT' && (
                <button onClick={() => handlePublish(viewTgt)} className="btn-primary flex-1">
                  Publish
                </button>
              )}
              {(viewTgt as unknown as { status?: string }).status === 'PUBLISHED' && (
                <button onClick={() => handleArchive(viewTgt)} className="btn-secondary flex-1">
                  Archive
                </button>
              )}
              <button onClick={() => { setVew(null); setForm(viewTgt as unknown as LessonFormValues); setErrs({}); setEdt(viewTgt) }}
                className="btn-secondary flex-1">
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!delTgt}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (delTgt) {
            try {
              await adminApi.deleteContent('lesson', delTgt.id)
              refresh()
              toast.success('Lesson deleted')
            } catch {
              toast.error('Failed to delete')
            }
            setDel(null)
          }
        }}
        title="Delete Lesson?"
        confirmLabel="Delete"
        message={`Delete "${delTgt?.title}"? This cannot be undone.`}
      />
    </>
  )
}

// ─── Passage Types & Component ────────────────────────────────────────────────
type PassageFormValues = {
  title: string
  grade: string
  difficulty: string
  topic: string
  wordCount: number
  content: string
  language: string
  status?: string
  assignedGrades?: string[]
  requiredPlan?: string
}

function PassageForm({ form, errors, onChange }: {
  form: PassageFormValues
  errors: Record<string, string>
  onChange: (k: string, v: string | number | string[]) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="Title" required error={errors.title}>
        <input value={form.title} onChange={e => onChange('title', e.target.value)}
          className="input-field" placeholder="The Ethiopian Highlands" />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Grade" required>
          <GradeSelect value={form.grade} onChange={v => onChange('grade', v)} />
        </Field>
        <Field label="Difficulty" required>
          <DifficultySelect value={form.difficulty} onChange={v => onChange('difficulty', v)} />
        </Field>
        <Field label="Language">
          <select value={form.language} onChange={e => onChange('language', e.target.value)}
            className="input-field">
            <option value="en">English</option>
            <option value="am">Amharic</option>
          </select>
        </Field>
      </div>

      <Field label="Topic" required error={errors.topic}>
        <input value={form.topic} onChange={e => onChange('topic', e.target.value)}
          className="input-field" placeholder="Geography, Science, Culture…" />
      </Field>

      <Field label="Passage Content" required error={errors.content}
        hint={`${form.content.split(/\s+/).filter(Boolean).length} words`}>
        <textarea value={form.content} onChange={e => onChange('content', e.target.value)}
          className="input-field resize-y font-mono text-xs" rows={8}
          placeholder="Enter the full passage text here…" />
      </Field>

      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Publishing & Access Control</h4>

        <Field label="Status">
          <select value={form.status || 'DRAFT'} onChange={e => onChange('status', e.target.value)}
            className="input-field">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>

        <Field label="Required Plan" hint="Leave empty for all plans">
          <select value={form.requiredPlan || ''} onChange={e => onChange('requiredPlan', e.target.value)}
            className="input-field">
            <option value="">All Plans</option>
            <option value="BASIC">Basic Plan</option>
            <option value="PREMIUM">Premium Plan</option>
            <option value="DIAGNOSTIC">Diagnostic Only</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Passages Section ─────────────────────────────────────────────────────────
function PassagesSection() {
  const toast = useToast()
  const BLANK: PassageFormValues = {
    title: '',
    grade: 'GRADE_6',
    difficulty: 'MEDIUM',
    topic: '',
    wordCount: 0,
    content: '',
    language: 'en',
    status: 'DRAFT',
    assignedGrades: [],
    requiredPlan: ''
  }

  const [rows, setRows] = useState<ApiPassage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSrc] = useState('')
  const [filterGrade, setFilterGrade] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [addOpen, setAdd] = useState(false)
  const [editTgt, setEdt] = useState<ApiPassage | null>(null)
  const [viewTgt, setVew] = useState<ApiPassage | null>(null)
  const [delTgt, setDel] = useState<ApiPassage | null>(null)
  const [form, setForm] = useState<PassageFormValues>(BLANK)
  const [errors, setErrs] = useState<Record<string, string>>({})
  const [saving, setSave] = useState(false)

  const refresh = () => {
    setLoading(true)
    adminApi.passages()
      .then(d => { setRows(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const f = (k: string, v: string | number | string[]) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrs(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.content.trim()) e.content = 'Required'
    if (!form.topic.trim()) e.topic = 'Required'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (isEdit: boolean) => {
    if (!validate()) return
    setSave(true)
    try {
      const data = { ...form, wordCount: form.content.split(/\s+/).filter(Boolean).length }
      if (isEdit && editTgt) await adminApi.updateContent('passage', editTgt.id, data)
      else await adminApi.createContent('passage', data)
      if (isEdit) {
        setEdt(null)
        toast.success('Passage updated')
      } else {
        setAdd(false)
        setForm(BLANK)
        toast.success('Passage created')
      }
      refresh()
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Error')
    }
    setSave(false)
  }

  const handlePublish = async (passage: ApiPassage) => {
    try {
      await adminApi.updateContent('passage', passage.id, { ...passage, status: 'PUBLISHED' })
      toast.success('Passage published')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to publish')
    }
  }

  const handleArchive = async (passage: ApiPassage) => {
    try {
      await adminApi.updateContent('passage', passage.id, { ...passage, status: 'ARCHIVED' })
      toast.success('Passage archived')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to archive')
    }
  }

  const filtered = useMemo(() => {
    return rows.filter(p => {
      const matchSearch = search === '' || `${p.title} ${p.topic}`.toLowerCase().includes(search.toLowerCase())
      const matchGrade = filterGrade === 'ALL' || p.grade === filterGrade
      const matchStatus = filterStatus === 'ALL' || (p as unknown as { status?: string }).status === filterStatus
      return matchSearch && matchGrade && matchStatus
    })
  }, [rows, search, filterGrade, filterStatus])

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSrc} placeholder="Search passages..." />
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="ALL">All Grades</option>
            {[6, 7, 8, 9, 10, 11, 12].map(g => (
              <option key={g} value={`GRADE_${g}`}>Grade {g}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button onClick={() => { setForm(BLANK); setErrs({}); setAdd(true) }}
            className="btn-primary text-sm py-2.5 px-4 flex-shrink-0">
            + Add Passage
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#2d5f5f] text-white">
              <tr>
                <Th className="text-white">Title</Th>
                <Th className="text-white">Grade</Th>
                <Th className="text-white">Difficulty</Th>
                <Th className="text-white hidden sm:table-cell">Topic</Th>
                <Th className="text-white hidden md:table-cell">Words</Th>
                <Th className="text-white hidden lg:table-cell">Status</Th>
                <Th className="text-white"></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => setVew(p)}>
                  <Td><p className="font-medium text-gray-800">{p.title}</p></Td>
                  <Td><span className="text-xs text-gray-600">Gr {p.grade.replace('GRADE_', '')}</span></Td>
                  <Td>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${DIFF_COLORS[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell text-xs text-gray-500">{p.topic}</Td>
                  <Td className="hidden md:table-cell text-xs text-gray-500">{p.wordCount}</Td>
                  <Td className="hidden lg:table-cell">
                    <StatusBadge status={(p as unknown as { status?: string }).status || 'DRAFT'} />
                  </Td>
                  <Td onClick={e => e.stopPropagation()}>
                    <RowActions
                      onView={() => setVew(p)}
                      onEdit={() => { setForm(p as unknown as PassageFormValues); setErrs({}); setEdt(p) }}
                      onDelete={() => setDel(p)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState emoji="📖" title="No passages found" onAction={() => { setForm(BLANK); setAdd(true) }}
              action="+ Add Passage" />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAdd(false)} title="Add Passage" size="lg">
        <PassageForm form={form} errors={errors} onChange={f} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setAdd(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Add Passage'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editTgt} onClose={() => setEdt(null)} title={`Edit — ${editTgt?.title}`} size="lg">
        <PassageForm form={form} errors={errors} onChange={f} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setEdt(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal open={!!viewTgt} onClose={() => setVew(null)} title={viewTgt?.title ?? ''} size="lg">
        {viewTgt && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={(viewTgt as unknown as { status?: string }).status || 'DRAFT'} />
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${DIFF_COLORS[viewTgt.difficulty]}`}>
                {viewTgt.difficulty}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">
                Grade {viewTgt.grade.replace('GRADE_', '')}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {viewTgt.topic}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {viewTgt.wordCount} words
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-[#2d5f5f] max-h-64 overflow-y-auto">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{viewTgt.content}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setVew(null); setForm(viewTgt as unknown as PassageFormValues); setErrs({}); setEdt(viewTgt) }}
                className="btn-secondary flex-1">
                Edit
              </button>
              <button onClick={() => setVew(null)} className="btn-primary flex-1">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!delTgt}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (delTgt) {
            try {
              await adminApi.deleteContent('passage', delTgt.id)
              refresh()
              toast.success('Passage deleted')
            } catch {
              toast.error('Failed')
            }
            setDel(null)
          }
        }}
        title="Delete Passage?"
        confirmLabel="Delete"
        message={`Delete "${delTgt?.title}"? This cannot be undone.`}
      />
    </>
  )
}

// ─── Quizzes Section (Questions) ──────────────────────────────────────────────
type QuestionFormValues = {
  skillArea: string
  subskill: string | undefined
  questionText: string
  questionType: string
  options: string[]
  correctAnswer: string
  explanation: string | undefined
  grade: string
  difficulty: string
  status?: string
  assignedGrades?: string[]
  requiredPlan?: string
}

function QuestionForm({ form, errors, onChange, onOptionChange }: {
  form: QuestionFormValues
  errors: Record<string, string>
  onChange: (k: string, v: unknown) => void
  onOptionChange: (i: number, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Skill Area" required>
          <SkillSelect value={form.skillArea} onChange={v => onChange('skillArea', v)} />
        </Field>
        <Field label="Subskill" hint="e.g. context_clues, main_idea">
          <input value={form.subskill} onChange={e => onChange('subskill', e.target.value)}
            className="input-field" placeholder="context_clues" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Grade" required>
          <GradeSelect value={form.grade} onChange={v => onChange('grade', v)} />
        </Field>
        <Field label="Difficulty" required>
          <DifficultySelect value={form.difficulty} onChange={v => onChange('difficulty', v)} />
        </Field>
      </div>

      <Field label="Question Text" required error={errors.questionText}>
        <textarea value={form.questionText} onChange={e => onChange('questionText', e.target.value)}
          className="input-field resize-none" rows={3} placeholder="What does 'observe' mean in the sentence…" />
      </Field>

      <Field label="Answer Options" required error={errors.options} hint="Enter all 4 options">
        <div className="space-y-2">
          {form.options.map((opt: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="correct" checked={form.correctAnswer === opt && opt !== ''}
                  onChange={() => opt && onChange('correctAnswer', opt)}
                  className="w-4 h-4 accent-green-600" title="Mark as correct answer" />
                <span className="text-xs text-gray-500 w-3">{String.fromCharCode(65 + i)}</span>
              </label>
              <input value={opt} onChange={e => onOptionChange(i, e.target.value)}
                className={`input-field flex-1 text-sm ${form.correctAnswer === opt && opt ? 'border-green-400 bg-green-50' : ''}`}
                placeholder={`Option ${String.fromCharCode(65 + i)}`} />
              {form.correctAnswer === opt && opt && (
                <span className="text-green-600 text-xs font-bold flex-shrink-0">✓ Correct</span>
              )}
            </div>
          ))}
        </div>
      </Field>

      <Field label="Explanation" required error={errors.explanation} hint="Shown to students after they answer">
        <textarea value={form.explanation} onChange={e => onChange('explanation', e.target.value)}
          className="input-field resize-none" rows={2} placeholder="Explain why this is the correct answer…" />
      </Field>

      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Publishing & Access Control</h4>

        <Field label="Status">
          <select value={form.status || 'DRAFT'} onChange={e => onChange('status', e.target.value)}
            className="input-field">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>

        <Field label="Required Plan" hint="Leave empty for all plans">
          <select value={form.requiredPlan || ''} onChange={e => onChange('requiredPlan', e.target.value)}
            className="input-field">
            <option value="">All Plans</option>
            <option value="BASIC">Basic Plan</option>
            <option value="PREMIUM">Premium Plan</option>
            <option value="DIAGNOSTIC">Diagnostic Only</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Quizzes (Questions) Section ──────────────────────────────────────────────
function QuizzesSection() {
  const toast = useToast()
  const BLANK: QuestionFormValues = {
    skillArea: 'VOCABULARY',
    subskill: '' as string | undefined,
    questionText: '',
    questionType: 'multiple_choice',
    options: ['', '', '', ''] as string[],
    correctAnswer: '',
    explanation: '' as string | undefined,
    grade: 'GRADE_6',
    difficulty: 'MEDIUM',
    status: 'DRAFT',
    assignedGrades: [],
    requiredPlan: ''
  }

  const [rows, setRows] = useState<ApiQuestion[]>([])
  const [search, setSrc] = useState('')
  const [filterSkill, setSkill] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [addOpen, setAdd] = useState(false)
  const [editTgt, setEdt] = useState<ApiQuestion | null>(null)
  const [delTgt, setDel] = useState<ApiQuestion | null>(null)
  const [form, setForm] = useState<QuestionFormValues>(BLANK)
  const [errors, setErrs] = useState<Record<string, string>>({})
  const [saving, setSave] = useState(false)

  const refresh = () => {
    adminApi.questions().then(d => setRows(d)).catch(() => { })
  }

  useEffect(() => { refresh() }, [])

  const f = (k: string, v: unknown) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrs(p => ({ ...p, [k]: '' }))
  }

  const setOption = (i: number, v: string) => setForm(p => {
    const o = [...p.options]
    o[i] = v
    return { ...p, options: o }
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.questionText.trim()) e.questionText = 'Required'
    if (!form.correctAnswer.trim()) e.correctAnswer = 'Required'
    if ((form.explanation ?? '').trim() === '') e.explanation = 'Required'
    if (form.options.some((o: string) => !o.trim())) e.options = 'All options required'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (isEdit: boolean) => {
    if (!validate()) return
    setSave(true)
    try {
      const data = { ...form, options: JSON.stringify(form.options) }
      if (isEdit && editTgt) await adminApi.updateContent('question', editTgt.id, data)
      else await adminApi.createContent('question', data)
      if (isEdit) {
        setEdt(null)
        toast.success('Question updated')
      } else {
        setAdd(false)
        setForm(BLANK)
        toast.success('Question created')
      }
      refresh()
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Error')
    }
    setSave(false)
  }

  const handlePublish = async (question: ApiQuestion) => {
    try {
      await adminApi.updateContent('question', question.id, { ...question, status: 'PUBLISHED' })
      toast.success('Question published')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to publish')
    }
  }

  const handleArchive = async (question: ApiQuestion) => {
    try {
      await adminApi.updateContent('question', question.id, { ...question, status: 'ARCHIVED' })
      toast.success('Question archived')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to archive')
    }
  }

  const SKILL_LABELS: Record<string, string> = {
    PHONEMIC_AWARENESS: '🔊 Phonemic',
    PHONICS_DECODING: '🔤 Phonics',
    FLUENCY: '🎤 Fluency',
    VOCABULARY: '📚 Vocab',
    COMPREHENSION: '🧠 Comp'
  }

  const filtered = useMemo(() => {
    return rows.filter(q => {
      const ms = search === '' || q.questionText.toLowerCase().includes(search.toLowerCase())
      const mk = filterSkill === 'ALL' || q.skillArea === filterSkill
      const mst = filterStatus === 'ALL' || (q as unknown as { status?: string }).status === filterStatus
      return ms && mk && mst
    })
  }, [rows, search, filterSkill, filterStatus])

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSrc} placeholder="Search questions..." />
          <select value={filterSkill} onChange={e => setSkill(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="ALL">All Skills</option>
            {Object.entries(SKILL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button onClick={() => { setForm(BLANK); setErrs({}); setAdd(true) }}
            className="btn-primary text-sm py-2.5 px-4 flex-shrink-0">
            + Add Question
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#2d5f5f] text-white">
              <tr>
                <Th className="text-white">Question</Th>
                <Th className="text-white">Skill</Th>
                <Th className="text-white">Grade</Th>
                <Th className="text-white hidden sm:table-cell">Difficulty</Th>
                <Th className="text-white hidden lg:table-cell">Status</Th>
                <Th className="text-white"></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(q => (
                <tr key={q.id} className="hover:bg-gray-50 group">
                  <Td><p className="text-xs text-gray-800 max-w-xs truncate">{q.questionText}</p></Td>
                  <Td><span className="text-xs text-gray-600 whitespace-nowrap">{SKILL_LABELS[q.skillArea]}</span></Td>
                  <Td><span className="text-xs text-gray-600">Gr {q.grade.replace('GRADE_', '')}</span></Td>
                  <Td className="hidden sm:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${DIFF_COLORS[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <StatusBadge status={(q as unknown as { status?: string }).status || 'DRAFT'} />
                  </Td>
                  <Td>
                    <RowActions
                      onEdit={() => {
                        const opts = q.options ? JSON.parse(q.options) : ['', '', '', '']
                        setForm({
                          skillArea: q.skillArea,
                          subskill: q.subskill,
                          questionText: q.questionText,
                          questionType: q.questionType,
                          options: opts,
                          correctAnswer: q.correctAnswer,
                          explanation: q.explanation,
                          grade: q.grade,
                          difficulty: q.difficulty,
                          status: (q as unknown as { status?: string }).status || 'DRAFT',
                          assignedGrades: [],
                          requiredPlan: ''
                        })
                        setErrs({})
                        setEdt(q)
                      }}
                      onDelete={() => setDel(q)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState emoji="📝" title="No questions found" onAction={() => { setForm(BLANK); setAdd(true) }}
              action="+ Add Question" />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAdd(false)} title="Add Question" size="lg">
        <QuestionForm form={form} errors={errors} onChange={f} onOptionChange={setOption} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setAdd(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Add Question'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editTgt} onClose={() => setEdt(null)} title="Edit Question" size="lg">
        <QuestionForm form={form} errors={errors} onChange={f} onOptionChange={setOption} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setEdt(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTgt}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (delTgt) {
            try {
              await adminApi.deleteContent('question', delTgt.id)
              refresh()
              toast.success('Question deleted')
            } catch {
              toast.error('Failed')
            }
            setDel(null)
          }
        }}
        title="Delete Question?"
        confirmLabel="Delete"
        message="Delete this question? It will be removed from all assessments."
      />
    </>
  )
}

// ─── Vocabulary Section ───────────────────────────────────────────────────────
type VocabFormValues = {
  word: string
  definition: string
  exampleSentence: string | undefined
  grade: string
  difficulty: string
  partOfSpeech: string | undefined
  synonyms: string | undefined
  antonyms: string | undefined
  amharicTranslation: string | undefined
  status?: string
  assignedGrades?: string[]
  requiredPlan?: string
}

function VocabForm({ form, errors, onChange }: {
  form: VocabFormValues
  errors: Record<string, string>
  onChange: (k: string, v: string | string[]) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Word" required error={errors.word}>
          <input value={form.word} onChange={e => onChange('word', e.target.value)}
            className="input-field font-semibold" placeholder="cultivate" />
        </Field>
        <Field label="Part of Speech">
          <select value={form.partOfSpeech} onChange={e => onChange('partOfSpeech', e.target.value)}
            className="input-field">
            {['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Grade" required>
          <GradeSelect value={form.grade} onChange={v => onChange('grade', v)} />
        </Field>
        <Field label="Difficulty" required>
          <DifficultySelect value={form.difficulty} onChange={v => onChange('difficulty', v)} />
        </Field>
      </div>

      <Field label="Definition" required error={errors.definition}>
        <textarea value={form.definition} onChange={e => onChange('definition', e.target.value)}
          className="input-field resize-none" rows={2} placeholder="To prepare land for growing crops…" />
      </Field>

      <Field label="Example Sentence">
        <textarea value={form.exampleSentence} onChange={e => onChange('exampleSentence', e.target.value)}
          className="input-field resize-none" rows={2} placeholder="The farmers cultivated the highland soil…" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Synonyms">
          <input value={form.synonyms} onChange={e => onChange('synonyms', e.target.value)}
            className="input-field" placeholder="grow, farm, develop" />
        </Field>
        <Field label="Antonyms">
          <input value={form.antonyms} onChange={e => onChange('antonyms', e.target.value)}
            className="input-field" placeholder="neglect, abandon" />
        </Field>
      </div>

      <Field label="Amharic Translation 🇪🇹" hint="Optional">
        <input value={form.amharicTranslation} onChange={e => onChange('amharicTranslation', e.target.value)}
          className="input-field" placeholder="አረሰ" />
      </Field>

      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Publishing & Access Control</h4>

        <Field label="Status">
          <select value={form.status || 'DRAFT'} onChange={e => onChange('status', e.target.value)}
            className="input-field">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>

        <Field label="Required Plan" hint="Leave empty for all plans">
          <select value={form.requiredPlan || ''} onChange={e => onChange('requiredPlan', e.target.value)}
            className="input-field">
            <option value="">All Plans</option>
            <option value="BASIC">Basic Plan</option>
            <option value="PREMIUM">Premium Plan</option>
            <option value="DIAGNOSTIC">Diagnostic Only</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Vocabulary Section Implementation ────────────────────────────────────────
function VocabularySection() {
  const toast = useToast()
  const BLANK: VocabFormValues = {
    word: '',
    definition: '',
    exampleSentence: '' as string | undefined,
    grade: 'GRADE_6',
    difficulty: 'MEDIUM',
    partOfSpeech: 'noun' as string | undefined,
    synonyms: '' as string | undefined,
    antonyms: '' as string | undefined,
    amharicTranslation: '' as string | undefined,
    status: 'DRAFT',
    assignedGrades: [],
    requiredPlan: ''
  }

  const [rows, setRows] = useState<ApiVocabulary[]>([])
  const [search, setSrc] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [addOpen, setAdd] = useState(false)
  const [editTgt, setEdt] = useState<ApiVocabulary | null>(null)
  const [delTgt, setDel] = useState<ApiVocabulary | null>(null)
  const [form, setForm] = useState<VocabFormValues>(BLANK)
  const [errors, setErrs] = useState<Record<string, string>>({})
  const [saving, setSave] = useState(false)

  const refresh = () => {
    adminApi.vocabulary().then(d => setRows(d)).catch(() => { })
  }

  useEffect(() => { refresh() }, [])

  const f = (k: string, v: string | string[]) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrs(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.word.trim()) e.word = 'Required'
    if (!form.definition.trim()) e.definition = 'Required'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (isEdit: boolean) => {
    if (!validate()) return
    setSave(true)
    try {
      if (isEdit && editTgt) await adminApi.updateContent('vocabulary', editTgt.id, form)
      else await adminApi.createContent('vocabulary', form)
      if (isEdit) {
        setEdt(null)
        toast.success('Word updated')
      } else {
        setAdd(false)
        setForm(BLANK)
        toast.success('Word added')
      }
      refresh()
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Error')
    }
    setSave(false)
  }

  const handlePublish = async (vocabulary: ApiVocabulary) => {
    try {
      await adminApi.updateContent('vocabulary', vocabulary.id, { ...vocabulary, status: 'PUBLISHED' })
      toast.success('Word published')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to publish')
    }
  }

  const handleArchive = async (vocabulary: ApiVocabulary) => {
    try {
      await adminApi.updateContent('vocabulary', vocabulary.id, { ...vocabulary, status: 'ARCHIVED' })
      toast.success('Word archived')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed to archive')
    }
  }

  const filtered = useMemo(() => {
    return rows.filter(v => {
      const ms = search === '' || `${v.word} ${v.definition}`.toLowerCase().includes(search.toLowerCase())
      const mst = filterStatus === 'ALL' || (v as unknown as { status?: string }).status === filterStatus
      return ms && mst
    })
  }, [rows, search, filterStatus])

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSrc} placeholder="Search vocabulary..." />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button onClick={() => { setForm(BLANK); setErrs({}); setAdd(true) }}
            className="btn-primary text-sm py-2.5 px-4 flex-shrink-0">
            + Add Word
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#2d5f5f] text-white">
              <tr>
                <Th className="text-white">Word</Th>
                <Th className="text-white hidden sm:table-cell">Definition</Th>
                <Th className="text-white">Grade</Th>
                <Th className="text-white hidden md:table-cell">Part of Speech</Th>
                <Th className="text-white hidden lg:table-cell">Status</Th>
                <Th className="text-white"></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 group">
                  <Td>
                    <p className="font-semibold text-gray-800">{v.word}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_COLORS[v.difficulty]}`}>
                      {v.difficulty}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell text-xs text-gray-500 max-w-xs">
                    <p className="truncate">{v.definition}</p>
                  </Td>
                  <Td><span className="text-xs text-gray-600">Gr {v.grade.replace('GRADE_', '')}</span></Td>
                  <Td className="hidden md:table-cell text-xs text-gray-500 italic">{v.partOfSpeech}</Td>
                  <Td className="hidden lg:table-cell">
                    <StatusBadge status={(v as unknown as { status?: string }).status || 'DRAFT'} />
                  </Td>
                  <Td>
                    <RowActions
                      onEdit={() => { setForm(v as unknown as VocabFormValues); setErrs({}); setEdt(v) }}
                      onDelete={() => setDel(v)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState emoji="📚" title="No vocabulary found" onAction={() => { setForm(BLANK); setAdd(true) }}
              action="+ Add Word" />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAdd(false)} title="Add Vocabulary Word" size="md">
        <VocabForm form={form} errors={errors} onChange={f} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setAdd(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Add Word'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editTgt} onClose={() => setEdt(null)} title={`Edit — "${editTgt?.word}"`} size="md">
        <VocabForm form={form} errors={errors} onChange={f} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setEdt(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTgt}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (delTgt) {
            try {
              await adminApi.deleteContent('vocabulary', delTgt.id)
              refresh()
              toast.success('Word deleted')
            } catch {
              toast.error('Failed')
            }
            setDel(null)
          }
        }}
        title={`Delete "${delTgt?.word}"?`}
        confirmLabel="Delete"
        message="This word will be removed from the vocabulary bank."
      />
    </>
  )
}

// ─── Read-only content browsers for content types with dedicated editors ─────
function ContentBrowser({ title, icon, description, type }: { title: string; icon: string; description: string; type: 'question' | 'passage' }) {
  const [items, setItems] = useState<Array<{ id: string; title: string; grade: string; status?: string }>>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = type === 'question' ? adminApi.questions : adminApi.passages
    load().then(data => setItems(data.map((item: any) => ({
      id: item.id,
      title: item.title || item.questionText,
      grade: item.grade,
      status: item.status,
    })))).catch(() => setItems([])).finally(() => setLoading(false))
  }, [type])

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) &&
    (status === 'ALL' || item.status === status)
  )
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}...`} />
        <select value={status} onChange={e => setStatus(e.target.value)} className="input-field w-auto text-sm">
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3"><span className="text-3xl">{icon}</span><div><h3 className="font-semibold text-gray-800">{title}</h3><p className="text-sm text-gray-500">{description}</p></div></div>
        <div>
          <table className="w-full text-sm">
            <thead className="bg-[#2d5f5f] text-white">
              <tr>
                <Th className="text-white">Title</Th>
                <Th className="text-white">Grade</Th>
                <Th className="text-white">Status</Th>
                <Th className="text-white">Created</Th>
                <Th className="text-white"></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={5} className="p-10 text-center text-gray-500">Loading...</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-gray-500">No matching content found.</td></tr> : filtered.map(item => <tr key={item.id} className="hover:bg-gray-50"><Td>{item.title}</Td><Td>Grade {item.grade?.replace('GRADE_', '')}</Td><Td><StatusBadge status={item.status || 'DRAFT'} /></Td><Td>Available</Td><Td><span className="text-xs text-gray-400">Use the editor above to manage</span></Td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Practice Section ─────────────────────────────────────────────────────────
function PracticeSection() {
  return (
    <ContentBrowser type="question"
      title="Practice Exercises" 
      icon="✏️"
      description="Interactive practice exercises with immediate feedback and progress tracking."
    />
  )
}

// ─── Assessments Section ──────────────────────────────────────────────────────
// ─── Assessments Section ─────────────────────────────────────────────────────
function AssessmentsSection() {
  const toast = useToast()
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [grade, setGrade] = useState('GRADE_6')
  const [saving, setSaving] = useState(false)

  const refresh = () => {
    setLoading(true)
    fetch('/api/admin/content/assessments', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`,
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssessments(data.data || [])
        }
      })
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`,
        },
        body: JSON.stringify({
          type: 'assessment',
          data: {
            title,
            description,
            grade,
            status: 'PUBLISHED'
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Assessment created successfully!')
        setShowForm(false)
        setTitle('')
        setDescription('')
        refresh()
      } else {
        toast.error(data.message || 'Failed to create assessment')
      }
    } catch (error) {
      toast.error('Failed to create assessment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assessment?')) return

    try {
      await adminApi.deleteContent('assessment', id)
      toast.success('Assessment deleted')
      refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? '✕ Cancel' : '+ Add Assessment'}
        </button>
      </div>

      {/* Simple Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Assessment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Reading Comprehension Test"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full"
                rows={3}
                placeholder="Brief description of the assessment..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="input-field w-full"
              >
                {GRADES.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Creating...' : 'Create Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessments List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#2d5f5f] text-white">
            <tr>
              <Th className="text-white">Assessment Title</Th>
              <Th className="text-white">Grade</Th>
              <Th className="text-white">Created</Th>
              <Th className="text-white"></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : assessments.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Assessments Yet</h3>
                  <p className="text-gray-500 text-sm">Create your first assessment for students</p>
                </td>
              </tr>
            ) : (
              assessments.map(assessment => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="font-medium text-gray-800">{assessment.title}</p>
                        {assessment.description && (
                          <p className="text-xs text-gray-500">{assessment.description}</p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs text-gray-600">
                    Grade {assessment.grade?.replace('GRADE_', '') || 'N/A'}
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {new Date(assessment.createdAt).toLocaleDateString()}
                  </Td>
                  <Td>
                    <button
                      onClick={() => handleDelete(assessment.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── PDF Resource Types & Form ───────────────────────────────────────────────
type PDFResourceFormValues = {
  title: string
  description: string
  fileType: 'PDF' | 'PPT' | 'EXCEL'
  grade: string
  difficulty: string
  category: string
  file?: File | null
  fileUrl?: string
  fileName?: string
  fileSize?: number
  status?: string
  assignedGrades?: string[]
  requiredPlan?: string
}

function PDFResourceForm({ form, errors, onChange, onFileChange }: {
  form: PDFResourceFormValues
  errors: Record<string, string>
  onChange: (k: string, v: string | number | string[]) => void
  onFileChange: (file: File | null) => void
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onFileChange(file)
    
    if (file) {
      // Auto-detect file type
      const extension = file.name.split('.').pop()?.toLowerCase()
      let fileType: 'PDF' | 'PPT' | 'EXCEL' = 'PDF'
      
      if (extension === 'pdf') fileType = 'PDF'
      else if (['ppt', 'pptx'].includes(extension || '')) fileType = 'PPT'
      else if (['xls', 'xlsx'].includes(extension || '')) fileType = 'EXCEL'
      
      onChange('fileType', fileType)
      onChange('fileName', file.name)
      onChange('fileSize', file.size)
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Title" required error={errors.title}>
        <input value={form.title} onChange={e => onChange('title', e.target.value)}
          className="input-field" placeholder="Reading Comprehension Worksheet" />
      </Field>

      <Field label="Description" required error={errors.description}>
        <textarea value={form.description} onChange={e => onChange('description', e.target.value)}
          className="input-field resize-y" rows={3} placeholder="Describe what this resource contains..." />
      </Field>

      <Field label="File Upload" required error={errors.file}>
        <div className="space-y-3">
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.xls,.xlsx"
            onChange={handleFileChange}
            className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2d5f5f] file:text-white hover:file:bg-[#1e4040] cursor-pointer"
          />
          <p className="text-xs text-gray-500">
            Accepted formats: PDF, PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx) - Max 50MB
          </p>
          {form.fileName && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600">
                  {form.fileType === 'PDF' ? '📄' : form.fileType === 'PPT' ? '📊' : '📈'}
                </span>
                <span className="text-sm font-medium text-green-800">{form.fileName}</span>
                <span className="text-xs text-green-600">
                  ({Math.round((form.fileSize || 0) / 1024)} KB)
                </span>
              </div>
            </div>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Grade" required>
          <GradeSelect value={form.grade} onChange={v => onChange('grade', v)} />
        </Field>
        <Field label="Difficulty" required>
          <DifficultySelect value={form.difficulty} onChange={v => onChange('difficulty', v)} />
        </Field>
        <Field label="File Type">
          <select value={form.fileType} onChange={e => onChange('fileType', e.target.value)}
            className="input-field">
            <option value="PDF">PDF Document</option>
            <option value="PPT">PowerPoint Presentation</option>
            <option value="EXCEL">Excel Spreadsheet</option>
          </select>
        </Field>
      </div>

      <Field label="Category" required error={errors.category}>
        <select value={form.category} onChange={e => onChange('category', e.target.value)}
          className="input-field">
          <option value="">Select Category</option>
          <option value="WORKSHEET">Worksheets</option>
          <option value="GUIDE">Study Guides</option>
          <option value="ASSESSMENT">Assessment Templates</option>
          <option value="PRESENTATION">Presentations</option>
          <option value="REFERENCE">Reference Materials</option>
          <option value="ACTIVITY">Activities</option>
        </select>
      </Field>

      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Publishing & Access Control</h4>
        
        <Field label="Status">
          <select value={form.status || 'DRAFT'} onChange={e => onChange('status', e.target.value)}
            className="input-field">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>

        <Field label="Required Plan" hint="Leave empty for all plans">
          <select value={form.requiredPlan || ''} onChange={e => onChange('requiredPlan', e.target.value)}
            className="input-field">
            <option value="">All Plans</option>
            <option value="BASIC">Basic Plan</option>
            <option value="PREMIUM">Premium Plan</option>
            <option value="DIAGNOSTIC">Diagnostic Only</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── PDF Resources Section ───────────────────────────────────────────────────
function PDFsSection() {
  const toast = useToast()
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const refresh = () => {
    setLoading(true)
    adminApi.getPDFResources()
      .then(data => setResources(data))
      .catch(() => setResources([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large (max 50MB)')
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name.replace('.pdf', ''))

    try {
      const response = await fetch('/api/admin/upload/pdf-resource', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`,
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('PDF uploaded successfully!')
        refresh()
        if (e.target) e.target.value = '' // Reset input
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this PDF?')) return

    try {
      await adminApi.deleteContent('pdf-resource', id)
      toast.success('PDF deleted')
      refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Simple Upload Button */}
      <div>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className={`btn-primary inline-flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📄 {uploading ? 'Uploading...' : 'Upload PDF'}
        </label>
        <p className="text-xs text-gray-500 mt-2">Click to select a PDF file (max 50MB)</p>
      </div>

      {/* PDF List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#2d5f5f] text-white">
            <tr>
              <Th className="text-white">PDF Name</Th>
              <Th className="text-white">Uploaded</Th>
              <Th className="text-white">Size</Th>
              <Th className="text-white"></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No PDFs Yet</h3>
                  <p className="text-gray-500 text-sm">Upload your first PDF to share with students</p>
                </td>
              </tr>
            ) : (
              resources.map(pdf => (
                <tr key={pdf.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-medium text-gray-800">{pdf.title}</p>
                        <p className="text-xs text-gray-500">{pdf.fileName}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {new Date(pdf.createdAt).toLocaleDateString()}
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {Math.round(pdf.fileSize / 1024)} KB
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <a
                        href={pdf.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(pdf.id)}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Resources Section ────────────────────────────────────────────────────────
function ResourcesSection() {
  return (
    <ContentBrowser type="passage"
      title="Learning Resources" 
      icon="🗂️"
      description="Additional learning materials, videos, and interactive tools for students."
    />
  )
}

// ─── Main ContentTab Component ────────────────────────────────────────────────
export default function ContentTab() {
  const [activeTab, setActiveTab] = useState<ContentTab>('lessons')

  return (
    <div className="space-y-5">
      {/* Dark Green Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-[#2d5f5f] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'lessons' && <LessonsSection />}
        {activeTab === 'passages' && <PassagesSection />}
        {activeTab === 'quizzes' && <QuizzesSection />}
        {activeTab === 'practice' && <PracticeSection />}
        {activeTab === 'vocabulary' && <VocabularySection />}
        {activeTab === 'assessments' && <AssessmentsSection />}
        {activeTab === 'pdfs' && <PDFsSection />}
        {activeTab === 'resources' && <ResourcesSection />}
      </div>
    </div>
  )
}
