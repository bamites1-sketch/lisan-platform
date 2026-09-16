import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StudentLayout from '../../components/layout/StudentLayout'
import type { LearningPlan, LearningActivity } from '../../types'
import { skillLabel, skillEmoji } from '../../lib/utils'

export default function LearningPlanPage() {
  const [plan, setPlan] = useState<LearningPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/learning/plan', {
          headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` }
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.message || `Server error ${res.status}`)
        }
        const j = await res.json()
        if (!j.success) throw new Error(j.message || 'Failed to load plan')
        if (j.data) {
          // Parse JSON string fields from SQLite
          const planData = j.data
          if (planData.weeks) {
            planData.weeks = planData.weeks.map((w: LearningPlan['weeks'][0]) => ({
              ...w,
              goals: typeof w.goals === 'string' ? JSON.parse(w.goals as unknown as string) : w.goals,
            }))
          }
          setPlan(planData)
        }
        // j.data null means no plan yet — leave plan as null for empty state
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load learning plan')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleActivity = async (actId: string) => {
    if (!plan) return
    try {
      const response = await fetch(`/api/learning/activities/${actId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
      })
      if (!response.ok) throw new Error('Could not update activity')
    } catch {
      return
    }
    setPlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          activities: w.activities.map(a =>
            a.id === actId ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString() : undefined } : a
          )
        }))
      }
    })
  }

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
        <h1 className="text-xl font-bold text-gray-900 mb-2">Could not load your learning plan</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    </StudentLayout>
  )

  if (!plan) return (
    <StudentLayout>
      <div className="max-w-lg mx-auto text-center py-20 animate-in">
        <div className="text-5xl mb-4">🗓️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No learning plan yet</h1>
        <p className="text-gray-500 mb-6">Complete your reading assessment first. We'll build a 6-week plan customized to your needs.</p>
        <Link to="/student/assessment" className="btn-primary">Start Assessment →</Link>
      </div>
    </StudentLayout>
  )

  const allActivities = plan.weeks.flatMap(w => w.activities)
  const completedActivities = allActivities.filter(a => a.completed)
  const overallPct = allActivities.length > 0 ? Math.round((completedActivities.length / allActivities.length) * 100) : 0

  const currentWeek = plan.weeks.find(w => w.activities.some(a => !a.completed)) ?? plan.weeks[plan.weeks.length - 1]

  return (
    <StudentLayout>
      <div className="space-y-6 animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title">🗓️ {plan.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{plan.durationWeeks}-week personalized plan based on your reading profile</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Overall Plan Progress</p>
              <p className="text-xs text-gray-400">{completedActivities.length} of {allActivities.length} activities done</p>
            </div>
            <span className="text-2xl font-bold text-brand-600">{overallPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-3 bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
          {overallPct >= 100 && (
            <div className="mt-4 p-4 bg-success-50 border border-success-200 rounded-xl text-center">
              <p className="text-success-800 font-bold">🎉 You've completed your learning plan!</p>
              <Link to="/student/assessment" className="btn-success mt-3 text-sm inline-block">Take Reassessment →</Link>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {plan.weeks.map(week => {
            const completed = week.activities.filter(a => a.completed).length
            const total = week.activities.length
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            const isCurrent = week.id === currentWeek.id
            const isExpanded = expandedWeek === week.id || isCurrent
            const isComplete = pct === 100

            return (
              <div key={week.id} className={`card transition-all border-2 ${
                isCurrent ? 'border-brand-300 shadow-card-hover' :
                isComplete ? 'border-success-200' : 'border-transparent'
              }`}>
                <button
                  className="w-full flex items-center gap-4 text-left"
                  onClick={() => setExpandedWeek(isExpanded ? null : week.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isComplete ? 'bg-success-100 text-success-700' :
                    isCurrent  ? 'bg-brand-600 text-white shadow-sm' :
                                  'bg-gray-100 text-gray-500'
                  }`}>
                    {isComplete ? '✓' : week.weekNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-bold ${isCurrent ? 'text-brand-900' : 'text-gray-800'}`}>
                        Week {week.weekNumber}: {week.title}
                      </p>
                      {isCurrent && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">Current</span>}
                      {isComplete && <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-semibold">Complete</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-32">
                        <div className={`h-1.5 rounded-full ${isComplete ? 'bg-success-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{completed}/{total}</span>
                    </div>
                  </div>
                  <span className="text-gray-400 flex-shrink-0">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-in">
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">This week's goals</p>
                      <ul className="space-y-1">
                        {(Array.isArray(week.goals) ? week.goals : []).map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-brand-400 mt-0.5">→</span>{g}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      {week.activities.map(activity => (
                        <ActivityRow
                          key={activity.id}
                          activity={activity}
                          onToggle={() => toggleActivity(activity.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="card bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
            <div className="text-4xl flex-shrink-0">🏁</div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Track Your Improvement</h3>
              <p className="text-sm text-gray-600 mt-0.5">After completing your plan, take a new assessment to see exactly how much you've grown.</p>
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

function ActivityRow({ activity, onToggle }: { activity: LearningActivity; onToggle: () => void }) {
  const skillColorMap: Record<string, string> = {
    VOCABULARY: 'bg-green-100 text-green-700',
    FLUENCY: 'bg-orange-100 text-orange-700',
    COMPREHENSION: 'bg-indigo-100 text-indigo-700',
    PHONICS_DECODING: 'bg-brand-100 text-brand-700',
    PHONEMIC_AWARENESS: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
      activity.completed ? 'bg-success-50' : 'bg-gray-50 hover:bg-gray-100'
    }`}>
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
          activity.completed
            ? 'bg-success-500 border-success-500 text-white'
            : 'border-gray-300 hover:border-brand-400'
        }`}
      >
        {activity.completed && <span className="text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${activity.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
          {activity.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end max-w-[120px]">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${skillColorMap[activity.skillArea] ?? 'bg-gray-100 text-gray-600'}`}>
          {skillEmoji(activity.skillArea)} {skillLabel(activity.skillArea).split(' ')[0]}
        </span>
        {!activity.completed && (
          <Link
            to={`/student/practice/${activity.skillArea.toLowerCase()}`}
            className="text-xs text-brand-600 font-semibold hover:text-brand-700"
          >
            Start →
          </Link>
        )}
      </div>
    </div>
  )
}
