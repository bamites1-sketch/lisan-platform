import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import StudentLayout from '../../components/layout/StudentLayout'
import ReadinessGauge from '../../components/ui/ReadinessGauge'
import type { ReadingProfile, StudentProfile } from '../../types'
import { skillLabel, skillEmoji, scoreColor, scoreStatusLabel, formatDate, gradeLabel } from '../../lib/utils'

// Backend returns a flat history item from ReadingProfile
interface ProfileHistoryItem {
  id: string
  readinessScore: number
  phonemicAwarenessScore: number
  phonicsDecodingScore: number
  fluencyScore: number
  vocabularyScore: number
  comprehensionScore: number
  createdAt: string
}

const SKILL_KEYS = [
  { key: 'phonemicAwarenessScore' as const, area: 'PHONEMIC_AWARENESS' as const },
  { key: 'phonicsDecodingScore' as const,   area: 'PHONICS_DECODING' as const },
  { key: 'fluencyScore' as const,           area: 'FLUENCY' as const },
  { key: 'vocabularyScore' as const,        area: 'VOCABULARY' as const },
  { key: 'comprehensionScore' as const,     area: 'COMPREHENSION' as const },
]

function parseProfile(raw: Record<string, unknown>): ReadingProfile {
  return {
    ...raw,
    strengths:       typeof raw.strengths === 'string'       ? JSON.parse(raw.strengths)       : (raw.strengths ?? []),
    weaknesses:      typeof raw.weaknesses === 'string'      ? JSON.parse(raw.weaknesses)      : (raw.weaknesses ?? []),
    priorities:      typeof raw.priorities === 'string'      ? JSON.parse(raw.priorities)      : (raw.priorities ?? []),
    recommendations: typeof raw.recommendations === 'string' ? JSON.parse(raw.recommendations) : (raw.recommendations ?? []),
  } as ReadingProfile
}

