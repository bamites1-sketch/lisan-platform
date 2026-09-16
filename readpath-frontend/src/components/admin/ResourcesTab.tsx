import { useState, useEffect, useMemo } from 'react'
import { useToast } from '../ui/Toast'
import {
  Modal, ConfirmDialog, Field, GradeSelect, DifficultySelect,
  SearchBar, SectionHeader, RowActions, EmptyState, Th, Td
} from './AdminShared'
import { timeAgo } from '../../lib/utils'

interface PDFResource {
  id: string
  title: string
  description: string
  fileType: string
  fileName: string
  fileUrl: string
  fileSize: number
  category: string
  grade: string
  difficulty: string
  status: string
  assignedGrades?: string
  requiredPlan?: string
  uploadedBy: string
  downloadCount: number
  createdAt: string
  updatedAt: string
}

interface LibraryItem {
  id: string
  title: string
  type: 'passage' | 'lesson' | 'vocabulary' | 'question'
  grade: string
  difficulty: string
  skillArea?: string
  status: string
  createdAt: string
}

const BLANK_RESOURCE = {
  title: '',
  description: '',
  category: 'WORKSHEET',
  grade: 'GRADE_6',
  difficulty: 'MEDIUM',
  requiredPlan: '',
}

function ResourceUploadModal({
  open,
  onClose,
  onUpload
}: {
  open: boolean
  onClose: () => void
  onUpload: (data: FormData) => void
}) {
  const [form, setForm] = useState(BLANK_RESOURCE)
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)

  const setField = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrors(p => ({ ...p, file: 'Only PDF, PowerPoint, and Excel files are allowed' }))
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setErrors(p => ({ ...p, file: 'File size must be less than 10MB' }))
      return
    }

    setFile(selectedFile)
    if (!form.title) {
      setForm(p => ({ ...p, title: selectedFile.name.replace(/\.[^/.]+$/, '') }))
    }
    setErrors(p => ({ ...p, file: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!file) e.file = 'Please select a file to upload'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleUpload = async () => {
    if (!validate()) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file!)
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('category', form.category)
      formData.append('grade', form.grade)
      formData.append('difficulty', form.difficulty)
      if (form.requiredPlan) formData.append('requiredPlan', form.requiredPlan)

      await onUpload(formData)
      
      // Reset form
      setForm(BLANK_RESOURCE)
      setFile(null)
      onClose()
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Resource" size="lg">
      <div className="space-y-4">
        {/* File Upload */}
        <Field label="File" required error={errors.file}>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.ppt,.pptx,.xls,.xlsx"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-semibold text-gray-700">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-4xl mb-2 block">📁</span>
                  <p className="text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PDF, PowerPoint, Excel (max 10MB)</p>
                </div>
              )}
            </label>
          </div>
        </Field>

        <Field label="Title" required error={errors.title}>
          <input
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            className="input-field"
            placeholder="Resource title..."
          />
        </Field>

        <Field label="Description" hint="Optional">
          <textarea
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            className="input-field"
            rows={3}
            placeholder="Brief description of this resource..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={form.category} onChange={e => setField('category', e.target.value)} className="input-field">
              <option value="WORKSHEET">📝 Worksheet</option>
              <option value="GUIDE">📖 Guide</option>
              <option value="ASSESSMENT">📋 Assessment</option>
              <option value="TEMPLATE">📄 Template</option>
              <option value="RESOURCE">📦 Resource</option>
            </select>
          </Field>
          <Field label="Grade Level">
            <GradeSelect value={form.grade} onChange={v => setField('grade', v)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Difficulty">
            <DifficultySelect value={form.difficulty} onChange={v => setField('difficulty', v)} />
          </Field>
          <Field label="Required Plan" hint="Leave empty for all plans">
            <select value={form.requiredPlan} onChange={e => setField('requiredPlan', e.target.value)} className="input-field">
              <option value="">All Plans</option>
              <option value="BASIC">Basic Plan</option>
              <option value="PREMIUM">Premium Plan</option>
              <option value="DIAGNOSTIC">Diagnostic Plan</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleUpload} disabled={uploading} className="btn-primary flex-1">
          {uploading ? 'Uploading...' : 'Upload Resource'}
        </button>
      </div>
    </Modal>
  )
}

