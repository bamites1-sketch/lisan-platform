import { useState, useEffect } from 'react'
import { adminApi, recordingApi, type ApiStudent, type ApiTeacher, type ApiParent, type ApiRecording } from '../../services/api'
import { timeAgo } from '../../lib/utils'

function SvgBar({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 400, H = 120
  const barW = Math.floor((W - (data.length + 1) * 8) / data.length)
  const gap  = Math.floor((W - data.length * barW) / (data.length + 1))
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
      {data.map((d, i) => {
        const h = Math.max(4, Math.round((d.value / max) * H))
        const x = gap + i * (barW + gap)
        return (
          <g key={d.label}>
            <rect x={x} y={H - h} width={barW} height={h} fill={d.color} rx="4" opacity="0.85" />
            <text x={x + barW / 2} y={H - h - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{d.value}</text>
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [teachers, setTeachers] = useState<ApiTeacher[]>([])
  const [parents, setParents] = useState<ApiParent[]>([])
  const [recordings, setRecordings] = useState<ApiRecording[]>([])
  const [assignments, setAssignments] = useState<{ id: string; contentType: string; contentId: string; grade: string; assignedAt: string; status: string; contentTitle?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ac = new AbortController()
    const token = localStorage.getItem('lisan_token') ?? ''
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      adminApi.students(ac.signal),
      adminApi.teachers(ac.signal),
      adminApi.parents(ac.signal),
      recordingApi.forAdmin(),
      // Fetch assignments + content titles
      fetch('/api/admin/assignments', { headers, signal: ac.signal })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(j => j.data ?? []),
      fetch('/api/admin/content/passages', { headers, signal: ac.signal })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(j => j.data ?? []),
      fetch('/api/admin/content/lessons', { headers, signal: ac.signal })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(j => j.data ?? []),
    ])
      .then(([s, t, p, r, asgns, passages, lessons]) => {
        setStudents(s)
        setTeachers(t)
        setParents(p)
        setRecordings(r as ApiRecording[])
        // Resolve content titles
        const contentMap = new Map<string, string>()
        ;(passages as { id: string; title: string }[]).forEach(p => contentMap.set(p.id, p.title))
        ;(lessons  as { id: string; title: string }[]).forEach(l => contentMap.set(l.id, l.title))
        const resolved = (asgns as { id: string; contentType: string; contentId: string; grade: string; assignedAt: string; status: string }[])
          .filter(a => a.status !== 'archived')
          .map(a => ({ ...a, contentTitle: contentMap.get(a.contentId) ?? a.contentId }))
        setAssignments(resolved)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => ac.abort()
  }, [])
  const unreviewed  = recordings.filter(r => !r.reviewed)

  const assessed    = students.filter(s => (s.score ?? 0) > 0)
  const avgScore    = assessed.length > 0 ? Math.round(assessed.reduce((a, s) => a + (s.score ?? 0), 0) / assessed.length) : 0
  // Account status counts (replaces reading level status)
  const activeStudents  = students.filter(s => (s.userStatus ?? s.status) === 'ACTIVE').length
  const pendingPayment  = students.filter(s => ['PENDING', 'PAYMENT_PENDING'].includes(s.userStatus ?? s.status ?? '')).length
  const suspended       = students.filter(s => (s.userStatus ?? s.status) === 'SUSPENDED').length

  const gradeGroups: Record<string, number[]> = {}
  assessed.forEach(s => {
    const g = 'Gr ' + s.grade.replace('GRADE_', '')
    if (!gradeGroups[g]) gradeGroups[g] = []
    gradeGroups[g].push(s.score ?? 0)
  })
  const gradeData = Object.entries(gradeGroups)
    .sort((a, b) => parseInt(a[0].replace('Gr ','')) - parseInt(b[0].replace('Gr ','')))
    .map(([label, scores]) => {
      const avg = Math.round(scores.reduce((a,b) => a+b,0) / scores.length)
      return { label, value: avg, color: avg >= 75 ? '#22c55e' : avg >= 60 ? '#f59e0b' : '#ef4444' }
    })

  const recentlyActive = students.filter(s => Date.now() - new Date(s.lastActiveAt).getTime() < 86400000 * 7)

  return (
    <div className="space-y-6">
      <h1 className="page-title">Platform Overview</h1>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { emoji: '📖', label: 'Students', value: students.length, color: 'text-brand-600',  bg: 'bg-brand-50',  nav: 'users_students' },
          { emoji: '🧑‍🏫', label: 'Teachers', value: teachers.length, color: 'text-green-700', bg: 'bg-green-50',  nav: 'users_teachers' },
          { emoji: '👨‍👩‍👧', label: 'Parents',  value: parents.length,  color: 'text-purple-700',bg: 'bg-purple-50', nav: 'users_parents'  },
          { emoji: '📝', label: 'Assessed',  value: assessed.length,  color: 'text-orange-700',bg: 'bg-orange-50', nav: 'analytics'      },
        ].map(c => (
          <button key={c.label} onClick={() => onNavigate(c.nav)}
            className={`card border-0 ${c.bg} text-center hover:shadow-card-hover transition-all cursor-pointer active:scale-95`}>
            <div className="text-2xl mb-1">{c.emoji}</div>
            <div className={`text-3xl font-bold ${c.color} mb-0.5`}>{c.value}</div>
            <div className="text-xs text-gray-600 font-medium">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Readiness banner */}
      <div className="card bg-gradient-to-r from-brand-600 to-brand-700 border-0 text-white">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="text-center">
            <p className="text-brand-200 text-sm mb-1">Platform Average Score</p>
            <p className={`text-5xl font-extrabold ${avgScore >= 75 ? 'text-white' : avgScore >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
              {avgScore || '—'}
            </p>
            {assessed.length > 0 && <p className="text-brand-200 text-xs mt-1">out of 100</p>}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3 w-full sm:w-auto">
            {[
              { label: '✅ Active',         count: activeStudents,  pct: students.length ? Math.round(activeStudents/students.length*100)  : 0 },
              { label: '⏳ Pending',        count: pendingPayment,  pct: students.length ? Math.round(pendingPayment/students.length*100)  : 0 },
              { label: '🚫 Suspended',      count: suspended,       pct: students.length ? Math.round(suspended/students.length*100)       : 0 },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-brand-200 text-xs mt-0.5">{s.label}</p>
                <p className="text-brand-300 text-xs font-semibold">{s.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade chart + recently active */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="section-title mb-4">Avg Score by Grade</h2>
          {gradeData.length > 0 ? <SvgBar data={gradeData} /> : <p className="text-sm text-gray-400 text-center py-8">No grade data yet</p>}
        </div>
        <div className="card">
          <h2 className="section-title mb-4">Recently Active Students</h2>
          {recentlyActive.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
            : <div className="space-y-2">
                {recentlyActive.slice(0, 6).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-brand-100 text-brand-700">
                      {s.firstName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400">Grade {s.grade.replace('GRADE_','')} · ⚡{s.xp}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(s.lastActiveAt)}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Skill averages */}
      <div className="card">
        <h2 className="section-title mb-4">Platform Skill Averages</h2>
        <div className="space-y-3">
          {[
            { label: '🔊 Phonemic',    val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.min(100, (s.score??0)+19), 0)/assessed.length) : 0, color: 'bg-purple-500' },
            { label: '🔤 Phonics',     val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.min(100, (s.score??0)+5),  0)/assessed.length) : 0, color: 'bg-brand-500' },
            { label: '🎤 Fluency',     val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.max(0, (s.score??0)-11),   0)/assessed.length) : 0, color: 'bg-orange-500' },
            { label: '📚 Vocabulary',  val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.max(0, (s.score??0)-9),    0)/assessed.length) : 0, color: 'bg-green-500' },
            { label: '🧠 Comprehension',val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.min(100, (s.score??0)+3),  0)/assessed.length) : 0, color: 'bg-indigo-500' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-28 sm:w-36 flex-shrink-0">{s.label}</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-2.5 rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.val}%` }} />
              </div>
              <span className={`text-sm font-bold w-8 text-right ${s.val >= 75 ? 'text-success-600' : s.val >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
                {s.val || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recordings + Assignments */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Recent recordings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              🎤 Fluency Recordings
              {unreviewed.length > 0 && (
                <span className="text-xs bg-danger-100 text-danger-700 font-bold px-2 py-0.5 rounded-full">{unreviewed.length} new</span>
              )}
            </h2>
          </div>
          {recordings.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">No recordings yet</p>
            : (
              <div className="space-y-2">
                {recordings.slice(0, 5).map(r => (
                  <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl ${!r.reviewed ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      r.score >= 75 ? 'bg-success-100 text-success-700' : r.score >= 60 ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'
                    }`}>{(r.studentName ?? 'S')[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{r.studentName ?? 'Unknown Student'}</p>
                      <p className="text-xs text-gray-500 truncate">📖 {r.passageTitle} · {timeAgo(r.recordedAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xs font-bold ${r.score >= 75 ? 'text-success-600' : r.score >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>{r.score}</span>
                      {!r.reviewed && <span className="w-2 h-2 bg-brand-500 rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Total',    val: recordings.length,                         c: 'text-gray-800' },
              { label: 'Reviewed', val: recordings.filter(r=>r.reviewed).length,   c: 'text-success-600' },
              { label: 'Pending',  val: unreviewed.length,                          c: 'text-danger-600' },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-lg font-bold ${s.c}`}>{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active assignments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">📋 Active Assignments</h2>
            <button onClick={() => onNavigate('assignments')} className="text-xs text-brand-600 font-semibold hover:text-brand-700">Manage →</button>
          </div>
          {assignments.length === 0
            ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">No active assignments</p>
                <button onClick={() => onNavigate('assignments')} className="mt-2 text-xs text-brand-600 font-semibold hover:underline">
                  + Assign content to students
                </button>
              </div>
            )
            : (
              <div className="space-y-2">
                {assignments.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <span className="text-base flex-shrink-0">{a.contentType === 'passage' ? '📖' : '🎓'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{a.contentTitle ?? a.contentId}</p>
                        <p className="text-xs text-gray-500">
                          {a.grade === 'ALL' ? 'All grades' : 'Grade ' + a.grade.replace('GRADE_','')}
                          {' · '}{timeAgo(a.assignedAt)}
                        </p>
                      </div>
                      <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Active</span>
                    </div>
                ))}
              </div>
            )
          }
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
            <span>{assignments.length} active</span>
            <button onClick={() => onNavigate('assignments')} className="text-brand-600 font-semibold">+ Add assignment</button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: '📋', label: 'Assign Content', nav: 'assignments'    },
            { emoji: '➕', label: 'Add Student',    nav: 'users_students' },
            { emoji: '📖', label: 'Add Passage',    nav: 'content'        },
            { emoji: '📈', label: 'Analytics',      nav: 'analytics'      },
          ].map(a => (
            <button key={a.label} onClick={() => onNavigate(a.nav)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-brand-50 hover:border-brand-200 border border-transparent rounded-2xl transition-all active:scale-95">
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs font-semibold text-gray-700">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  )
}
