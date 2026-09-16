import { useAdminAnalytics, useAdminStudents, useAdminTeachers, useAdminParents } from '../../hooks/useAdminData'

// ─── Tiny SVG bar chart ───────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 400, H = 140, barW = Math.floor((W - (data.length + 1) * 8) / data.length)
  const gap = Math.floor((W - data.length * barW) / (data.length + 1))
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
      {data.map((d, i) => {
        const h = Math.max(4, Math.round((d.value / max) * H))
        const x = gap + i * (barW + gap)
        const y = H - h
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} fill={d.color} rx="4" opacity="0.85" />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{d.value}</text>
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Tiny SVG donut chart ─────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const r = 42, cx = 56, cy = 56, sw = 14
  let cumAngle = -90
  const arcs = segments.map(s => {
    const angle = (s.value / total) * 360
    const startAngle = cumAngle
    cumAngle += angle
    const startRad = (startAngle * Math.PI) / 180
    const endRad   = ((startAngle + angle) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const large = angle > 180 ? 1 : 0
    return { ...s, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, angle }
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 112 112" className="w-24 h-24 flex-shrink-0">
        {arcs.map((a, i) => a.angle > 0 && (
          <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="8" fill="#9ca3af">total</text>
      </svg>
      <div className="space-y-1.5">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600">{s.label}</span>
            <span className="text-xs font-bold text-gray-800 ml-auto">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Horizontal bar ───────────────────────────────────────────────────────────
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, color = 'text-gray-900' }: {
  emoji: string; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="card">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className={`text-3xl font-bold ${color} mb-0.5`}>{value}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function AnalyticsTab() {
  const { data: analyticsData } = useAdminAnalytics()
  const { data: apiStudents }   = useAdminStudents()
  const { data: apiTeachers }   = useAdminTeachers()
  const { data: apiParents }    = useAdminParents()

  const students = apiStudents ?? []
  const teachers = apiTeachers ?? []
  const parents  = apiParents  ?? []

  // Derive from API analytics data
  const distribution = analyticsData?.distribution ?? { high: 0, medium: 0, low: 0 }
  const gradeBreakdown = analyticsData?.gradeBreakdown ?? {}
  const totalAssessed  = analyticsData?.totalAssessed ?? 0

  const assessed     = students.filter(s => (s.score ?? 0) > 0)
  const avgScore     = totalAssessed > 0
    ? Math.round(Object.values(gradeBreakdown).reduce((a, g) => a + g.avgScore * g.count, 0) / totalAssessed)
    : 0
  const ready        = distribution.high
  const developing   = distribution.medium
  const needsSupport = distribution.low
  const notAssessed  = students.length - totalAssessed

  // Grade chart from real API data
  const gradeData = Object.entries(gradeBreakdown)
    .sort((a, b) => parseInt(a[0].replace('GRADE_','')) - parseInt(b[0].replace('GRADE_','')))
    .map(([grade, info]) => ({
      label: 'Gr ' + grade.replace('GRADE_',''),
      value: info.avgScore,
      color: info.avgScore >= 75 ? '#22c55e' : info.avgScore >= 60 ? '#f59e0b' : '#ef4444',
    }))

  // Score distribution buckets
  const buckets = [
    { label: '≥75 Ready',      count: distribution.high,   color: '#22c55e' },
    { label: '60–74 Developing', count: distribution.medium, color: '#f59e0b' },
    { label: '<60 Needs Help',  count: distribution.low,    color: '#ef4444' },
  ]

  // XP leaderboard
  const leaderboard = [...students].sort((a, b) => b.xp - a.xp).slice(0, 5)

  // Weakness — estimated from score distribution
  const weaknessData = [
    { skill: '🎤 Fluency',         count: Math.round(distribution.low * 0.8),       color: '#f97316' },
    { skill: '📚 Vocabulary',      count: Math.round((distribution.low + distribution.medium) * 0.4), color: '#22c55e' },
    { skill: '🔤 Phonics',         count: Math.round(distribution.low * 0.6),       color: '#3b82f6' },
    { skill: '🧠 Comprehension',   count: students.filter(s => (s.score ?? 0) > 0 && (s.score ?? 0) < 68).length, color: '#6366f1' },
    { skill: '🔊 Phonemic',        count: students.filter(s => (s.score ?? 0) > 0 && (s.score ?? 0) < 78).length, color: '#a855f7' },
  ]
  const maxWeakness = Math.max(...weaknessData.map(w => w.count), 1)

  // Recent activity (last 7 days)
  const recentlyActive = students.filter(s => {
    const diff = Date.now() - new Date(s.lastActiveAt).getTime()
    return diff < 7 * 86400000
  }).length

  const assessmentRate = students.length > 0 ? Math.round((totalAssessed / students.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Analytics &amp; Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide performance insights</p>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard emoji="👥" label="Total Students"    value={students.length} sub={`${recentlyActive} active this week`} color="text-brand-600" />
        <StatCard emoji="📊" label="Avg Readiness"     value={`${avgScore}/100`} sub={`${assessed.length} assessed`} color={avgScore >= 75 ? 'text-success-600' : avgScore >= 60 ? 'text-warning-600' : 'text-danger-600'} />
        <StatCard emoji="✅" label="Assessment Rate"   value={`${assessmentRate}%`} sub={`${assessed.length} of ${students.length}`} color="text-purple-600" />
        <StatCard emoji="🔥" label="Avg Streak"        value={`${Math.round(students.reduce((a,s)=>a+s.streakDays,0)/Math.max(students.length,1))}d`} sub="days active" color="text-orange-600" />
      </div>

      {/* Readiness distribution donut + score buckets */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="section-title mb-4">Readiness Distribution</h2>
          <DonutChart segments={[
            { value: ready,       color: '#22c55e', label: '🟢 Ready'         },
            { value: developing,  color: '#f59e0b', label: '🟡 Developing'     },
            { value: needsSupport,color: '#ef4444', label: '🔴 Needs Support'  },
            { value: notAssessed, color: '#d1d5db', label: '⚪ Not Assessed'   },
          ]} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: 'Ready',        count: ready,        pct: students.length ? Math.round(ready/students.length*100)        : 0, c: 'bg-success-100 text-success-700' },
              { label: 'Developing',   count: developing,   pct: students.length ? Math.round(developing/students.length*100)   : 0, c: 'bg-warning-100 text-warning-700' },
              { label: 'Needs Support',count: needsSupport, pct: students.length ? Math.round(needsSupport/students.length*100) : 0, c: 'bg-danger-100 text-danger-700' },
              { label: 'Not Assessed', count: notAssessed,  pct: students.length ? Math.round(notAssessed/students.length*100)  : 0, c: 'bg-gray-100 text-gray-600' },
            ].map(s => (
              <div key={s.label} className={`p-2.5 rounded-xl ${s.c.split(' ')[0]} text-center`}>
                <p className={`text-lg font-bold ${s.c.split(' ')[1]}`}>{s.count}</p>
                <p className="text-xs text-gray-600">{s.label} ({s.pct}%)</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Score Distribution</h2>
          <div className="space-y-2.5">
            {buckets.map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-12 flex-shrink-0">{b.label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="h-5 rounded-lg transition-all duration-700 flex items-center pl-2"
                    style={{ width: `${Math.max(4, assessed.length > 0 ? (b.count/assessed.length*100) : 0)}%`, background: b.color }}>
                    {b.count > 0 && <span className="text-white text-xs font-bold">{b.count}</span>}
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">{b.count}</span>
              </div>
            ))}
          </div>
          {assessed.length === 0 && <p className="text-xs text-gray-400 text-center mt-4">No assessed students yet</p>}
        </div>
      </div>

      {/* Grade performance chart */}
      {gradeData.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Average Score by Grade</h2>
          <BarChart data={gradeData} />
          <p className="text-xs text-gray-400 mt-3 text-center">Based on {totalAssessed} assessed student{totalAssessed !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Skill weaknesses + Leaderboard */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="section-title mb-4">Most Common Weaknesses</h2>
          <div className="space-y-3">
            {weaknessData.sort((a,b) => b.count - a.count).map(w => (
              <HBar key={w.skill} label={w.skill} value={w.count} max={maxWeakness} color={w.color} />
            ))}
          </div>
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-xs text-orange-800">
              <strong>Insight:</strong> {weaknessData.sort((a,b) => b.count - a.count)[0]?.skill.replace(/🎤|📚|🔤|🧠|🔊/g,'').trim()} has the most students needing support. Prioritize content in this area.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">🏆 XP Leaderboard</h2>
          <div className="space-y-2.5">
            {leaderboard.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-gray-200 text-gray-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                }`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-400">Grade {s.grade.replace('GRADE_','')} · {s.streakDays}d streak 🔥</p>
                </div>
                <span className="text-sm font-bold text-amber-700 flex-shrink-0">⚡{s.xp}</span>
              </div>
            ))}
            {students.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No students yet</p>}
          </div>
        </div>
      </div>

      {/* Content Inventory */}
      <div className="card">
        <h2 className="section-title mb-4">Platform Users</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { emoji: '👥', label: 'Students',   count: students.length,  color: 'bg-brand-50   text-brand-700' },
            { emoji: '🧑‍🏫', label: 'Teachers',  count: teachers.length,  color: 'bg-green-50  text-green-700' },
            { emoji: '👨‍👩‍👧', label: 'Parents',   count: parents.length,   color: 'bg-purple-50 text-purple-700' },
          ].map(c => (
            <div key={c.label} className={`p-4 rounded-2xl ${c.color.split(' ')[0]} text-center`}>
              <div className="text-2xl mb-1">{c.emoji}</div>
              <div className={`text-2xl font-bold ${c.color.split(' ')[1]}`}>{c.count}</div>
              <div className="text-xs text-gray-600 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top performing students */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">📈 Top Performing Students</h2>
          <span className="text-xs text-gray-400">By readiness score</span>
        </div>
        <div className="space-y-2">
          {[...students].filter(s => (s.score ?? 0) > 0).sort((a,b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                (s.score ?? 0) >= 75 ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
              }`}>{s.firstName[0]}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-500">Grade {s.grade.replace('GRADE_','')} · {s.xp} XP</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${(s.score ?? 0) >= 75 ? 'bg-success-500' : 'bg-warning-500'}`} style={{ width: `${s.score ?? 0}%` }} />
                </div>
                <span className={`text-sm font-bold w-8 text-right ${(s.score ?? 0) >= 75 ? 'text-success-600' : 'text-warning-600'}`}>{s.score ?? 0}</span>
              </div>
            </div>
          ))}
          {students.filter(s => (s.score ?? 0) > 0).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No assessment data yet</p>
          )}
        </div>
      </div>

      {/* Platform health */}
      <div className="card">
        <h2 className="section-title mb-4">Platform Health</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">User Activity</p>
            <div className="space-y-3">
              {[
                { label: 'Students',           count: students.length,               max: 200 },
                { label: 'Active this week',   count: recentlyActive,                max: students.length || 1 },
                { label: 'Assessments done',   count: assessed.length,               max: students.length || 1 },
                { label: 'Parents linked',     count: parents.length,                max: students.length || 1 },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-36 flex-shrink-0">{r.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-brand-500 rounded-full" style={{ width: `${Math.min(100, Math.round(r.count/r.max*100))}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Localization</p>
            <div className="space-y-2.5">
              {[
                { lang: '🇬🇧 English',    pct: 100, color: '#22c55e' },
                { lang: '🇪🇹 Amharic',   pct: 40,  color: '#f59e0b' },
                { lang: 'Afaan Oromo',     pct: 0,   color: '#d1d5db' },
                { lang: 'Tigrinya',        pct: 0,   color: '#d1d5db' },
              ].map(l => (
                <div key={l.lang} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-24 flex-shrink-0">{l.lang}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${l.pct}%`, background: l.color }} />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-8 text-right">{l.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
