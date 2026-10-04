import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { StudentProfile } from '../../types'
import { apiUrl } from '../../lib/apiBase'

interface Assignment {
  id: string
  contentType: 'passage' | 'lesson' | 'assessment'
  contentId: string
  submissionId?: string
  grade: string
  assignedAt: string
  assignedBy?: string
  dueDate?: string | null
  note?: string | null
  status: string
  submissionStatus?: 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED' | string
  overallScore?: number | null
  reviewedAt?: string | null
  feedback?: string | null
  // resolved content fields
  contentTitle?: string
  contentDifficulty?: string
  contentWordCount?: number
  contentText?: string
  contentExplanation?: string
  contentTips?: string
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

const DIFF_COLORS: Record<string, string> = {
  EASY:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM:   'bg-amber-50 text-amber-700 border-amber-200',
  HARD:     'bg-rose-50 text-rose-700 border-rose-200',
  ADVANCED: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function AssignedContent() {
  const { user } = useAuth()
  const profile = user?.profile as StudentProfile | undefined

  const [items, setItems] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.grade) return

    const load = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('lisan_token') ?? ''
        const headers = { Authorization: `Bearer ${token}` }

        // Fetch assignments via the student-scoped endpoint (grade-filtered server-side)
        const aRes = await fetch(apiUrl('/api/students/assignments'), { headers })
        if (!aRes.ok) return
        const aJson = await aRes.json()
        const all: any[] = Array.isArray(aJson.data) ? aJson.data : (aJson.data?.assignments ?? [])

        if (all.length === 0) { setItems([]); return }

        // Resolve passages and lessons for rich previews
        const contentRes = await fetch(apiUrl('/api/students/content'), { headers })
        const contentData = contentRes.ok ? (await contentRes.json()).data ?? {} : {}
        const passages: Record<string, any>[] = contentData.passages ?? []
        const lessons:  Record<string, any>[] = contentData.lessons ?? []

        const resolved: Assignment[] = all.map(a => {
          if (a.contentType === 'assessment') {
            const passageText = a.details?.passage || ''
            const wordCount = passageText ? passageText.split(/\s+/).filter(Boolean).length : undefined

            return {
              ...a,
              contentTitle: a.title || a.details?.title || 'Reading Assessment',
              contentDifficulty: a.grade || 'GRADE',
              contentWordCount: wordCount,
              contentText: passageText,
              contentExplanation: a.details?.instructions || a.note || undefined,
            }
          }

          const content = a.contentType === 'passage'
            ? passages.find(p => p.id === a.contentId)
            : lessons.find(l => l.id === a.contentId)

          return {
            ...a,
            contentTitle:       a.title || (content?.title as string) || a.contentId,
            contentDifficulty:  (content?.difficulty as string) ?? a.details?.difficulty ?? 'MEDIUM',
            contentWordCount:   (content?.wordCount as number) ?? a.details?.wordCount ?? undefined,
            contentText:        (content?.content as string) ?? a.details?.preview ?? undefined,
            contentExplanation: (content?.explanation as string) ?? undefined,
            contentTips:        (content?.tips as string) ?? undefined,
          }
        })

        setItems(resolved)
      } catch {
        // Non-fatal — fail gracefully
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.grade])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded-lg mb-4" />
        <div className="h-20 bg-gray-50 rounded-2xl border border-gray-100" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#e8f4f0] text-[#1a3a2a] flex items-center justify-center font-bold text-sm">
              📋
            </span>
            <div>
              <h2 className="text-base font-bold text-[#1a3a2a]">Assigned Work & Curriculum</h2>
              <p className="text-xs text-gray-500">Curated specifically for your grade level</p>
            </div>
          </div>
        </div>
        <div className="text-center py-6 bg-[#f8faf9] rounded-2xl border border-dashed border-gray-200">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-xs font-bold text-gray-700">All caught up!</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Any new assessments, reading passages, or guided lessons assigned by your administrator will appear right here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/20 mb-1 tracking-wider uppercase">
            <span>✨</span> CURATED ASSIGNMENTS
          </div>
          <h2 className="text-lg font-extrabold text-[#1a3a2a] flex items-center gap-2">
            <span>📋</span> Assigned to You
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Admin assigned passages, lessons, and reading assessments for Grade {profile?.grade?.replace('GRADE_', '')}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-extrabold text-[#1a3a2a] bg-[#e8f4f0] border border-[#2d6a4f]/20 px-3 py-1 rounded-full shadow-2xs">
            {items.length} assigned item{items.length !== 1 ? 's' : ''}
          </span>
          <Link
            to="/student/assignments"
            className="text-xs font-bold text-[#2d6a4f] hover:text-[#1a3a2a] hover:underline transition-colors"
          >
            View all →
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const isOpen = expanded === item.id
          const diff = item.contentDifficulty ?? 'MEDIUM'
          const isAssessment = item.contentType === 'assessment'
          const isPassage = item.contentType === 'passage'
          const isLesson = item.contentType === 'lesson'
          const isEvaluated = item.submissionStatus === 'REVIEWED' || (item.overallScore !== null && item.overallScore !== undefined)
          const isSubmitted = item.submissionStatus === 'SUBMITTED'

          return (
            <div
              key={item.id}
              className={`border rounded-2xl overflow-hidden transition-all shadow-2xs ${
                isEvaluated
                  ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/50 via-white to-white'
                  : isSubmitted
                  ? 'border-amber-200 bg-gradient-to-r from-amber-50/40 via-white to-white'
                  : 'border-[#2d6a4f]/25 bg-gradient-to-r from-[#e8f4f0]/35 via-white to-white'
              }`}
            >
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Category Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-xs border ${
                    isAssessment
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : isPassage
                      ? 'bg-[#e8f4f0] text-[#1a3a2a] border-[#2d6a4f]/25'
                      : 'bg-[#fef9c3] text-[#854d0e] border-amber-200'
                  }`}>
                    {isAssessment ? '📋' : isPassage ? '📖' : '🎓'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isAssessment
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : isPassage
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {isAssessment ? 'Assessment' : isPassage ? 'Passage' : 'Lesson'}
                      </span>

                      <h3 className="text-sm sm:text-base font-bold text-[#1a3a2a] truncate">
                        {item.contentTitle}
                      </h3>

                      {diff && !isAssessment && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${DIFF_COLORS[diff] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {diff}
                        </span>
                      )}

                      {/* Status Badges */}
                      {isEvaluated && item.overallScore !== null && item.overallScore !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                          <span>🏆</span> Result: {item.overallScore}/100
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ Under Review
                        </span>
                      ) : null}
                    </div>

                    {/* Meta info row */}
                    <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 flex-wrap font-medium">
                      <span>Assigned {new Date(item.assignedAt).toLocaleDateString()}</span>
                      {item.contentWordCount && (
                        <span>· {item.contentWordCount} words</span>
                      )}
                      {item.dueDate && (
                        <span className="text-amber-700 font-bold">
                          · Due {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {item.note && (
                        <span className="text-[#2d6a4f] italic truncate max-w-xs">
                          · "{item.note}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="p-2 rounded-xl text-gray-500 hover:text-[#1a3a2a] hover:bg-gray-100 text-xs font-bold transition-colors"
                    title={isOpen ? 'Collapse preview' : 'Expand preview'}
                  >
                    {isOpen ? 'Close ▲' : 'Details ▼'}
                  </button>

                  {isAssessment ? (
                    isEvaluated ? (
                      <Link
                        to="/student/assessment-feedback"
                        className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>🏆</span>
                        <span>Valuation & Feedback</span>
                        <span>→</span>
                      </Link>
                    ) : isSubmitted ? (
                      <Link
                        to={`/student/assessments/${item.contentId}`}
                        className="py-2 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>🎧</span>
                        <span>Review Submission</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/student/assessments/${item.contentId}`}
                        className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>🎙️</span>
                        <span>Take Assessment</span>
                        <span>→</span>
                      </Link>
                    )
                  ) : isPassage ? (
                    <Link
                      to="/student/reading-practice"
                      className="py-2 px-3.5 rounded-xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span>📖</span>
                      <span>Read Passage</span>
                      <span>→</span>
                    </Link>
                  ) : (
                    <Link
                      to="/student/plan"
                      className="py-2 px-3.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1a3a2a] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span>📘</span>
                      <span>Open Lesson</span>
                      <span>→</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Expandable Content Drawer */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100/80 bg-white/70 animate-in">
                  {/* Evaluated Score Breakdown */}
                  {isEvaluated && item.overallScore !== null && item.overallScore !== undefined && (
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl mb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <span className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                          <span>🏆</span> Official Valuation Result: {item.overallScore} / 100
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          {item.overallScore >= 90 ? 'Mastery / Advanced' : item.overallScore >= 75 ? 'Proficient' : item.overallScore >= 60 ? 'Developing' : 'Needs Support'}
                        </span>
                      </div>
                      {item.feedback && (
                        <p className="text-xs text-emerald-950 italic border-l-2 border-emerald-600 pl-2.5 mt-1 leading-relaxed">
                          "{item.feedback}"
                        </p>
                      )}
                    </div>
                  )}

                  {item.contentText && (
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 mb-3 max-h-36 overflow-y-auto">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Passage Preview</p>
                      <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{item.contentText}</p>
                    </div>
                  )}

                  {item.contentExplanation && (
                    <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/70 mb-3">
                      <p className="text-xs font-bold text-amber-900 mb-0.5">Instructions & Goals</p>
                      <p className="text-xs text-amber-800 leading-relaxed">{item.contentExplanation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>Assigned {new Date(item.assignedAt).toLocaleDateString()} {item.assignedBy ? `by ${item.assignedBy}` : ''}</span>
                    <span className="font-medium text-gray-500">Grade: {item.grade.replace('GRADE_', '')}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
