import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { useToast } from '../ui/Toast'

interface ContentItem {
  id: string
  title: string
  grade: string
  difficulty?: string
  skillArea?: string
  category?: string
  description?: string
}

interface AssignmentForm {
  title: string
  description: string
  assignmentType: 'Reading Passage' | 'Quiz' | 'Lesson' | 'Fluency' | 'Practice'
  gradeLevel: string
  dueDate: string
  selectedContent: ContentItem[]
}

const INITIAL_FORM: AssignmentForm = {
  title: '',
  description: '',
  assignmentType: 'Reading Passage',
  gradeLevel: 'Grade 5',
  dueDate: '',
  selectedContent: []
}

export default function CreateAssignmentPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState<AssignmentForm>(INITIAL_FORM)
  const [passages, setPassages] = useState<ContentItem[]>([])
  const [lessons, setLessons] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedGrade, setSelectedGrade] = useState('All Grades')

  useEffect(() => {
    // Load content data
    Promise.all([
      adminApi.passages().catch(() => []),
      adminApi.lessons().catch(() => [])
    ]).then(([passageData, lessonData]) => {
      setPassages(passageData as ContentItem[])
      setLessons(lessonData as ContentItem[])
      setLoading(false)
    })
  }, [])

  const updateForm = (field: keyof AssignmentForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleContentToggle = (content: ContentItem) => {
    setForm(prev => ({
      ...prev,
      selectedContent: prev.selectedContent.find(c => c.id === content.id)
        ? prev.selectedContent.filter(c => c.id !== content.id)
        : [...prev.selectedContent, content]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Create assignments for each selected content
      for (const content of form.selectedContent) {
        await adminApi.createAssignment({
          contentType: form.assignmentType === 'Reading Passage' ? 'passage' : 'lesson',
          contentId: content.id,
          grade: form.gradeLevel.replace('Grade ', 'GRADE_'),
          note: form.description,
          dueDate: form.dueDate,
          assignedBy: 'Admin'
        })
      }
      toast.success('Assignment created!', `Successfully assigned ${form.selectedContent.length} item(s) to ${form.gradeLevel}`)
      navigate('/admin?tab=assignments')
    } catch (error) {
      toast.error('Failed to create assignment', error instanceof Error ? error.message : 'Unknown error')
    }
    setSaving(false)
  }

  const filteredContent = () => {
    const allContent = form.assignmentType === 'Reading Passage' ? passages : lessons
    return allContent.filter(item => {
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === 'All Categories' || 
        item.category === selectedCategory ||
        item.skillArea === selectedCategory

      const matchesGrade = selectedGrade === 'All Grades' || 
        item.grade === selectedGrade ||
        item.grade === 'ALL'

      return matchesSearch && matchesCategory && matchesGrade
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/admin?tab=assignments')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Assignments
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
                <p className="text-gray-600">Assign readings, passages, quizzes or practice activities to your students</p>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving || form.selectedContent.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {saving ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Basic Information */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-sm text-gray-500">Fill in the details for your assignment.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="e.g. Reading Practice Set 1"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Assignment Type *</label>
                    <select
                      value={form.assignmentType}
                      onChange={(e) => updateForm('assignmentType', e.target.value)}
                      className="input-field"
                    >
                      <option>Reading Passage</option>
                      <option>Quiz</option>
                      <option>Lesson</option>
                      <option>Fluency</option>
                      <option>Practice</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Grade Level *</label>
                    <select
                      value={form.gradeLevel}
                      onChange={(e) => updateForm('gradeLevel', e.target.value)}
                      className="input-field"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i}>Grade {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Add a brief description (optional)"
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="label">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => updateForm('dueDate', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            {/* Step 2: Select Content */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Select Content</h2>
                  <p className="text-sm text-gray-500">Choose the content you want to include in this assignment.</p>
                </div>
              </div>

              {/* Content Type Tabs */}
              <div className="flex gap-2 mb-6">
                {['Lessons', 'Passages', 'Quizzes', 'Practice'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => updateForm('assignmentType', tab === 'Passages' ? 'Reading Passage' : tab.slice(0, -1))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (tab === 'Passages' && form.assignmentType === 'Reading Passage') ||
                      (tab !== 'Passages' && form.assignmentType === tab.slice(0, -1))
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search passages"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="input-field min-w-[120px]"
                >
                  <option>All Grades</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i}>Grade {i + 1}</option>
                  ))}
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field min-w-[140px]"
                >
                  <option>All Categories</option>
                  <option>Fiction</option>
                  <option>Informational</option>
                  <option>Poetry</option>
                </select>
              </div>

              {/* Content Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Grade Level</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Difficulty</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        </td>
                      </tr>
                    ) : filteredContent().length > 0 ? (
                      filteredContent().map((content) => {
                        const isSelected = form.selectedContent.find(c => c.id === content.id)
                        return (
                          <tr key={content.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => handleContentToggle(content)}
                                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src="/api/placeholder/40/40" 
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{content.title}</p>
                                  <p className="text-xs text-gray-500">{content.description || 'No description available'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {content.grade.replace('GRADE_', 'Grade ') || 'All Grades'}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                content.category === 'Fiction' ? 'bg-green-100 text-green-800' :
                                content.category === 'Informational' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {content.category || content.skillArea || 'General'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                content.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                content.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                content.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {content.difficulty || 'Medium'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No content found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                {form.selectedContent.length} passages selected
              </div>
            </div>
          </div>
          {/* Right Column - Assignment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Assignment Summary</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-brand-100 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Title</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    {form.title || 'Reading Practice Set 1'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-brand-100 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Type</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    {form.assignmentType}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-brand-100 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Grade Level</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    {form.gradeLevel}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-brand-100 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Due Date</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    {form.dueDate ? new Date(form.dueDate).toLocaleDateString() : 'Sep 25, 2025'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-brand-100 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Students</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    All Students
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-brand-100 rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Content</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    {form.selectedContent.length} passages selected
                  </p>
                </div>
              </div>

              {/* Tip */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Tip</p>
                    <p className="text-xs text-blue-800 mt-1">
                      You can always edit or delete this assignment later from the Assignments page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}