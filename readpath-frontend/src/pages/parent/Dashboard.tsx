import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { parentApi, type ApiChildDetail } from '../../services/api'
import type { ParentProfile } from '../../types'

// ─── Skill bar ────────────────────────────────────────────────────────────────
function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-32 sm:w-40 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${value >= 75 ? 'text-success-600' : value >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ChildSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-28 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-3 bg-gray-100 rounded" />)}
        </div>
      </div>
    </div>
  )
}

// ─── Single child card ────────────────────────────────────────────────────────
function ChildCard({ child }: { child: ApiChildDetail }) {
  const skills = [
    { label: '🔊 Phonemic Awareness', v: child.skillScores.phonemicAwareness, c: 'bg-purple-500' },
    { label: '🔤 Phonics',            v: child.skillScores.phonicsDecoding,    c: 'bg-brand-500'   },
    { label: '🎤 Fluency',            v: child.skillScores.fluency,            c: 'bg-orange-500' },
    { label: '📚 Vocabulary',         v: child.skillScores.vocabulary,         c: 'bg-green-500'  },
    { label: '🧠 Comprehension',      v: child.skillScores.comprehension,      c: 'bg-indigo-500' },
  ]

  return (
    <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 sm:px-6 py-5 text-white">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
              {child.firstName[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold">{child.firstName} {child.lastName}</h2>
              <p className="text-brand-200 text-sm">
                Grade {child.grade.replace('GRADE_', '')} · {child.streakDays}-day streak 🔥
              </p>
            </div>
          </div>
          <div className="text-right ml-auto">
            <div className="text-3xl font-bold">{child.currentScore || '—'}</div>
            <div className="text-brand-200 text-xs">Readiness Score</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Improvement */}
        {child.improvement > 0 && (
          <div className="flex items-center gap-4 p-4 bg-success-50 border border-success-200 rounded-2xl">
            <div className="text-3xl">📈</div>
            <div>
              <p className="font-bold text-success-900">+{child.improvement} point improvement!</p>
              <p className="text-sm text-success-700">
                {child.previousScore} → {child.currentScore} reading readiness score
              </p>
            </div>
          </div>
        )}

        {child.currentScore === 0 && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
            <div className="text-3xl">📋</div>
            <div>
              <p className="font-bold text-gray-700">Assessment not taken yet</p>
              <p className="text-sm text-gray-500">
                {child.firstName} hasn't completed their first reading assessment.
              </p>
            </div>
          </div>
        )}

        {/* Strengths / Weaknesses */}
        {(child.strengths.length > 0 || child.weaknesses.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {child.strengths.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">✅ Strong areas</p>
                {child.strengths.slice(0, 3).map(s => (
                  <div key={s} className="flex items-center gap-2 text-sm text-success-700 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-success-500 rounded-full flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            )}
            {child.weaknesses.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">⚠️ Needs support</p>
                {child.weaknesses.slice(0, 3).map(w => (
                  <div key={w} className="flex items-center gap-2 text-sm text-warning-700 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-warning-500 rounded-full flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skill bars */}
        {child.currentScore > 0 && (
          <div className="space-y-2.5">
            {skills.map(s => (
              <SkillBar key={s.label} label={s.label} value={s.v} color={s.c} />
            ))}
          </div>
        )}

        {/* Weekly goal */}
        {child.weeklyGoal && (
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
            <p className="text-sm font-semibold text-brand-900">📅 This week's goal</p>
            <p className="text-sm text-brand-700 mt-0.5">{child.weeklyGoal}</p>
          </div>
        )}

        {/* Gamification stats */}
        <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
            ⚡ {child.xp} XP
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
            🏆 {child.badges.length} badges
          </span>
          {child.streakDays > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
              🔥 {child.streakDays}-day streak
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const profile = user?.profile as ParentProfile | undefined

  const [children, setChildren] = useState<ApiChildDetail[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    parentApi.children(ac.signal)
      .then(data => { setChildren(data); setLoading(false) })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load children')
          setLoading(false)
        }
      })
    return () => ac.abort()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">ል</span>
          </div>
          <span className="font-bold text-gray-900">Lisan | ልሳን</span>
          <span className="hidden sm:inline text-gray-300 mx-1">·</span>
          <span className="hidden sm:inline text-sm text-gray-500">Parent Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">
            Hello, {profile?.firstName}
          </span>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👨‍👩‍👧 My Children</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your child's reading progress</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl text-danger-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <ChildSkeleton />
          </div>
        )}

        {/* No children linked yet */}
        {!loading && !error && children.length === 0 && (
          <div className="text-center py-20 card">
            <p className="text-5xl mb-4">👶</p>
            <p className="font-semibold text-gray-700 text-lg">No children linked yet</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Contact your school administrator to link your account to your child's profile.
            </p>
          </div>
        )}

        {/* Children list */}
        {!loading && children.map(child => (
          <ChildCard key={child.id} child={child} />
        ))}

        {/* At-home tips */}
        {!loading && children.length > 0 && (
          <div className="card bg-brand-50 border border-brand-200">
            <p className="text-sm font-semibold text-brand-900 mb-2">📖 How to help at home</p>
            <ul className="space-y-1.5">
              {[
                "Ask your child to read aloud to you for 10–15 minutes daily",
                "When they encounter a new word, ask \"What do you think it means?\" before explaining",
                "Celebrate effort and improvement, not just high scores",
                "Make reading fun — let them choose topics they're interested in",
              ].map((tip, i) => (
                <li key={i} className="text-sm text-brand-800 flex items-start gap-2">
                  <span className="text-brand-400 mt-0.5 flex-shrink-0">→</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