export default function ReadingProfilePage() {
  const { user } = useAuth()
  const profile = user?.profile as StudentProfile
  const [data, setData] = useState<ReadingProfile | null>(null)
  const [history, setHistory] = useState<ProfileHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'profile' | 'history'>('profile')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profiles/current', {
          headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` }
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.message || `Server error ${res.status}`)
        }
        const j = await res.json()
        if (!j.success) throw new Error(j.message || 'Failed to load profile')
        if (j.data) setData(parseProfile(j.data))
        // null data → no assessment yet — handled by empty state
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reading profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadHistory = async () => {
    if (history.length > 0) return
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/profiles/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` }
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const j = await res.json()
      if (j.success && Array.isArray(j.data)) setHistory(j.data)
    } catch {
      // non-fatal; empty state will show
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleTabChange = (t: 'profile' | 'history') => {
    setTab(t)
    if (t === 'history') loadHistory()
  }

  const targetGradeNum = parseInt((profile?.grade ?? 'GRADE_6').replace('GRADE_', '')) + 1
  const targetGrade = targetGradeNum > 12 ? 'Senior / College' : `Grade ${targetGradeNum}`

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    </StudentLayout>
  )

  if (error) return (
    <StudentLayout>
      <div className="max-w-lg mx-auto text-center py-20 animate-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Could not load your reading profile</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    </StudentLayout>
  )

  if (!data) return (
    <StudentLayout>
      <div className="max-w-lg mx-auto text-center py-20 animate-in">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No reading profile yet</h1>
        <p className="text-gray-500 mb-6">Your reading profile will appear after your first assessment.</p>
        <Link to="/student/assessment" className="btn-primary">Start Assessment →</Link>
      </div>
    </StudentLayout>
  )

  return (
    <StudentLayout>
      <div className="space-y-6 animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title">📊 Your Reading Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile?.firstName}'s full reading assessment — {formatDate(data.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/student/plan" className="btn-primary text-sm py-2.5">View My Plan →</Link>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {(['profile', 'history'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'profile' ? '📊 Profile' : '📈 Progress History'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <div className="card bg-gradient-to-br from-brand-600 to-brand-700 border-0 text-white">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white/10 rounded-3xl p-5">
                  <ReadinessGauge score={data.readinessScore} targetGrade={targetGrade} size="lg" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold mb-1">{targetGrade} Reading Readiness</h2>
                  <p className="text-brand-200 text-sm mb-4 leading-relaxed">
                    {data.readinessScore >= 80
                      ? `${profile?.firstName}, you're reading at a strong level. Keep building your skills!`
                      : data.readinessScore >= 65
                      ? `You're developing well! A few more weeks of focused practice will push you higher.`
                      : `You're on the right path. Your personalized plan will help you grow quickly from here.`}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="text-xs bg-white/20 px-3 py-1.5 rounded-full font-medium">
                      {gradeLabel(data.currentGrade)} Student
                    </span>
                    <span className="text-xs bg-white/20 px-3 py-1.5 rounded-full font-medium">
                      Assessed {formatDate(data.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="section-title mb-5">Skill Breakdown</h2>
              <div className="space-y-4">
                {SKILL_KEYS.map(({ key, area }) => {
                  const score = data[key]
                  const color = scoreColor(score)
                  const barColor = score >= 75 ? 'bg-success-500' : score >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                  return (
                    <div key={area}>
                      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{skillEmoji(area)}</span>
                          <span className="text-sm font-semibold text-gray-800">{skillLabel(area)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{scoreStatusLabel(score)}</span>
                          <span className="text-sm font-bold" style={{ color }}>{score}/100</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-2.5 rounded-full ${barColor} transition-all duration-700`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {data.strengths.length > 0 && (
              <div className="card border-l-4 border-success-400">
                <h2 className="section-title mb-4">💪 Your Strengths</h2>
                <div className="space-y-3">
                  {data.strengths.map(s => (
                    <div key={s.skill} className="flex items-start gap-3 p-3 bg-success-50 rounded-xl">
                      <span className="text-success-600 text-xl mt-0.5">✓</span>
                      <div>
                        <p className="text-sm font-bold text-success-900">{s.skill} — {s.score}/100</p>
                        <p className="text-sm text-success-700 mt-0.5">{s.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.weaknesses.length > 0 && (
              <div className="card border-l-4 border-warning-400">
                <h2 className="section-title mb-4">🎯 Focus Areas</h2>
                <div className="space-y-3">
                  {data.weaknesses.map(w => (
                    <div key={w.skill} className="flex items-start gap-3 p-3 bg-warning-50 rounded-xl">
                      <span className="text-warning-600 text-xl mt-0.5">⚠</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-warning-900">{w.skill} — {w.score}/100</p>
                        <p className="text-sm text-warning-700 mt-0.5">{w.message}</p>
                      </div>
                      <Link
                        to={`/student/practice/${w.skill.toLowerCase().replace(/ /g, '_').replace('&', '').replace('__', '_')}`}
                        className="text-xs font-semibold text-brand-600 bg-white border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 flex-shrink-0"
                      >
                        Practice
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recommendations.length > 0 && (
              <div className="card">
                <h2 className="section-title mb-4">📋 What We Recommend</h2>
                <div className="space-y-4">
                  {data.recommendations.map(r => (
                    <div key={r.skill} className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
                      <p className="text-sm font-bold text-brand-900 mb-1">{skillEmoji(r.skill as import('../../types').SkillArea)} {skillLabel(r.skill as import('../../types').SkillArea)}</p>
                      <p className="text-sm text-brand-800 mb-3">{r.message}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.activities.map(a => (
                          <span key={a} className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                            {a.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card bg-brand-600 border-0 text-center py-8">
              <p className="text-white font-bold text-lg mb-2">Ready to start improving?</p>
              <p className="text-brand-200 text-sm mb-5">Your personalized learning plan is waiting. It's built specifically around your focus areas.</p>
              <Link to="/student/plan" className="inline-block bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors">
                Go to My Learning Plan →
              </Link>
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="card">
            <h2 className="section-title mb-6">📈 Assessment History</h2>

            {historyLoading && (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📊</p>
                <p className="font-semibold text-gray-700">No assessment history yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete assessments to see your progress over time.</p>
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="space-y-4">
                {history.map((h, i) => {
                  const isLatest = i === history.length - 1
                  const prev = i > 0 ? history[i - 1] : null
                  const improvement = prev ? h.readinessScore - prev.readinessScore : null
                  return (
                    <div key={h.id} className={`p-4 rounded-2xl border ${isLatest ? 'border-brand-200 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-800">{formatDate(h.createdAt)}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${isLatest ? 'text-brand-600' : 'text-gray-600'}`}>{h.readinessScore}/100</span>
                          {improvement !== null && improvement > 0 && (
                            <span className="text-xs text-success-600 font-semibold bg-success-100 px-2 py-0.5 rounded-full">+{improvement} pts</span>
                          )}
                          {improvement !== null && improvement < 0 && (
                            <span className="text-xs text-danger-600 font-semibold bg-danger-100 px-2 py-0.5 rounded-full">{improvement} pts</span>
                          )}
                          {isLatest && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">Latest</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
                        {[
                          { label: '🔊', score: h.phonemicAwarenessScore },
                          { label: '🔤', score: h.phonicsDecodingScore },
                          { label: '🎤', score: h.fluencyScore },
                          { label: '📚', score: h.vocabularyScore },
                          { label: '🧠', score: h.comprehensionScore },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className="text-base">{s.label}</div>
                            <div className={`text-xs font-bold mt-0.5 ${s.score >= 75 ? 'text-success-600' : s.score >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>{s.score}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {history.length >= 2 && (() => {
                  const first = history[0], last = history[history.length - 1]
                  const diff = last.readinessScore - first.readinessScore
                  return diff > 0 ? (
                    <div className="mt-2 p-4 bg-success-50 border border-success-200 rounded-2xl text-center">
                      <p className="text-success-800 font-bold">🎉 Total improvement: +{diff} points</p>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
