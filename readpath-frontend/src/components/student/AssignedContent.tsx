import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { StudentProfile } from '../../types'

interface Assignment {
  id: string
  contentType: 'passage' | 'lesson'
  contentId: string
  grade: string
  assignedAt: string
  assignedBy: string
  dueDate?: string
  note?: string
  status: string
  // resolved content fields (fetched separately)
  contentTitle?: string
  contentDifficulty?: string
  contentWordCount?: number
  contentText?: string
  contentExplanation?: string
  contentTips?: string
}

const DIFF_COLORS: Record<string, string> = {
  EASY:     'bg-success-100 text-success-700',
  MEDIUM:   'bg-warning-100 text-warning-700',
  HARD:     'bg-danger-100 text-danger-700',
  ADVANCED: 'bg-purple-100 text-purple-700',
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
        const aRes = await fetch('/api/students/assignments', { headers })
        if (!aRes.ok) return
        const aJson = await aRes.json()
        const all: Assignment[] = aJson.data ?? []

        if (all.length === 0) { setItems([]); return }

        // Resolve content from the student-scoped, access-controlled endpoint.
        const contentRes = await fetch('/api/students/content', { headers })
        const contentData = contentRes.ok ? (await contentRes.json()).data ?? {} : {}
        const passages: Record<string, unknown>[] = contentData.passages ?? []
        const lessons:  Record<string, unknown>[] = contentData.lessons ?? []

        const resolved = all.map(a => {
          const content = a.contentType === 'passage'
            ? passages.find(p => p.id === a.contentId)
            : lessons.find(l => l.id === a.contentId)
          return {
            ...a,
            contentTitle:       (content?.title       as string) ?? a.contentId,
            contentDifficulty:  (content?.difficulty  as string) ?? 'MEDIUM',
            contentWordCount:   (content?.wordCount   as number) ?? undefined,
            contentText:        (content?.content     as string) ?? undefined,
            contentExplanation: (content?.explanation as string) ?? undefined,
            contentTips:        (content?.tips        as string) ?? undefined,
          }
        })

        setItems(resolved)
      } catch {
        // Non-fatal — silently hide the section
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.grade])

  if (loading || items.length === 0) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            📋 Assigned to You
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Content assigned for Grade {profile?.grade?.replace('GRADE_', '')}
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map(item => {
          const isOpen = expanded === item.id
          const diff = item.contentDifficulty ?? 'MEDIUM'

          return (
            <div key={item.id} className="border border-brand-200 bg-brand-50 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="w-full flex items-start gap-3 p-4 text-left"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  item.contentType === 'passage' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {item.contentType === 'passage' ? '📖' : '🎓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{item.contentTitle}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[diff] ?? DIFF_COLORS.MEDIUM}`}>
                      {diff.charAt(0) + diff.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 capitalize">{item.contentType}</span>
                    {item.contentWordCount && <span className="text-xs text-gray-400">· {item.contentWordCount} words</span>}
                    {item.note && <span className="text-xs text-brand-600 font-medium">· "{item.note}"</span>}
                    {item.dueDate && (
                      <span className="text-xs text-orange-600 font-medium">
                        · Due {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-gray-400 flex-shrink-0 mt-1">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 animate-in">
                  {item.contentText && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 mb-3 max-h-36 overflow-y-auto">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{item.contentText}</p>
                    </div>
                  )}
                  {item.contentExplanation && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 mb-3">
                      <p className="text-xs text-gray-700 leading-relaxed">{item.contentExplanation}</p>
                      {item.contentTips && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 mb-1">💡 Tips</p>
                          <p className="text-xs text-gray-500">{item.contentTips}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Assigned {new Date(item.assignedAt).toLocaleDateString()}
                    {item.assignedBy && ` by ${item.assignedBy}`}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
