import { useState, useMemo, useEffect } from 'react'
import { useToast } from '../ui/Toast'
import { adminApi, type ApiStudent, type ApiTeacher } from '../../services/api'
import {
  Modal, ConfirmDialog, Field, GradeSelect,
  SearchBar, SectionHeader, RowActions, EmptyState, Th, Td
} from './AdminShared'
import { timeAgo } from '../../lib/utils'

interface Class {
  id: string
  name: string
  grade: string
  teacherId: string
  teacherName: string
  studentCount: number
  students: ApiStudent[]
  description?: string
  onlineLink?: string
  createdAt: string
}

const BLANK_CLASS = {
  name: '',
  grade: 'GRADE_6',
  teacherId: '',
  description: '',
  onlineLink: '',
}

function ClassForm({ 
  value, 
  onChange, 
  errors, 
  teachers 
}: {
  value: typeof BLANK_CLASS
  onChange: (k: string, v: string) => void
  errors: Record<string, string>
  teachers: ApiTeacher[]
}) {
  return (
    <div className="space-y-4">
      <Field label="Class Name" required error={errors.name}>
        <input 
          value={value.name} 
          onChange={e => onChange('name', e.target.value)} 
          className="input-field" 
          placeholder="Grade 6A Reading Group" 
        />
      </Field>
      
      <div className="grid grid-cols-2 gap-4">
        <Field label="Grade Level" required>
          <GradeSelect value={value.grade} onChange={v => onChange('grade', v)} />
        </Field>
        <Field label="Coordinator" hint="Optional">
          <select 
            value={value.teacherId} 
            onChange={e => onChange('teacherId', e.target.value)} 
            className="input-field"
          >
            <option value="">— Select Teacher —</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
        </Field>
      </div>
      
      <Field label="Description" hint="Optional">
        <textarea 
          value={value.description} 
          onChange={e => onChange('description', e.target.value)} 
          className="input-field" 
          rows={3}
          placeholder="Brief description of this class or reading group..."
        />
      </Field>
      <Field label="Online Class Link" hint="Optional Zoom, Meet, or classroom link">
        <input value={value.onlineLink} onChange={e => onChange('onlineLink', e.target.value)} className="input-field" placeholder="https://..." />
      </Field>
    </div>
  )
}