function MaterialsView() {
  const toast = useToast()
  const [resources, setResources] = useState<PDFResource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PDFResource | null>(null)

  const loadResources = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('lisan_token') ?? ''
      const response = await fetch('/api/admin/content/pdf-resources', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setResources(data.data || [])
      }
    } catch (error) {
      toast.error('Failed to load resources', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const handleUpload = async (formData: FormData) => {
    try {
      const token = localStorage.getItem('lisan_token') ?? ''
      const response = await fetch('/api/admin/upload/pdf-resource', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Resource uploaded', 'Resource has been uploaded successfully')
        loadResources()
      } else {
        throw new Error(data.message || 'Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed', error instanceof Error ? error.message : 'Could not upload resource')
      throw error
    }
  }

  const handleDelete = async (resource: PDFResource) => {
    try {
      const token = localStorage.getItem('lisan_token') ?? ''
      const response = await fetch(`/api/admin/content/pdf-resource/${resource.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success('Resource deleted', 'Resource has been removed')
        setResources(prev => prev.filter(r => r.id !== resource.id))
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast.error('Failed to delete', error instanceof Error ? error.message : 'Could not delete resource')
    }
  }

  const handleDownload = (resource: PDFResource) => {
    window.open(resource.fileUrl, '_blank')
    // Track download
    const token = localStorage.getItem('lisan_token') ?? ''
    fetch(`/api/admin/content/pdf-resource/${resource.id}/download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {}) // Silent fail for analytics
  }

  const filtered = useMemo(() => {
    return resources.filter(r => {
      const matchSearch = search === '' || r.title.toLowerCase().includes(search.toLowerCase()) ||
                         r.fileName.toLowerCase().includes(search.toLowerCase())
      const matchGrade = filterGrade === 'ALL' || r.grade === filterGrade
      const matchCategory = filterCategory === 'ALL' || r.category === filterCategory
      return matchSearch && matchGrade && matchCategory
    })
  }, [resources, search, filterGrade, filterCategory])

  const grades = ['ALL', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12']
  const categories = ['ALL', 'WORKSHEET', 'GUIDE', 'ASSESSMENT', 'TEMPLATE', 'RESOURCE']

  return (
    <>
      <div className="space-y-5">
        <SectionHeader
          title="Learning Materials"
          count={resources.length}
          subtitle="Manage PDFs, worksheets, and downloadable resources"
          onAdd={() => setUploadOpen(true)}
          addLabel="+ Upload Resource"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search resources..."
          />
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="input-field w-auto text-sm">
            {grades.map(g => (
              <option key={g} value={g}>
                {g === 'ALL' ? 'All Grades' : `Grade ${g.replace('GRADE_', '')}`}
              </option>
            ))}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field w-auto text-sm">
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Resources Grid */}
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
                emoji="📄"
                title="No resources found"
                subtitle={resources.length === 0 ? "Upload your first resource to get started" : "Try adjusting your filters"}
                action="+ Upload Resource"
                onAdd={() => setUploadOpen(true)}
              />
            </div>
          ) : (
            filtered.map(resource => (
              <div key={resource.id} className="card group hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
                    <p className="text-sm text-gray-500">
                      {resource.category} • Grade {resource.grade.replace('GRADE_', '')}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <RowActions
                      onDelete={() => setDeleteTarget(resource)}
                    />
                  </div>
                </div>

                {resource.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📄</span>
                    <span>{resource.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>💾</span>
                    <span>{(resource.fileSize / 1024).toFixed(0)} KB</span>
                    <span>•</span>
                    <span>⬇️ {resource.downloadCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📅</span>
                    <span>{timeAgo(resource.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(resource)}
                    className="btn-primary text-xs py-2 px-3 flex-1"
                  >
                    Download
                  </button>
                  <button className="btn-ghost text-xs py-2 px-3">
                    Preview
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ResourceUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Resource?"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Resource"
      />
    </>
  )
}

function LibraryView() {
  const toast = useToast()
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterGrade, setFilterGrade] = useState('ALL')

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('lisan_token') ?? ''
      
      // Load all content types
      const [passages, lessons, vocabulary, questions] = await Promise.all([
        fetch('/api/admin/content/passages', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/content/lessons', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/content/vocabulary', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/content/questions', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ])

      const items: LibraryItem[] = [
        ...(passages.data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          type: 'passage' as const,
          grade: p.grade,
          difficulty: p.difficulty,
          status: p.status,
          createdAt: p.createdAt
        })),
        ...(lessons.data || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          type: 'lesson' as const,
          grade: l.grade,
          difficulty: l.difficulty,
          skillArea: l.skillArea,
          status: l.status,
          createdAt: l.createdAt
        })),
        ...(vocabulary.data || []).map((v: any) => ({
          id: v.id,
          title: v.word,
          type: 'vocabulary' as const,
          grade: v.grade,
          difficulty: v.difficulty,
          status: v.status,
          createdAt: v.createdAt
        })),
        ...(questions.data || []).map((q: any) => ({
          id: q.id,
          title: q.questionText,
          type: 'question' as const,
          grade: q.grade,
          difficulty: q.difficulty,
          skillArea: q.skillArea,
          status: q.status,
          createdAt: q.createdAt
        }))
      ]

      setLibrary(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (error) {
      toast.error('Failed to load library', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLibrary()
  }, [])

  const filtered = useMemo(() => {
    return library.filter(item => {
      const matchSearch = search === '' || item.title.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'ALL' || item.type === filterType
      const matchGrade = filterGrade === 'ALL' || item.grade === filterGrade
      return matchSearch && matchType && matchGrade
    })
  }, [library, search, filterType, filterGrade])

  const stats = useMemo(() => {
    return {
      passages: library.filter(i => i.type === 'passage').length,
      lessons: library.filter(i => i.type === 'lesson').length,
      vocabulary: library.filter(i => i.type === 'vocabulary').length,
      questions: library.filter(i => i.type === 'question').length,
    }
  }, [library])

  const getTypeIcon = (type: string) => {
    const icons = {
      passage: '📖',
      lesson: '🎓',
      vocabulary: '📚',
      question: '❓'
    }
    return icons[type as keyof typeof icons] || '📄'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PUBLISHED: 'bg-success-100 text-success-700',
      DRAFT: 'bg-warning-100 text-warning-700',
      ARCHIVED: 'bg-gray-100 text-gray-700'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  const grades = ['ALL', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12']
  const types = ['ALL', 'passage', 'lesson', 'vocabulary', 'question']

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Content Library"
        count={library.length}
        subtitle="Browse all educational content and learning materials"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Passages', count: stats.passages, icon: '📖', color: 'bg-blue-50 text-blue-700' },
          { label: 'Lessons', count: stats.lessons, icon: '🎓', color: 'bg-green-50 text-green-700' },
          { label: 'Vocabulary', count: stats.vocabulary, icon: '📚', color: 'bg-purple-50 text-purple-700' },
          { label: 'Questions', count: stats.questions, icon: '❓', color: 'bg-orange-50 text-orange-700' },
        ].map(stat => (
          <div key={stat.label} className={`card border-0 ${stat.color} text-center`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold mb-0.5">{stat.count}</div>
            <div className="text-xs font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search content..."
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field w-auto text-sm">
          {types.map(t => (
            <option key={t} value={t}>
              {t === 'ALL' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="input-field w-auto text-sm">
          {grades.map(g => (
            <option key={g} value={g}>
              {g === 'ALL' ? 'All Grades' : `Grade ${g.replace('GRADE_', '')}`}
            </option>
          ))}
        </select>
      </div>

      {/* Library Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <Th>Content</Th>
                  <Th>Type</Th>
                  <Th>Grade</Th>
                  <Th>Difficulty</Th>
                  <Th className="hidden lg:table-cell">Skill Area</Th>
                  <Th>Status</Th>
                  <Th className="hidden xl:table-cell">Created</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">{item.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="capitalize text-gray-600">{item.type}</span>
                    </Td>
                    <Td>
                      <span className="text-gray-600">Gr {item.grade.replace('GRADE_', '')}</span>
                    </Td>
                    <Td>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                        {item.difficulty}
                      </span>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <span className="text-xs text-gray-500">
                        {item.skillArea || '—'}
                      </span>
                    </Td>
                    <Td>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </Td>
                    <Td className="hidden xl:table-cell">
                      <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <EmptyState
            title="No content found"
            subtitle="Try adjusting your search or filters"
          />
        )}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Showing {filtered.length} of {library.length} items
        </div>
      </div>
    </div>
  )
}

export default function ResourcesTab({ subTab }: { subTab: 'materials' | 'library' }) {
  if (subTab === 'materials') {
    return <MaterialsView />
  } else {
    return <LibraryView />
  }
}