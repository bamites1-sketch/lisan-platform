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
    <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
            <span>📋</span> Assigned to You
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Curated lessons and passages for Grade {profile?.grade?.replace('GRADE_', '')}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#1a3a2a] bg-[#e8f4f0] border border-[#2d6a4f]/20 px-3 py-1 rounded-full">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map(item => {
          const isOpen = expanded === item.id
          const diff = item.contentDifficulty ?? 'MEDIUM'

          return (
            <div key={item.id} className="border border-[#2d6a4f]/25 bg-gradient-to-r from-[#e8f4f0]/40 to-white rounded-2xl overflow-hidden transition-all shadow-2xs">
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="w-full flex items-start gap-3.5 p-4 text-left hover:bg-[#e8f4f0]/30 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-xs ${
                  item.contentType === 'passage' ? 'bg-[#e8f4f0] text-[#1a3a2a]' : 'bg-[#f5f0e8] text-[#936605]'
                }`}>
                  {item.contentType === 'passage' ? '📖' : '🎓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#1a3a2a]">{item.contentTitle}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${DIFF_COLORS[diff] ?? DIFF_COLORS.MEDIUM}`}>
                      {diff.charAt(0) + diff.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 capitalize">{item.contentType}</span>
                    {item.contentWordCount && <span className="text-xs text-gray-400">· {item.contentWordCount} words</span>}
                    {item.note && <span className="text-xs text-[#2d6a4f] font-semibold">· "{item.note}"</span>}
                    {item.dueDate && (
                      <span className="text-xs text-amber-600 font-semibold">
                        · Due {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[#2d6a4f] flex-shrink-0 mt-1 font-bold text-xs">{isOpen ? '▲' : '▼'}</span>
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