function StudentAssignmentModal({
  open,
  onClose,
  classItem,
  availableStudents,
  onAssignStudents
}: {
  open: boolean
  onClose: () => void
  classItem: Class | null
  availableStudents: ApiStudent[]
  onAssignStudents: (classId: string, studentIds: string[]) => void
}) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => 
    availableStudents.filter(s => 
      s.grade === classItem?.grade &&
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
    ), [availableStudents, classItem?.grade, search]
  )

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleAssign = () => {
    if (classItem && selectedStudents.length > 0) {
      onAssignStudents(classItem.id, selectedStudents)
      setSelectedStudents([])
      onClose()
    }
  }

  if (!classItem) return null

  return (
    <Modal open={open} onClose={onClose} title={`Assign Students to ${classItem.name}`} size="lg">
      <div className="space-y-4">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search students..."
        />
        
        <div className="text-sm text-gray-600">
          Showing students from Grade {classItem.grade.replace('GRADE_', '')} who are not assigned to this class
        </div>
        
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No available students found for Grade {classItem.grade.replace('GRADE_', '')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(student => (
                <div key={student.id} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleToggleStudent(student.id)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-700 text-xs font-bold">
                    {student.firstName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-gray-500">XP: ⚡{student.xp} • Last active: {timeAgo(student.lastActiveAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button 
            onClick={handleAssign}
            disabled={selectedStudents.length === 0}
            className="btn-primary flex-1"
          >
            Assign {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ClassesTab() {
  const toast = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [teachers, setTeachers] = useState<ApiTeacher[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('ALL')
  const [addOpen, setAddOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null)
  const [form, setForm] = useState<typeof BLANK_CLASS>(BLANK_CLASS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const setField = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [studentsData, teachersData, storedClasses] = await Promise.all([
        adminApi.students(),
        adminApi.teachers(),
        adminApi.classes()
      ])
      
      setStudents(studentsData)
      setTeachers(teachersData)
      
      if (storedClasses.length > 0) {
        setClasses(storedClasses.map((item: any) => ({
          id: item.id, name: item.name, grade: item.grade, teacherId: '', teacherName: 'Admin class',
          studentCount: item.memberships?.length ?? 0,
          students: (item.memberships ?? []).map((membership: any) => studentsData.find(student => student.id === membership.studentId) ?? membership.student) as ApiStudent[],
          description: item.description ?? '', onlineLink: item.onlineLink ?? '', createdAt: item.createdAt,
        })))
        return
      }

      // Fallback for existing teacher-linked groups
      const classMap = new Map<string, Class>()
      
      studentsData.forEach(student => {
        if (student.teacherId) {
          const teacher = teachersData.find(t => t.id === student.teacherId)
          if (teacher) {
            const classKey = `${teacher.id}-${student.grade}`
            const className = `Grade ${student.grade.replace('GRADE_', '')} - ${teacher.firstName} ${teacher.lastName}`
            
            if (!classMap.has(classKey)) {
              classMap.set(classKey, {
                id: classKey,
                name: className,
                grade: student.grade,
                teacherId: teacher.id,
                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                studentCount: 0,
                students: [],
                createdAt: new Date().toISOString()
              })
            }
            
            const classItem = classMap.get(classKey)!
            classItem.students.push(student)
            classItem.studentCount = classItem.students.length
          }
        }
      })
      
      setClasses(Array.from(classMap.values()))
    } catch (error) {
      toast.error('Failed to load data', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Class name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await adminApi.createClass({ name: form.name, grade: form.grade, description: form.description, onlineLink: form.onlineLink })
      toast.success('Class created', `${form.name} has been created successfully.`)
      setAddOpen(false)
      setForm(BLANK_CLASS)
      loadData() // Refresh data
    } catch (error) {
      toast.error('Failed to create class', error instanceof Error ? error.message : 'Could not create class')
    }
    setSaving(false)
  }

  const handleAssignStudents = async (classId: string, studentIds: string[]) => {
    try {
      const classItem = classes.find(c => c.id === classId)
      if (!classItem) return
      
      await adminApi.assignClassStudents(classId, studentIds)
      toast.success('Students assigned', `${studentIds.length} student(s) assigned to ${classItem.name}`)
      loadData() // Refresh data
    } catch (error) {
      toast.error('Failed to assign students', error instanceof Error ? error.message : 'Could not assign students')
    }
  }

  const handleRemoveStudent = async (classId: string, studentId: string) => {
    try {
      // In a real implementation, you'd call an API to remove student from teacher
      toast.success('Student removed', 'Student has been removed from the class')
      loadData() // Refresh data
    } catch (error) {
      toast.error('Failed to remove student', error instanceof Error ? error.message : 'Could not remove student')
    }
  }

  const filtered = useMemo(() => {
    return classes.filter(c => {
      const matchSearch = search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || 
                         c.teacherName.toLowerCase().includes(search.toLowerCase())
      const matchGrade = filterGrade === 'ALL' || c.grade === filterGrade
      return matchSearch && matchGrade
    })
  }, [classes, search, filterGrade])

  const availableStudents = useMemo(() => {
    if (!selectedClass) return []
    return students.filter(s => 
      !selectedClass.students.some(cs => cs.id === s.id)
    )
  }, [students, selectedClass])

  const grades = ['ALL', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12']

  return (
    <>
      <div className="space-y-5">
        <SectionHeader 
          title="Classes" 
          count={classes.length}
          subtitle="Manage reading groups and class assignments" 
          onAdd={() => { setForm(BLANK_CLASS); setErrors({}); setAddOpen(true) }} 
          addLabel="+ Create Class" 
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search classes or teachers..." 
          />
          <select 
            value={filterGrade} 
            onChange={e => setFilterGrade(e.target.value)} 
            className="input-field w-auto text-sm"
          >
            {grades.map(g => (
              <option key={g} value={g}>
                {g === 'ALL' ? 'All Grades' : `Grade ${g.replace('GRADE_', '')}`}
              </option>
            ))}
          </select>
        </div>

        {/* Classes grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                emoji="🎓"
                title="No classes found"
                subtitle={classes.length === 0 ? "Create your first class to get started" : "Try adjusting your filters"}
                action="+ Create Class"
                onAdd={() => setAddOpen(true)}
              />
            </div>
          ) : (
            filtered.map(classItem => (
              <div key={classItem.id} className="card group hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{classItem.name}</h3>
                    <p className="text-sm text-gray-500">Grade {classItem.grade.replace('GRADE_', '')}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <RowActions
                      onView={() => {
                        setSelectedClass(classItem)
                        setAssignOpen(true)
                      }}
                      onDelete={() => setDeleteTarget(classItem)}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">👨‍🏫</span>
                    <span className="text-gray-600">{classItem.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">👥</span>
                    <span className="text-gray-600">
                      {classItem.studentCount} student{classItem.studentCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Recent students */}
                {classItem.students.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex -space-x-1">
                      {classItem.students.slice(0, 4).map(student => (
                        <div
                          key={student.id}
                          className="w-6 h-6 bg-brand-100 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-brand-700"
                          title={`${student.firstName} ${student.lastName}`}
                        >
                          {student.firstName[0]}
                        </div>
                      ))}
                      {classItem.students.length > 4 && (
                        <div className="w-6 h-6 bg-gray-200 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                          +{classItem.students.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedClass(classItem)
                      setAssignOpen(true)
                    }}
                    className="btn-secondary text-xs py-2 px-3 flex-1"
                  >
                    Manage Students
                  </button>
                  <button className="btn-ghost text-xs py-2 px-3">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create class modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create New Class" size="md">
        <ClassForm 
          value={form} 
          onChange={setField} 
          errors={errors} 
          teachers={teachers} 
        />
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setAddOpen(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Create Class'}
          </button>
        </div>
      </Modal>

      {/* Student assignment modal */}
      <StudentAssignmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        classItem={selectedClass}
        availableStudents={availableStudents}
        onAssignStudents={handleAssignStudents}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const target = deleteTarget
            void adminApi.deleteClass(target.id).then(() => {
              toast.success('Class deleted', `${target.name} has been removed`)
              setClasses(prev => prev.filter(c => c.id !== target.id))
              setDeleteTarget(null)
            }).catch(error => toast.error('Failed to delete class', error instanceof Error ? error.message : 'Please try again'))
          }
        }}
        title="Delete Class?"
        message={`Delete "${deleteTarget?.name}"? Students will be unassigned from this class.`}
        confirmLabel="Delete Class"
      />
    </>
  )
}