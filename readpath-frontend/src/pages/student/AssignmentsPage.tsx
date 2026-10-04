import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StudentLayout from '../../components/layout/StudentLayout'
import { apiUrl } from '../../lib/apiBase'

export interface AssignmentItem {
  id: string
  contentType: 'passage' | 'lesson' | 'assessment'
  contentId: string
  submissionId?: string
  title: string
  grade: string
  assignedAt: string
  dueDate?: string | null
  note?: string | null
  status: string
  submissionStatus?: string
  overallScore?: number | null
  assignedBy?: string
  details?: {
    title?: string
    topic?: string
    difficulty?: string
    wordCount?: number
    grade?: string
    preview?: string
    skillArea?: string
    subskill?: string
    passage?: string
    skillAreas?: string[]
    instructions?: string
    status?: string
    overallScore?: number | null
    fluencyScore?: number | null
    accuracyScore?: number | null
    comprehensionScore?: number | null
    feedback?: string | null
    strengths?: string[] | string
    weaknesses?: string[] | string
    recommendations?: string[] | string
  }
}

export default function AssignmentsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'passage' | 'lesson' | 'assessment' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('lisan_token') ?? ''
      const res = await fetch(apiUrl('/api/students/assignments'), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error(`Failed to load assignments (${res.status})`)
      }

      const json = await res.json()
      // Server returns unified array in json.data
      const rawData = Array.isArray(json.data) ? json.data : (json.data?.assignments ?? [])
      setItems(rawData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [])

  // Filter and search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Tab filter
      if (activeTab === 'completed') {
        const isDone = item.status === 'completed' || item.submissionStatus === 'SUBMITTED' || item.submissionStatus === 'REVIEWED'
        if (!isDone) return false
      } else if (activeTab !== 'all') {
        if (item.contentType !== activeTab) return false
        // Exclude already completed from the active tabs if desired, or show all in category
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchNote = item.note?.toLowerCase().includes(q)
        const matchTopic = item.details?.topic?.toLowerCase().includes(q)
        const matchSkill = item.details?.skillArea?.toLowerCase().includes(q)
        if (!matchTitle && !matchNote && !matchTopic && !matchSkill) return false
      }

      return true
    })
  }, [items, activeTab, searchQuery])

  // Summary counts
  const counts = useMemo(() => {
    const total = items.length
    const passages = items.filter(i => i.contentType === 'passage').length
    const lessons = items.filter(i => i.contentType === 'lesson').length
    const assessments = items.filter(i => i.contentType === 'assessment').length
    const completed = items.filter(i => i.status === 'completed' || i.submissionStatus === 'SUBMITTED' || i.submissionStatus === 'REVIEWED').length
    const pending = total - completed
    return { total, passages, lessons, assessments, completed, pending: Math.max(0, pending) }
  }, [items])

  const getDueStatus = (dueDateStr?: string | null, isCompleted?: boolean) => {
    if (isCompleted) {
      return { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    }
    if (!dueDateStr) {
      return { label: 'Assigned', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    }
    const due = new Date(dueDateStr).getTime()
    const now = Date.now()
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)}d`, color: 'bg-red-100 text-red-700 border-red-200' }
    }
    if (diffDays === 0) {
      return { label: 'Due Today', color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' }
    }
    if (diffDays === 1) {
      return { label: 'Due Tomorrow', color: 'bg-amber-100 text-amber-800 border-amber-300' }
    }
    if (diffDays <= 3) {
      return { label: `Due in ${diffDays} days`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    }
    return { label: `Due in ${diffDays} days`, color: 'bg-blue-50 text-blue-700 border-blue-200' }
  }

  return (
    <StudentLayout>
      <div className="space-y-6 animate-in pb-12">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a2a] via-[#224d38] to-[#2d6a4f] p-6 sm:p-8 text-white shadow-xl border border-[#2d6a4f]/40">
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-[#d4a017]/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/40 mb-3 tracking-wide">
                <span>📋</span> LEARNING TASKS & ASSESSMENTS
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Your Assigned Work
              </h1>
              <p className="text-emerald-100/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                Complete your assigned reading passages, guided lessons, and official assessments to earn XP and level up your reading mastery.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center min-w-[85px]">
                <span className="block text-[10px] text-emerald-200/80 font-bold uppercase tracking-wider">To Do</span>
                <span className="text-xl sm:text-2xl font-black text-amber-300">{counts.pending}</span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center min-w-[85px]">
                <span className="block text-[10px] text-emerald-200/80 font-bold uppercase tracking-wider">Tests</span>
                <span className="text-xl sm:text-2xl font-black text-white">{counts.assessments}</span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center min-w-[85px]">
                <span className="block text-[10px] text-emerald-200/80 font-bold uppercase tracking-wider">Done</span>
                <span className="text-xl sm:text-2xl font-black text-[#6ee7b7]">{counts.completed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All Tasks ({counts.total})
            </button>
            <button
              onClick={() => setActiveTab('passage')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'passage'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>📖</span> Passages ({counts.passages})
            </button>
            <button
              onClick={() => setActiveTab('lesson')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'lesson'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>📘</span> Lessons ({counts.lessons})
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'assessment'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>📋</span> Assessments ({counts.assessments})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>✅</span> Completed ({counts.completed})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center shadow-xs">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#2d6a4f] border-t-transparent mb-4" />
            <p className="text-base font-semibold text-gray-800">Loading your assignments...</p>
            <p className="text-xs text-gray-400 mt-1">Retrieving passages, lessons, and tests</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
            <span className="text-4xl mb-3 block">⚠️</span>
            <h3 className="text-lg font-bold text-red-900 mb-1">Could not load assignments</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={loadAssignments}
              className="px-5 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 py-16 px-6 text-center shadow-xs max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">
              🎉
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {activeTab === 'completed'
                ? 'No completed tasks yet'
                : searchQuery
                ? 'No matching assignments found'
                : 'You are completely caught up!'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
              {activeTab === 'completed'
                ? 'Once you finish reading practice or submit an assessment, it will show up here.'
                : searchQuery
                ? 'Try searching with a different keyword or switch to All Tasks.'
                : 'Great job! New assignments and assessments will appear here whenever your admin or teacher assigns them.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <Link
                to="/student/reading-practice"
                className="px-4 py-2 bg-[#1a3a2a] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#2d6a4f] transition-all"
              >
                Explore Reading Library
              </Link>
              <Link
                to="/student/dashboard"
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredItems.map(item => {
              const isCompleted = item.status === 'completed' || item.submissionStatus === 'SUBMITTED' || item.submissionStatus === 'REVIEWED'
              const dueInfo = getDueStatus(item.dueDate, isCompleted)

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-gray-200/80 hover:border-[#2d6a4f]/40 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Type Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          item.contentType === 'assessment'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : item.contentType === 'lesson'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          <span>
                            {item.contentType === 'assessment' ? '📋' : item.contentType === 'lesson' ? '📘' : '📖'}
                          </span>
                          <span className="uppercase tracking-wider">
                            {item.contentType === 'assessment'
                              ? 'Assessment'
                              : item.contentType === 'lesson'
                              ? 'Lesson'
                              : 'Passage'}
                          </span>
                        </span>

                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          {item.grade.replace('GRADE_', 'Grade ')}
                        </span>
                      </div>

                      {/* Due date / Status pill */}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${dueInfo.color}`}>
                        {dueInfo.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#1a3a2a] transition-colors leading-snug">
                      {item.title}
                    </h2>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2 font-medium">
                      <span>Assigned {new Date(item.assignedAt).toLocaleDateString()}</span>
                      {item.details?.wordCount ? (
                        <span>• {item.details.wordCount} words</span>
                      ) : null}
                      {item.details?.difficulty ? (
                        <span>• {item.details.difficulty}</span>
                      ) : null}
                      {item.details?.topic ? (
                        <span>• Topic: {item.details.topic}</span>
                      ) : null}
                      {item.details?.skillArea ? (
                        <span>• Skill: {item.details.skillArea.replace(/_/g, ' ')}</span>
                      ) : null}
                    </div>

                    {/* Content Preview */}
                    {item.details?.preview ? (
                      <p className="mt-3.5 text-xs sm:text-sm text-gray-600 bg-gray-50/80 border border-gray-100 rounded-2xl p-3.5 italic leading-relaxed line-clamp-2">
                        "{item.details.preview}"
                      </p>
                    ) : item.details?.passage ? (
                      <p className="mt-3.5 text-xs sm:text-sm text-gray-600 bg-gray-50/80 border border-gray-100 rounded-2xl p-3.5 italic leading-relaxed line-clamp-2">
                        "{item.details.passage.slice(0, 140)}..."
                      </p>
                    ) : null}

                    {/* Teacher note */}
                    {item.note ? (
                      <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                        <span className="text-base flex-shrink-0">💬</span>
                        <div>
                          <span className="font-bold block text-amber-950">Instructions:</span>
                          <span className="leading-relaxed">{item.note}</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Score & Valuation Pill if completed assessment */}
                    {item.overallScore !== undefined && item.overallScore !== null && (
                      <div className="mt-3.5 p-3.5 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 rounded-2xl border border-emerald-200">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-2xs">
                            <span>🏆</span> Result: {item.overallScore} / 100
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                            {item.overallScore >= 90 ? 'Advanced Reader' : item.overallScore >= 75 ? 'Proficient' : item.overallScore >= 60 ? 'Developing' : 'Needs Support'}
                          </span>
                        </div>

                        {/* Subskills if present */}
                        {(item.details?.fluencyScore !== undefined || item.details?.accuracyScore !== undefined || item.details?.comprehensionScore !== undefined) && (
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-100 text-center">
                            {item.details?.fluencyScore !== undefined && (
                              <div className="bg-white/80 p-1.5 rounded-xl border border-emerald-100">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase">Fluency</span>
                                <span className="text-xs font-extrabold text-[#1a3a2a]">{item.details.fluencyScore}%</span>
                              </div>
                            )}
                            {item.details?.accuracyScore !== undefined && (
                              <div className="bg-white/80 p-1.5 rounded-xl border border-emerald-100">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase">Accuracy</span>
                                <span className="text-xs font-extrabold text-blue-700">{item.details.accuracyScore}%</span>
                              </div>
                            )}
                            {item.details?.comprehensionScore !== undefined && (
                              <div className="bg-white/80 p-1.5 rounded-xl border border-emerald-100">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase">Comprehension</span>
                                <span className="text-xs font-extrabold text-purple-700">{item.details.comprehensionScore}%</span>
                              </div>
                            )}
                          </div>
                        )}

                        {item.details?.feedback && (
                          <p className="mt-2 text-xs text-gray-600 italic leading-relaxed border-l-2 border-emerald-500 pl-2">
                            "{item.details.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action CTA Button */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {item.contentType === 'passage' ? (
                      <Link
                        to={`/student/reading-practice`}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-sm"
                      >
                        <span>📖</span>
                        <span>Start Reading Practice</span>
                        <span>→</span>
                      </Link>
                    ) : item.contentType === 'lesson' ? (
                      <Link
                        to="/student/plan"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#2d6a4f] hover:bg-[#1a3a2a] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-sm"
                      >
                        <span>📘</span>
                        <span>Open Guided Lesson</span>
                        <span>→</span>
                      </Link>
                    ) : (
                      /* Assessment */
                      isCompleted ? (
                        <div className="flex items-center gap-2">
                          <Link
                            to="/student/assessment-feedback"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs text-center"
                          >
                            <span>📋</span>
                            <span>View Valuation & Feedback</span>
                          </Link>
                          {item.contentId && (
                            <Link
                              to={`/student/assessments/${item.contentId}`}
                              className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors text-center"
                            >
                              <span>🎧</span>
                              <span>Review</span>
                            </Link>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (item.contentId) {
                              navigate(`/student/assessments/${item.contentId}`)
                            } else {
                              navigate('/student/assessment')
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-sm bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white"
                        >
                          <span>📋</span>
                          <span>Take Reading Assessment</span>
                          <span>→</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
