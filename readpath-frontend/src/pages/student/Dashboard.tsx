import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import StudentLayout from '../../components/layout/StudentLayout'
import SkillCard from '../../components/ui/SkillCard'
import ReadinessGauge from '../../components/ui/ReadinessGauge'
import Badge from '../../components/ui/Badge'
import AssignedContent from '../../components/student/AssignedContent'
import type { StudentDashboardData, StudentProfile, SkillArea } from '../../types'

const SKILL_AREAS: SkillArea[] = [
  'PHONEMIC_AWARENESS', 'PHONICS_DECODING', 'FLUENCY', 'VOCABULARY', 'COMPREHENSION'
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const profile = user?.profile as StudentProfile
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/students/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.message || `Server error ${res.status}`)
        }
        const json = await res.json()
        if (json.success) {
          // Parse JSON strings from SQLite storage
          if (json.data?.latestProfile) {
            const p = json.data.latestProfile
            if (typeof p.strengths === 'string') p.strengths = JSON.parse(p.strengths)
            if (typeof p.weaknesses === 'string') p.weaknesses = JSON.parse(p.weaknesses)
            if (typeof p.priorities === 'string') p.priorities = JSON.parse(p.priorities)
            if (typeof p.recommendations === 'string') p.recommendations = JSON.parse(p.recommendations)
          }
          setData(json.data)
        } else {
          throw new Error(json.message || 'Failed to load dashboard')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    </StudentLayout>
  )

  if (error) return (
    <StudentLayout>
      <div className="max-w-lg mx-auto text-center py-20 animate-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Could not load dashboard</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    </StudentLayout>
  )

  const skillScores = data?.skillScores

  return (
    <StudentLayout>
      <div className="space-y-6 animate-in">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Hi, {profile?.firstName} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              {profile?.streakDays > 0
                ? `You're on a ${profile.streakDays}-day streak! Keep it going 🔥`
                : `Welcome to Lisan! Let's discover how you read.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <span className="text-sm font-semibold text-amber-800">{profile?.xp ?? 0} XP</span>
            </div>
            <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full flex items-center gap-1.5">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-semibold text-orange-800">{profile?.streakDays ?? 0} days</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Continue Learning', detail: 'Resume your plan', icon: '📖', href: '/student/plan', tone: 'bg-emerald-50 text-emerald-800' },
            { label: 'View Assignments', detail: 'Check your tasks', icon: '📄', href: '/student/assignments', tone: 'bg-sky-50 text-sky-800' },
            { label: 'Take Assessment', detail: data?.hasCompletedAssessment ? 'View your results' : 'Show what you know', icon: '♢', href: data?.hasCompletedAssessment ? '/student/assessments' : '/student/assessment', tone: 'bg-indigo-50 text-indigo-800' },
            { label: 'Record Reading', detail: 'Practice your fluency', icon: '🎙️', href: '/student/reading-practice', tone: 'bg-amber-50 text-amber-800' },
          ].map(action => <Link key={action.label} to={action.href} className={`rounded-2xl border border-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${action.tone}`}><span className="text-2xl">{action.icon}</span><span className="block mt-3 text-sm font-bold">{action.label}</span><span className="block mt-1 text-xs opacity-70">{action.detail}</span><span className="block text-right text-lg mt-2">→</span></Link>)}
        </div>

        {/* No assessment yet */}
        {!data?.hasCompletedAssessment && (
          <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-5xl flex-shrink-0">📝</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Start your reading assessment</h2>
                <p className="text-brand-100 text-sm leading-relaxed mb-4">
                  Before we can build your personalized learning plan, we need to understand how you read. It takes about 20 minutes and it's not a test you can fail.
                </p>
                <blockquote className="border-l-2 border-brand-400 pl-3 text-brand-200 text-sm italic mb-4">
                  "This isn't a test you can fail. We just want to discover how you read so we can help you improve."
                </blockquote>
                <Link to="/student/assessment" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors">
                  Start Assessment →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Reading Readiness + skill scores */}
        {data?.hasCompletedAssessment && data.readinessScore !== null && (
          <>
            {/* Readiness overview */}
            <div className="card">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ReadinessGauge
                  score={data.readinessScore}
                  targetGrade={data.targetGrade}
                  size="lg"
                />
                <div className="flex-1 w-full">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {data.targetGrade} Reading Readiness
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {data.readinessScore >= 80
                      ? `Excellent work, ${profile?.firstName}! You're well on track for ${data.targetGrade} reading.`
                      : data.readinessScore >= 65
                      ? `You're developing well toward ${data.targetGrade} reading. Keep practicing!`
                      : `You're building toward ${data.targetGrade} reading. Your learning plan will help you get there!`}
                  </p>

                  {/* Strengths & weaknesses summary */}
                  {data.latestProfile && (
                    <div className="flex flex-wrap gap-2">
                      {data.latestProfile.strengths.slice(0, 2).map(s => (
                        <span key={s.skill} className="skill-badge-strong">💪 {s.skill}</span>
                      ))}
                      {data.latestProfile.weaknesses.slice(0, 2).map(w => (
                        <span key={w.skill} className="skill-badge-needs-practice">🎯 {w.skill}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="flex flex-row sm:flex-col gap-2 flex-wrap flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-start">
                  <Link to="/student/plan" className="btn-primary text-sm text-center">
                    Continue Learning →
                  </Link>
                  <Link to="/student/profile" className="btn-secondary text-sm text-center">
                    View Full Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* 5 Skill Cards */}
            <div>
              <h2 className="section-title mb-3">Your Reading Skills</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {SKILL_AREAS.map(skill => {
                  const scoreKey = {
                    PHONEMIC_AWARENESS: 'phonemicAwareness',
                    PHONICS_DECODING: 'phonicsDecoding',
                    FLUENCY: 'fluency',
                    VOCABULARY: 'vocabulary',
                    COMPREHENSION: 'comprehension',
                  }[skill] as keyof NonNullable<typeof skillScores>

                  const score = skillScores?.[scoreKey] ?? 0
                  return (
                    <SkillCard
                      key={skill}
                      skill={skill}
                      score={score}
                      onClick={() => navigate(`/student/practice/${skill.toLowerCase()}`)}
                    />
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Learning Plan progress */}
        {data?.learningPlan && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">📅 {data.learningPlan.title}</h2>
              <Link to="/student/plan" className="text-sm text-brand-600 font-semibold hover:text-brand-700">
                View full plan →
              </Link>
            </div>
            <div className="space-y-3">
              {data.learningPlan.weeks.slice(0, 3).map(week => {
                const completed = week.activities.filter(a => a.completed).length
                const total = week.activities.length
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0
                const isCurrentWeek = completed < total && (week.weekNumber === 1 ||
                  data.learningPlan!.weeks.slice(0, week.weekNumber - 1).every(w =>
                    w.activities.every(a => a.completed)))
                return (
                  <div key={week.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isCurrentWeek ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      pct === 100 ? 'bg-success-100 text-success-700' : isCurrentWeek ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {pct === 100 ? '✓' : week.weekNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-semibold truncate ${isCurrentWeek ? 'text-brand-900' : 'text-gray-700'}`}>{week.title}</p>
                        {isCurrentWeek && <span className="text-xs text-brand-600 font-semibold ml-2 flex-shrink-0">Current</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-success-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">{completed}/{total}</span>
                      </div>
                    </div>
                    {isCurrentWeek && (
                      <Link to="/student/plan" className="text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1.5 rounded-lg hover:bg-brand-200 transition-colors flex-shrink-0">
                        Continue
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Assigned work and recent activity */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Assigned Work</h2>
              <Link to="/student/reading-practice" className="text-xs text-brand-600 font-semibold">Open practice →</Link>
            </div>
            {data?.assignments?.length ? <div className="space-y-2">{data.assignments.slice(0, 4).map(item => <Link key={item.id} to="/student/reading-practice" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-brand-50"><span className="text-xl">{item.contentType === 'passage' ? '📖' : '📘'}</span><span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-gray-800 truncate">{item.contentTitle}</span><span className="block text-xs text-gray-500">{item.contentType === 'passage' ? 'Reading passage' : 'Lesson'} · Assigned {new Date(item.assignedAt).toLocaleDateString()}</span></span><span className="text-gray-400">→</span></Link>)}</div> : <p className="text-sm text-gray-500 py-5">No assigned work yet. Your next activities will appear here.</p>}
          </div>
          <div className="card">
            <h2 className="section-title mb-4">Recent Activity</h2>
            {data?.recentActivity?.length ? <div className="space-y-3">{data.recentActivity.slice(0, 4).map(activity => <div key={activity.id} className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">✓</span><div><p className="text-sm font-semibold text-gray-800">{activity.metric.replace(/_/g, ' ')}</p><p className="text-xs text-gray-500">{activity.value} · {new Date(activity.date).toLocaleDateString()}</p></div></div>)}</div> : <p className="text-sm text-gray-500 py-5">Complete an activity to start your progress history.</p>}
          </div>
        </div>

        {/* Bottom row: Quick practice + Badges */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Quick practice */}
          <div className="card">
            <h2 className="section-title mb-3">Quick Practice</h2>
            <div className="space-y-2">
              {[
                { skill: 'VOCABULARY' as SkillArea,           label: '📚 Vocabulary',          desc: 'Practice new words' },
                { skill: 'COMPREHENSION' as SkillArea,        label: '🧠 Comprehension',        desc: 'Reading passages' },
                { skill: 'PHONICS_DECODING' as SkillArea,     label: '🔤 Phonics & Decoding',   desc: 'Decode new words' },
              ].map(item => (
                <Link
                  key={item.skill}
                  to={`/student/practice/${item.skill.toLowerCase()}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-700">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-brand-500 transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">🏆 Badges</h2>
              <span className="text-xs text-gray-400">{data?.badges?.length ?? 0} earned</span>
            </div>
            {data?.badges && data.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.badges.map(b => (
                  <Badge key={b.id} badgeType={b.badgeType} earnedAt={b.earnedAt} size="sm" />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">🌟</p>
                <p className="text-sm text-gray-500">Complete activities to earn badges!</p>
              </div>
            )}
          </div>
        </div>

        {/* My Assessments */}
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
            <div className="text-4xl">📝</div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">My Reading Assessments</h3>
              <p className="text-sm text-gray-600 mt-0.5">View your assigned assessments, record your reading, and check your results.</p>
            </div>
            <Link to="/student/assessments" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex-shrink-0 self-start xs:self-auto transition-colors">
              View Assessments
            </Link>
          </div>
        </div>

        {/* Assigned content from admin/teacher */}
        <AssignedContent />

        {/* Reassessment prompt */}
        {data?.hasCompletedAssessment && data.readinessScore !== null && (
          <div className="card bg-gradient-to-r from-success-50 to-brand-50 border border-success-200">
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
              <div className="text-4xl">📈</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Ready to check your progress?</h3>
                <p className="text-sm text-gray-600 mt-0.5">Take a new assessment and see how much you've improved since you started.</p>
              </div>
              <Link to="/student/assessment" className="btn-success text-sm flex-shrink-0 self-start xs:self-auto">
                Retake Assessment
              </Link>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
 