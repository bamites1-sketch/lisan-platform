import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StudentLayout from '../../components/layout/StudentLayout'
import { useAuth } from '../../contexts/AuthContext'
import { studentApi, profileApi, type ApiProgressLog } from '../../services/api'
import type { StudentProfile } from '../../types'

// ─── Tiny SVG line chart ──────────────────────────────────────────────────────
function MiniLineChart({ data, color = '#2563eb', height = 120 }: {
  data: number[]; color?: string; height?: number
}) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-20 text-gray-400 text-sm">Not enough data yet</div>
  )
  const w = 400; const h = height
  const min = Math.min(...data) - 5
  const max = Math.max(...data) + 5
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((v - min) / range) * h
        return <circle key={i} cx={x} cy={y} r="4" fill={color} />
      })}
    </svg>
  )
}

// ─── Multi-line chart ─────────────────────────────────────────────────────────
function MultiLineChart({ datasets, labels, height = 180 }: {
  datasets: { name: string; data: number[]; color: string }[]
  labels: string[]
  height?: number
}) {
  const w = 400; const h = height
  const allVals = datasets.flatMap(d => d.data)
  if (allVals.length === 0) return (
    <div className="flex items-center justify-center h-20 text-gray-400 text-sm">No assessment history yet</div>
  )
  const min = Math.max(0, Math.min(...allVals) - 8)
  const max = Math.min(100, Math.max(...allVals) + 5)
  const range = max - min || 1
  const n = labels.length

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
        {[0, 25, 50, 75, 100].map(v => {
          if (v < min || v > max) return null
          const y = h - ((v - min) / range) * h
          return <line key={v} x1="0" y1={y} x2={w} y2={y} stroke="#f3f4f6" strokeWidth="1" />
        })}
        {datasets.map(ds => {
          if (n < 2) return null
          const pts = ds.data.map((v, i) => {
            const x = (i / (n - 1)) * w
            const y = h - ((v - min) / range) * h
            return `${x},${y}`
          }).join(' ')
          return (
            <g key={ds.name}>
              <polyline fill="none" stroke={ds.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
              {ds.data.map((v, i) => (
                <circle key={i} cx={(i / (n - 1)) * w} cy={h - ((v - min) / range) * h} r="3.5" fill={ds.color} />
              ))}
            </g>
          )
        })}
        {labels.map((l, i) => (
          <text key={i} x={n > 1 ? (i / (n - 1)) * w : 200} y={h + 16} textAnchor="middle" fontSize="11" fill="#9ca3af">{l}</text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 mt-3">
        {datasets.map(ds => (
          <div key={ds.name} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ds.color }} />
            {ds.name}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="card h-24 bg-gray-100" />)}
      </div>
      <div className="card h-48 bg-gray-100" />
      <div className="card h-64 bg-gray-100" />
    </div>
  )
}

interface ProfileSnapshot {
  readinessScore: number
  phonemicAwarenessScore: number
  phonicsDecodingScore: number
  fluencyScore: number
  vocabularyScore: number
  comprehensionScore: number
  createdAt: string
}

export default function ProgressPage() {
  const { user } = useAuth()
  const profile = user?.profile as StudentProfile | undefined

  const [progressLogs, setProgressLogs] = useState<ApiProgressLog[]>([])
  const [profileHistory, setProfileHistory] = useState<ProfileSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)

    Promise.all([
      studentApi.progress(ac.signal),
      profileApi.history(ac.signal) as Promise<ProfileSnapshot[]>,
    ])
      .then(([logs, history]) => {
        setProgressLogs(logs)
        setProfileHistory(history)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load progress data')
          setLoading(false)
        }
      })

    return () => ac.abort()
  }, [])

  // Readiness time-series from progress logs
  const readinessLogs = progressLogs.filter(p => p.metric === 'READINESS_SCORE')
  const readinessData   = readinessLogs.map(p => p.value)
  const readinessLabels = readinessLogs.map(p =>
    new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )

  const latestScore  = profileHistory[0]?.readinessScore ?? 0
  const firstScore   = profileHistory[profileHistory.length - 1]?.readinessScore ?? 0
  const improvement  = latestScore - firstScore

  // Skill history across assessments
  const skillLabels = profileHistory.map((_, i) =>
    `Assessment ${profileHistory.length - i}`
  ).reverse()

  const multiDatasets = [
    { name: 'Phonemic', color: '#a855f7', data: [...profileHistory].reverse().map(h => h.phonemicAwarenessScore) },
    { name: 'Phonics',  color: '#3b82f6', data: [...profileHistory].reverse().map(h => h.phonicsDecodingScore) },
    { name: 'Fluency',  color: '#f97316', data: [...profileHistory].reverse().map(h => h.fluencyScore) },
    { name: 'Vocab',    color: '#22c55e', data: [...profileHistory].reverse().map(h => h.vocabularyScore) },
    { name: 'Comp',     color: '#6366f1', data: [...profileHistory].reverse().map(h => h.comprehensionScore) },
  ]

  // Before/After: latest vs. first profile
  const latest = profileHistory[0]
  const first  = profileHistory[profileHistory.length - 1]
  const beforeAfter = latest && first && profileHistory.length >= 2
    ? [
        { label: '🔊 Phonemic Awareness', before: first.phonemicAwarenessScore, after: latest.phonemicAwarenessScore, color: 'bg-purple-500' },
    { label: '🔤 Phonics & Decoding',   before: first.phonicsDecodingScore,   after: latest.phonicsDecodingScore,   color: 'bg-brand-500' },
        { label: '🎤 Reading Fluency',       before: first.fluencyScore,           after: latest.fluencyScore,           color: 'bg-orange-500' },
        { label: '📚 Vocabulary',             before: first.vocabularyScore,        after: latest.vocabularyScore,        color: 'bg-green-500' },
        { label: '🧠 Comprehension',          before: first.comprehensionScore,     after: latest.comprehensionScore,     color: 'bg-indigo-500' },
      ]
    : []

  const firstDate  = first  ? new Date(first.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const latestDate = latest ? new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <StudentLayout>
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="page-title">📈 Your Progress</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track how your reading has grown over time</p>
        </div>

        {error && (
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl text-danger-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {loading && <Skeleton />}

        {!loading && profileHistory.length === 0 && !error && (
          <div className="card text-center py-16">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold text-gray-700">No assessment data yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete your first assessment to see your progress here.</p>
            <Link to="/student/assessment" className="btn-primary text-sm inline-block mt-4">Take Assessment</Link>
          </div>
        )}

        {!loading && profileHistory.length > 0 && (
          <>
            {/* Score hero */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">First Score</p>
                <p className="text-3xl font-bold text-gray-600">{firstScore || '—'}</p>
                <p className="text-xs text-gray-400 mt-1">{firstDate}</p>
              </div>
              <div className="card text-center bg-brand-600 border-0">
                <p className="text-xs text-brand-200 font-medium uppercase tracking-wide mb-2">Total Improvement</p>
                <p className="text-3xl font-bold text-white">{improvement >= 0 ? '+' : ''}{improvement}</p>
                <p className="text-xs text-brand-300 mt-1">{profileHistory.length} assessment{profileHistory.length > 1 ? 's' : ''} 🎉</p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Latest Score</p>
                <p className="text-3xl font-bold text-brand-600">{latestScore || '—'}</p>
                <p className="text-xs text-gray-400 mt-1">{latestDate}</p>
              </div>
            </div>

            {/* Readiness over time */}
            {readinessData.length >= 2 && (
              <div className="card">
                <h2 className="section-title mb-1">Reading Readiness Over Time</h2>
                <p className="text-xs text-gray-400 mb-4">Score from {readinessData.length} progress checkpoints</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-bold text-brand-600">{latestScore}</span>
                  {improvement !== 0 && (
                    <span className={`text-sm font-semibold ${improvement > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {improvement > 0 ? '+' : ''}{improvement} pts {improvement > 0 ? '↑' : '↓'}
                    </span>
                  )}
                </div>
                <MiniLineChart data={readinessData} color="#2563eb" height={120} />
                <div className="flex justify-between text-xs text-gray-400 mt-1 overflow-hidden">
                  {readinessLabels.filter((_, i) => i % 2 === 0).map(l => <span key={l}>{l}</span>)}
                </div>
              </div>
            )}

            {/* Skill history */}
            {profileHistory.length >= 2 && (
              <div className="card">
                <h2 className="section-title mb-1">Skill Area Progress</h2>
                <p className="text-xs text-gray-400 mb-4">Changes across your {profileHistory.length} assessments</p>
                <MultiLineChart datasets={multiDatasets} labels={skillLabels} height={180} />
              </div>
            )}

            {/* Before vs After */}
            {beforeAfter.length > 0 && (
              <div className="card">
                <h2 className="section-title mb-5">Before vs. After</h2>
                <div className="space-y-4">
                  {beforeAfter.map(s => {
                    const gain = s.after - s.before
                    return (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-700">{s.label}</span>
                          <div className="flex items-center gap-2 text-sm flex-shrink-0">
                            <span className="text-gray-400">{s.before}</span>
                            <span className="text-gray-300">→</span>
                            <span className="font-bold text-gray-800">{s.after}</span>
                            {gain > 0 && <span className="text-xs font-bold text-success-600 bg-success-100 px-1.5 py-0.5 rounded-full">+{gain}</span>}
                            {gain < 0 && <span className="text-xs font-bold text-danger-600 bg-danger-100 px-1.5 py-0.5 rounded-full">{gain}</span>}
                          </div>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`absolute top-0 left-0 h-2 rounded-full opacity-30 ${s.color}`} style={{ width: `${s.before}%` }} />
                          <div className={`absolute top-0 left-0 h-2 rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.after}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Stats — always visible */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Assessments',     value: profileHistory.length,         emoji: '📝' },
              { label: 'Current Streak',  value: `${profile?.streakDays ?? 0} days`, emoji: '🔥' },
              { label: 'XP Earned',       value: `${profile?.xp ?? 0}`,         emoji: '⚡' },
              { label: 'Level',           value: `${profile?.level ?? 1}`,      emoji: '🏆' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reassess CTA */}
        <div className="card bg-gradient-to-r from-brand-50 to-success-50 border border-brand-200">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
            <div className="text-4xl flex-shrink-0">🏁</div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Ready to check your progress again?</h3>
              <p className="text-sm text-gray-600 mt-0.5">Take a new assessment and see how much you've improved.</p>
            </div>
            <Link to="/student/assessment" className="btn-primary text-sm flex-shrink-0 self-start xs:self-auto">
              Reassess
            </Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
