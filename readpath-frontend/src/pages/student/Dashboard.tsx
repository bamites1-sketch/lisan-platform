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
        {/* Brand Greeting Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a2a] via-[#224d38] to-[#2d6a4f] p-5 sm:p-7 lg:p-8 text-white shadow-xl shadow-emerald-950/10 border border-[#2d6a4f]/30">
          {/* Decorative ambient blurs */}
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[#d4a017]/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-[#e8f4f0]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/35 mb-2.5 tracking-wide">
                <span>ል</span> GRADE {profile?.grade?.replace('GRADE_', '') || '1'} · STUDENT DASHBOARD
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Hi, {profile?.firstName || 'Learner'} 👋
              </h1>
              <p className="text-emerald-100/80 text-xs sm:text-base mt-1 max-w-xl leading-relaxed">
                {profile?.streakDays > 0
                  ? `You're on a ${profile.streakDays}-day streak! Keep your daily momentum going 🔥`
                  : `Welcome to Lisan! Let's discover how you read and unlock your full potential.`}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 bg-black/25 backdrop-blur-md border border-[#d4a017]/40 rounded-2xl flex items-center gap-2.5 shadow-sm">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#d4a017]/25 text-[#d4a017] flex items-center justify-center font-bold text-xs sm:text-sm">⚡</span>
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-[#d4a017] font-bold tracking-wider leading-none">TOTAL XP</span>
                  <span className="text-sm sm:text-base font-extrabold text-white">{profile?.xp ?? 0}</span>
                </div>
              </div>
              <div className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 bg-black/25 backdrop-blur-md border border-amber-400/40 rounded-2xl flex items-center gap-2.5 shadow-sm">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/25 text-amber-300 flex items-center justify-center font-bold text-xs sm:text-sm">🔥</span>
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-amber-300 font-bold tracking-wider leading-none">STREAK</span>
                  <span className="text-sm sm:text-base font-extrabold text-white">{profile?.streakDays ?? 0} Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Guided Focus / Next Step (When Assessment Complete) */}
        {data?.hasCompletedAssessment && (
          <div className="bg-gradient-to-r from-[#e8f4f0] via-white to-[#f5f0e8] rounded-3xl border border-[#2d6a4f]/25 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1a3a2a] text-[#d4a017] flex items-center justify-center text-2xl font-bold shadow-xs flex-shrink-0">
                🎯
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2d6a4f]/15 text-[#1a3a2a] mb-1">
                  TODAY'S GUIDED FOCUS
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#1a3a2a]">
                  {data?.learningPlan ? `Continue: ${data.learningPlan.title}` : 'Practice Your Daily Reading Fluency'}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Spend 10–15 minutes daily with your reading exercises to keep your streak active.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto">
              <Link
                to="/student/plan"
                className="flex-1 sm:flex-none text-center bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all"
              >
                Continue Lesson →
              </Link>
              <Link
                to="/student/assignments"
                className="flex-1 sm:flex-none text-center bg-white hover:bg-gray-50 text-[#1a3a2a] border border-gray-200 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all"
              >
                Assignments ({data?.assignments?.length || 0})
              </Link>
            </div>
          </div>
        )}

        {/* 4 Flagship Learning Activities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
              <span>🚀</span> Learning Activities
            </h2>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Interactive reading, storytelling, and speech practice
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                title: 'Live Voice AI Coach',
                desc: 'Karaoke-style live pronunciation & real-time speech scoring',
                icon: '🎙️',
                href: '/student/karaoke-coach',
                badge: 'VOICE AI',
                tone: 'hover:border-emerald-500/50 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/50',
                iconBg: 'bg-[#e8f4f0] text-[#1a3a2a]',
              },
              {
                title: 'Bilingual Stories',
                desc: 'Explore rich Amharic & English illustrated tales with narration',
                icon: '📚',
                href: '/student/bilingual-library',
                badge: 'LIBRARY',
                tone: 'hover:border-amber-400/50 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/50',
                iconBg: 'bg-amber-100/70 text-amber-900',
              },
              {
                title: 'Reading Battle Arena',
                desc: 'Challenge peers and test your reading speed & accuracy',
                icon: '🏆',
                href: '/student/reading-battle',
                badge: 'COMPETE',
                tone: 'hover:border-purple-400/50 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/50',
                iconBg: 'bg-purple-100 text-purple-900',
              },
              {
                title: 'My Learning Plan',
                desc: 'Structured weekly roadmap tailored to your diagnostic level',
                icon: '📖',
                href: '/student/plan',
                badge: 'LESSONS',
                tone: 'hover:border-[#1a3a2a]/40 hover:bg-gradient-to-br hover:from-white hover:to-[#e8f4f0]/40',
                iconBg: 'bg-[#1a3a2a]/10 text-[#1a3a2a]',
              },
            ].map(item => (
              <Link
                key={item.title}
                to={item.href}
                className={`bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group ${item.tone}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold shadow-xs group-hover:scale-110 transition-transform ${item.iconBg}`}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 group-hover:text-[#2d6a4f] transition-colors">
                      {item.badge}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-[#1a3a2a] group-hover:text-[#2d6a4f] transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs font-bold text-[#2d6a4f] opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  Open →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── FEEDBACK & COMMUNICATION MODULE CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/student/chat"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#2d6a4f] p-5 sm:p-6 text-white shadow-card hover:shadow-lg transition-all duration-200 border border-[#2d6a4f]/40 flex items-center justify-between"
          >
            <div className="space-y-1.5 z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[10px] font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                TELEGRAM-STYLE SECURE CHAT
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-emerald-200 transition-colors">
                Chat Directly with Admin 💬
              </h3>
              <p className="text-xs text-emerald-100/75 max-w-sm">
                Ask questions, report issues, or get direct guidance from Lisan administration in real-time.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-[#d4a017] group-hover:text-[#1a3a2a] text-white flex items-center justify-center text-xl font-bold transition-all shadow-xs flex-shrink-0 ml-3">
              →
            </div>
          </Link>

          <Link
            to="/student/assessment-feedback"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#142e21] via-[#1a3a2a] to-[#224835] p-5 sm:p-6 text-white shadow-card hover:shadow-lg transition-all duration-200 border border-[#2d6a4f]/40 flex items-center justify-between"
          >
            <div className="space-y-1.5 z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d4a017]/20 text-[#d4a017] text-[10px] font-bold tracking-wide">
                <span>📋</span> DIAGNOSTIC FINDINGS
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-amber-200 transition-colors">
                Assessment Feedback & Growth 🎯
              </h3>
              <p className="text-xs text-emerald-100/75 max-w-sm">
                View identified problem areas, admin commentary, and personalized improvement roadmap.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-[#d4a017] group-hover:text-[#1a3a2a] text-white flex items-center justify-center text-xl font-bold transition-all shadow-xs flex-shrink-0 ml-3">
              →
            </div>
          </Link>
        </div>

        {/* No assessment yet */}
        {!data?.hasCompletedAssessment && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a2a] via-[#224d38] to-[#2d6a4f] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 border border-[#2d6a4f]/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl flex-shrink-0">
                📝
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#d4a017]/25 text-[#d4a017] mb-2">
                  ✨ STEP 1
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold mb-1 text-white">Start your reading assessment</h2>
                <p className="text-emerald-100/90 text-sm leading-relaxed mb-4 max-w-2xl">
                  Before we can build your personalized learning plan, we need to understand how you read. It takes about 20 minutes and it's not a test you can fail.
                </p>
                <blockquote className="border-l-2 border-[#d4a017] pl-3 text-emerald-200 text-sm italic mb-5">
                  "This isn't a test you can fail. We just want to discover how you read so we can help you improve."
                </blockquote>
                <Link
                  to="/student/assessment"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d4a017] to-[#b88912] text-[#1a3a2a] font-bold px-6 py-3 rounded-xl shadow-md hover:brightness-105 transition-all"
                >
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
            <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                <ReadinessGauge
                  score={data.readinessScore}
                  targetGrade={data.targetGrade}
                  size="lg"
                />
                <div className="flex-1 w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25 mb-1.5">
                    DIAGNOSTIC STATUS
                  </div>
                  <h2 className="text-xl font-bold text-[#1a3a2a] mb-1">
                    {data.targetGrade} Reading Readiness
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
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
                        <span key={s.skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25">
                          💪 {s.skill}
                        </span>
                      ))}
                      {data.latestProfile.weaknesses.slice(0, 2).map(w => (
                        <span key={w.skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f5f0e8] text-[#936605] border border-[#d4a017]/30">
                          🎯 {w.skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="flex flex-row sm:flex-col gap-2.5 flex-wrap flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-start">
                  <Link
                    to="/student/plan"
                    className="bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:from-[#24523b] hover:to-[#1a3a2a] text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all text-center"
                  >
                    Continue Learning →
                  </Link>
                  <Link
                    to="/student/profile"
                    className="bg-[#f8faf9] hover:bg-[#e8f4f0]/60 text-[#1a3a2a] border border-[#1a3a2a]/15 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all text-center"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* 5 Skill Cards */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                  <span>📊</span> Your Reading Skills
                </h2>
                <span className="text-xs text-gray-400 font-medium">Click any skill to practice</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
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
          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                  <span>📅</span> {data.learningPlan.title}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Your structured weekly progression pathway</p>
              </div>
              <Link to="/student/plan" className="text-xs font-bold text-[#2d6a4f] hover:text-[#1a3a2a] flex items-center gap-1 transition-colors">
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
                  <div
                    key={week.id}
                    className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
                      isCurrentWeek
                        ? 'bg-gradient-to-r from-[#e8f4f0]/90 via-white to-white border border-[#2d6a4f]/35 shadow-xs'
                        : 'bg-gray-50/70 border border-gray-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      pct === 100
                        ? 'bg-[#2d6a4f] text-white shadow-xs'
                        : isCurrentWeek
                        ? 'bg-[#1a3a2a] text-[#d4a017] shadow-xs'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {pct === 100 ? '✓' : week.weekNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className={`text-sm font-bold truncate ${isCurrentWeek ? 'text-[#1a3a2a]' : 'text-gray-700'}`}>
                          {week.title}
                        </p>
                        {isCurrentWeek && (
                          <span className="text-[10px] font-bold text-[#2d6a4f] bg-[#e8f4f0] px-2 py-0.5 rounded-full ml-2 flex-shrink-0 border border-[#2d6a4f]/20">
                            Current Week
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${pct === 100 ? 'bg-[#2d6a4f]' : 'bg-[#d4a017]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{completed}/{total}</span>
                      </div>
                    </div>
                    {isCurrentWeek && (
                      <Link
                        to="/student/plan"
                        className="text-xs font-bold text-white bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:from-[#24523b] hover:to-[#1a3a2a] px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex-shrink-0"
                      >
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
          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                <span>📘</span> Assigned Work
              </h2>
              <Link to="/student/assignments" className="text-xs font-bold text-[#2d6a4f] hover:text-[#1a3a2a]">
                View all ({data?.assignments?.length || 0}) →
              </Link>
            </div>
            {data?.assignments?.length ? (
              <div className="space-y-2.5">
                {data.assignments.slice(0, 4).map(item => {
                  const targetHref = item.contentType === 'assessment'
                    ? `/student/assessments/${item.contentId}`
                    : item.contentType === 'lesson'
                    ? '/student/plan'
                    : '/student/reading-practice'

                  return (
                    <Link
                      key={item.id}
                      to={targetHref}
                      className="flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/70 hover:bg-[#e8f4f0]/50 border border-gray-100 hover:border-[#2d6a4f]/25 transition-all group"
                    >
                      <span className="w-10 h-10 rounded-xl bg-white border border-[#1a3a2a]/10 flex items-center justify-center text-xl shadow-xs flex-shrink-0">
                        {item.contentType === 'assessment' ? '📋' : item.contentType === 'lesson' ? '📘' : '📖'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-[#1a3a2a] truncate group-hover:text-[#2d6a4f] transition-colors">
                          {item.contentTitle}
                        </span>
                        <span className="block text-xs text-gray-500 font-medium">
                          {item.contentType === 'assessment'
                            ? 'Reading Assessment'
                            : item.contentType === 'lesson'
                            ? 'Guided Lesson'
                            : 'Reading Passage'} · Assigned {new Date(item.assignedAt).toLocaleDateString()}
                        </span>
                      </span>
                      <span className="text-gray-400 group-hover:text-[#2d6a4f] group-hover:translate-x-0.5 transition-all text-sm font-bold">
                        →
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-6 text-center">No assigned work yet. Your next activities will appear here.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1a3a2a] mb-4 flex items-center gap-2">
              <span>⚡</span> Recent Activity
            </h2>
            {data?.recentActivity?.length ? (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 4).map(activity => (
                  <div key={activity.id} className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-gray-50/70 transition-colors">
                    <span className="w-8 h-8 rounded-xl bg-[#e8f4f0] text-[#1a3a2a] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#2d6a4f]/20">
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1a3a2a] truncate">{activity.metric.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{activity.value} · {new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-6 text-center">Complete an activity to start your progress history.</p>
            )}
          </div>
        </div>

        {/* Bottom row: Quick practice + Badges */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Quick practice */}
          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1a3a2a] mb-3.5 flex items-center gap-2">
              <span>🎯</span> Quick Practice
            </h2>
            <div className="space-y-2">
              {[
                { skill: 'VOCABULARY' as SkillArea,       label: '📚 Vocabulary',        desc: 'Practice high-frequency words' },
                { skill: 'COMPREHENSION' as SkillArea,    label: '🧠 Comprehension',     desc: 'Reading passages & questions' },
                { skill: 'PHONICS_DECODING' as SkillArea, label: '🔤 Phonics & Decoding', desc: 'Sound out and decode new words' },
              ].map(item => (
                <Link
                  key={item.skill}
                  to={`/student/practice/${item.skill.toLowerCase()}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#e8f4f0]/40 border border-transparent hover:border-[#2d6a4f]/20 transition-all group"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1a3a2a] group-hover:text-[#2d6a4f] transition-colors">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-[#2d6a4f] group-hover:translate-x-0.5 transition-all font-bold">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-3xl border border-[#1a3a2a]/10 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2">
                <span>🏆</span> Earned Badges
              </h2>
              <span className="text-xs font-bold text-[#936605] bg-[#d4a017]/15 border border-[#d4a017]/30 px-2.5 py-0.5 rounded-full">
                {data?.badges?.length ?? 0} earned
              </span>
            </div>
            {data?.badges && data.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {data.badges.map(b => (
                  <Badge key={b.id} badgeType={b.badgeType} earnedAt={b.earnedAt} size="sm" />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🌟</p>
                <p className="text-sm font-semibold text-gray-700">Complete activities to earn badges!</p>
                <p className="text-xs text-gray-400 mt-1">Badges unlock as you finish lessons and reading practice.</p>
              </div>
            )}
          </div>
        </div>


        {/* Assigned content from admin/teacher */}
        <AssignedContent />

        {/* Reassessment prompt */}
        {data?.hasCompletedAssessment && data.readinessScore !== null && (
          <div className="rounded-3xl bg-gradient-to-r from-[#1a3a2a] via-[#24523b] to-[#2d6a4f] text-white border border-[#2d6a4f]/35 p-6 shadow-md">
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl flex-shrink-0">
                📈
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-base">Ready to check your progress?</h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">Take a fresh assessment and see how much you've grown across all five core reading skills.</p>
              </div>
              <Link
                to="/student/assessment"
                className="bg-gradient-to-r from-[#d4a017] to-[#b88912] hover:brightness-105 text-[#1a3a2a] font-bold text-sm px-5 py-2.5 rounded-xl flex-shrink-0 self-start xs:self-auto shadow-sm transition-all"
              >
                Retake Assessment
              </Link>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
 