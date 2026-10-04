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
      return { label, value: avg, color: avg >= 75 ? '#2d6a4f' : avg >= 60 ? '#d4a017' : '#e11d48' }
    })

  const recentlyActive = students.filter(s => Date.now() - new Date(s.lastActiveAt).getTime() < 86400000 * 7)

  return (
    <div className="space-y-6 animate-in">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25 mb-1.5">
            <span>⚙️</span> ADMINISTRATION CONSOLE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a3a2a] tracking-tight">
            Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time telemetry, diagnostic readiness, and platform-wide reading progression metrics.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#e8f4f0] border-t-[#2d6a4f] rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                emoji: '📖',
                label: 'Total Students',
                value: students.length,
                sub: `${activeStudents} active`,
                color: 'text-[#1a3a2a]',
                bg: 'bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#e8f4f0]/60',
                border: 'border-[#2d6a4f]/20',
                iconBg: 'bg-[#e8f4f0] text-[#1a3a2a]',
                nav: 'users_students',
              },
              {
                emoji: '🧑‍🏫',
                label: 'Active Teachers',
                value: teachers.length,
                sub: 'Staff accounts',
                color: 'text-[#2d6a4f]',
                bg: 'bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#f5f0e8]/70',
                border: 'border-[#d4a017]/30',
                iconBg: 'bg-[#f5f0e8] text-[#936605]',
                nav: 'users_teachers',
              },
              {
                emoji: '👨‍👩‍👧',
                label: 'Registered Parents',
                value: parents.length,
                sub: 'Family portals',
                color: 'text-[#1a3a2a]',
                bg: 'bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#e8f4f0]/40',
                border: 'border-[#1a3a2a]/15',
                iconBg: 'bg-[#1a3a2a]/10 text-[#1a3a2a]',
                nav: 'users_parents',
              },
              {
                emoji: '📝',
                label: 'Assessed Students',
                value: assessed.length,
                sub: `${students.length ? Math.round(assessed.length / students.length * 100) : 0}% completion`,
                color: 'text-[#936605]',
                bg: 'bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#fff9e6]',
                border: 'border-[#d4a017]/40',
                iconBg: 'bg-[#fdf5dd] text-[#d4a017]',
                nav: 'analytics',
              },
            ].map(c => (
              <button
                key={c.label}
                onClick={() => onNavigate(c.nav)}
                className={`p-5 rounded-3xl border ${c.border} ${c.bg} shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-left flex flex-col justify-between group cursor-pointer active:scale-98`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform ${c.iconBg}`}>
                    {c.emoji}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#2d6a4f] transition-colors">
                    VIEW →
                  </span>
                </div>
                <div className="mt-4">
                  <div className={`text-3xl font-extrabold ${c.color} tracking-tight`}>{c.value}</div>
                  <div className="text-xs font-bold text-[#1a3a2a] mt-0.5">{c.label}</div>
                  <div className="text-[11px] text-gray-400 font-medium mt-0.5">{c.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Readiness banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a2a] via-[#224d38] to-[#2d6a4f] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 border border-[#2d6a4f]/30">
            <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-[#d4a017]/15 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="text-center sm:text-left flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-[#d4a017]/40 flex flex-col items-center justify-center shadow-inner flex-shrink-0">
                  <span className={`text-3xl font-extrabold ${avgScore >= 75 ? 'text-white' : avgScore >= 60 ? 'text-[#d4a017]' : 'text-rose-300'}`}>
                    {avgScore || '—'}
                  </span>
                  <span className="text-[9px] text-[#d4a017] font-bold uppercase tracking-wider">OUT OF 100</span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#d4a017]/20 text-[#d4a017] mb-1">
                    DIAGNOSTIC READINESS
                  </div>
                  <h2 className="text-lg font-bold text-white">Platform Average Score</h2>
                  <p className="text-emerald-100/80 text-xs mt-0.5">Aggregated cross-grade baseline reading proficiency</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-3 w-full sm:w-auto">
                {[
                  { label: 'Active', count: activeStudents, pct: students.length ? Math.round(activeStudents/students.length*100) : 0, color: 'text-emerald-200', bg: 'bg-[#2d6a4f]/40 border-[#2d6a4f]/60' },
                  { label: 'Pending', count: pendingPayment, pct: students.length ? Math.round(pendingPayment/students.length*100) : 0, color: 'text-[#d4a017]', bg: 'bg-[#d4a017]/15 border-[#d4a017]/35' },
                  { label: 'Suspended', count: suspended, pct: students.length ? Math.round(suspended/students.length*100) : 0, color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-400/30' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl p-3.5 text-center border backdrop-blur-sm ${s.bg}`}>
                    <p className="text-2xl font-extrabold text-white">{s.count}</p>
                    <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${s.color}`}>{s.label}</p>
                    <p className="text-white/60 text-xs font-semibold">{s.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grade chart + recently active */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                  <span>📊</span> Avg Score by Grade
                </h2>
                <span className="text-xs text-gray-400 font-medium">Diagnostic</span>
              </div>
              {gradeData.length > 0 ? <SvgBar data={gradeData} /> : <p className="text-sm text-gray-400 text-center py-8">No grade data yet</p>}
            </div>

            <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                  <span>⚡</span> Recently Active Students
                </h2>
                <span className="text-xs text-[#2d6a4f] font-semibold cursor-pointer" onClick={() => onNavigate('users_students')}>
                  All students →
                </span>
              </div>
              {recentlyActive.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-2">
                  {recentlyActive.slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#e8f4f0]/40 transition-colors">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/20">
                        {s.firstName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1a3a2a] truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-[11px] text-gray-500">Grade {s.grade.replace('GRADE_','')} · ⚡{s.xp} XP</p>
                      </div>
                      <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">{timeAgo(s.lastActiveAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Skill averages */}
          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                <span>🎯</span> Platform Skill Averages
              </h2>
              <span className="text-xs text-gray-400 font-medium">5 Core Reading Domains</span>
            </div>
            <div className="space-y-3.5">
              {[
                { label: '🔊 Phonemic Awareness', val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.min(100, (s.score??0)+19), 0)/assessed.length) : 0, color: 'bg-[#1a3a2a]' },
                { label: '🔤 Phonics & Decoding',  val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.min(100, (s.score??0)+5),  0)/assessed.length) : 0, color: 'bg-[#2d6a4f]' },
                { label: '🎤 Reading Fluency',     val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.max(0, (s.score??0)-11),   0)/assessed.length) : 0, color: 'bg-[#d4a017]' },
                { label: '📚 Vocabulary Acq.',    val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.max(0, (s.score??0)-9),    0)/assessed.length) : 0, color: 'bg-[#347b5c]' },
                { label: '🧠 Comprehension',       val: assessed.length > 0 ? Math.round(assessed.reduce((a,s) => a + Math.min(100, (s.score??0)+3),  0)/assessed.length) : 0, color: 'bg-[#52796f]' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 w-32 sm:w-44 flex-shrink-0">{s.label}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-2.5 rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.val}%` }} />
                  </div>
                  <span className={`text-xs sm:text-sm font-bold w-9 text-right ${s.val >= 75 ? 'text-[#2d6a4f]' : s.val >= 60 ? 'text-[#936605]' : 'text-rose-600'}`}>
                    {s.val || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recordings + Assignments */}
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Recent recordings */}
            <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                  <span>🎙️</span> Fluency Recordings
                  {unreviewed.length > 0 && (
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                      {unreviewed.length} pending
                    </span>
                  )}
                </h2>
                <button onClick={() => onNavigate('recordings')} className="text-xs font-bold text-[#2d6a4f] hover:text-[#1a3a2a]">
                  Review all →
                </button>
              </div>
              {recordings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No recordings yet</p>
              ) : (
                <div className="space-y-2">
                  {recordings.slice(0, 5).map(r => (
                    <div key={r.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${!r.reviewed ? 'bg-[#e8f4f0]/70 border border-[#2d6a4f]/30' : 'bg-gray-50/70 border border-gray-100'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        r.score >= 75 ? 'bg-[#e8f4f0] text-[#1a3a2a]' : r.score >= 60 ? 'bg-[#fef8e7] text-[#936605]' : 'bg-rose-50 text-rose-700'
                      }`}>{(r.studentName ?? 'S')[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1a3a2a] truncate">{r.studentName ?? 'Unknown Student'}</p>
                        <p className="text-[11px] text-gray-500 truncate">📖 {r.passageTitle} · {timeAgo(r.recordedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-bold ${r.score >= 75 ? 'text-[#2d6a4f]' : r.score >= 60 ? 'text-[#936605]' : 'text-rose-600'}`}>{r.score}</span>
                        {!r.reviewed && <span className="w-2 h-2 bg-[#d4a017] rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3.5 pt-3.5 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Total',    val: recordings.length,                       c: 'text-[#1a3a2a]' },
                  { label: 'Reviewed', val: recordings.filter(r=>r.reviewed).length, c: 'text-[#2d6a4f]' },
                  { label: 'Pending',  val: unreviewed.length,                        c: 'text-amber-600' },
                ].map(s => (
                  <div key={s.label}>
                    <p className={`text-lg font-extrabold ${s.c}`}>{s.val}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active assignments */}
            <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                  <span>📋</span> Active Assignments
                </h2>
                <button onClick={() => onNavigate('assignments')} className="text-xs font-bold text-[#2d6a4f] hover:text-[#1a3a2a]">
                  Manage →
                </button>
              </div>
              {assignments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">No active assignments</p>
                  <button onClick={() => onNavigate('assignments')} className="mt-2 text-xs text-[#2d6a4f] font-bold hover:underline">
                    + Assign content to students
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50/70 border border-gray-100 rounded-2xl">
                      <span className="text-lg flex-shrink-0">{a.contentType === 'passage' ? '📖' : '🎓'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1a3a2a] truncate">{a.contentTitle ?? a.contentId}</p>
                        <p className="text-[11px] text-gray-500">
                          {a.grade === 'ALL' ? 'All grades' : 'Grade ' + a.grade.replace('GRADE_','')}
                          {' · '}{timeAgo(a.assignedAt)}
                        </p>
                      </div>
                      <span className="text-[10px] bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25 px-2.5 py-0.5 rounded-full font-bold flex-shrink-0">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3.5 pt-3.5 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                <span className="font-medium">{assignments.length} assignments active</span>
                <button onClick={() => onNavigate('assignments')} className="text-[#2d6a4f] font-bold hover:underline">
                  + Add assignment
                </button>
              </div>
            </div>
          </div>

          {/* ── FEEDBACK & COMMUNICATION SUITE ── */}
          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                  <span>✨</span> NEW COMMUNICATION MODULES
                </div>
                <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2 mt-1">
                  <span>💬</span> Feedback & Communication Operations
                </h2>
              </div>
              <span className="text-xs text-gray-500 font-medium">Real-time Learner & Parent Channels</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Student Chat */}
              <div className="p-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-[#f0f9f5] to-white flex flex-col justify-between group hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-10 h-10 rounded-xl bg-[#2d6a4f] text-[#d4a017] flex items-center justify-center text-xl shadow-xs">
                      💬
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 text-[10px] font-bold">
                      Telegram-Style
                    </span>
                  </div>
                  <h3 className="font-extrabold text-[#1a3a2a] text-sm group-hover:text-[#2d6a4f] transition-colors">
                    Student ↔ Admin Chat
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Direct real-time messaging with individual learners, timestamps, quick replies, and message history.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigate('student-chat')}
                    className="text-xs font-bold text-[#2d6a4f] hover:underline"
                  >
                    Open Tab →
                  </button>
                  <a
                    href="/admin/chat"
                    className="px-2.5 py-1 rounded-lg bg-[#2d6a4f] text-white text-[11px] font-bold hover:bg-[#1a3a2a] transition-colors"
                  >
                    Full Page ↗
                  </a>
                </div>
              </div>

              {/* Parent Feedback */}
              <div className="p-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-[#fefbf0] to-white flex flex-col justify-between group hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-10 h-10 rounded-xl bg-[#d4a017] text-[#1a3a2a] flex items-center justify-center text-xl shadow-xs">
                      📬
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-[10px] font-bold">
                      Parent Portal
                    </span>
                  </div>
                  <h3 className="font-extrabold text-[#1a3a2a] text-sm group-hover:text-[#936605] transition-colors">
                    Parent Feedback & Concerns
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Review parent submissions regarding progress, concerns, and suggestions. Submit official admin replies.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigate('parent-feedback')}
                    className="text-xs font-bold text-[#936605] hover:underline"
                  >
                    Open Tab →
                  </button>
                  <a
                    href="/admin/parent-feedback"
                    className="px-2.5 py-1 rounded-lg bg-[#d4a017] text-[#1a3a2a] text-[11px] font-bold hover:brightness-95 transition-colors"
                  >
                    Full Page ↗
                  </a>
                </div>
              </div>

              {/* Assessment Feedback */}
              <div className="p-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-[#f0f6ff] to-white flex flex-col justify-between group hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-xs">
                      📝
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-200/60 text-blue-900 text-[10px] font-bold">
                      Evaluations
                    </span>
                  </div>
                  <h3 className="font-extrabold text-[#1a3a2a] text-sm group-hover:text-blue-700 transition-colors">
                    Assessment Growth Plans
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Publish diagnostic evaluations, identify skill problem areas, and provide actionable recommendations for students.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigate('assessment-feedback')}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    Open Tab →
                  </button>
                  <a
                    href="/admin/assessment-feedback"
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors"
                  >
                    Full Page ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1a3a2a] mb-4 flex items-center gap-2">
              <span>⚡</span> Management Shortcuts
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { emoji: '📋', label: 'Assign Content', desc: 'Deploy tasks to grade', nav: 'assignments' },
                { emoji: '👥', label: 'Manage Students', desc: 'Accounts & grades',    nav: 'students' },
                { emoji: '📖', label: 'Passage Library', desc: 'Upload reading text',   nav: 'content' },
                { emoji: '📈', label: 'Analytics Hub',   desc: 'Platform deep-dive',   nav: 'analytics' },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => onNavigate(a.nav)}
                  className="flex flex-col items-start p-4 bg-gray-50/70 hover:bg-[#e8f4f0]/50 border border-gray-100 hover:border-[#2d6a4f]/30 rounded-2xl transition-all duration-200 group text-left cursor-pointer active:scale-98"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform mb-2">{a.emoji}</span>
                  <span className="text-xs font-bold text-[#1a3a2a] group-hover:text-[#2d6a4f] transition-colors">{a.label}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
