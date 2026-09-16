import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import type { StudentProfile } from '../../types'
import AiTutor from '../AiTutor'
import LangSwitcher from './LangSwitcherSidebar'
import NotificationBell from '../ui/NotificationBell'

const NAV_ITEMS = [
  { label: 'Dashboard',        icon: '⌂',  path: '/student/dashboard' },
  { label: 'My Lessons',       icon: '▤',  path: '/student/plan' },
  { label: 'Reading Passages', icon: '▣',  path: '/student/reading-practice' },
  { label: 'Assignments',      icon: '☑',  path: '/student/assignments' },
  { label: 'Classes',           icon: '🎓', path: '/student/classes' },
  { label: 'Assessments',      icon: '♢',  path: '/student/assessments' },
  { label: 'Reading Practice', icon: '♩',  path: '/student/practice/fluency' },
  { label: 'Vocabulary',       icon: 'Aa', path: '/student/practice/vocabulary' },
  { label: 'My Progress',      icon: '▥',  path: '/student/progress' },
  { label: 'Notifications',    icon: '✉',  path: '/notifications' },
  { label: 'Profile',          icon: '⚙',  path: '/student/profile' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profile = user?.profile as StudentProfile
  const [pendingReadings, setPendingReadings] = useState(0)
  const [pendingAssessments, setPendingAssessments] = useState(0)

  // Load pending reading-practice count from API
  useEffect(() => {
    if (!profile?.grade) return
    const token = localStorage.getItem('lisan_token') ?? ''
    fetch('/api/students/assignments', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!j?.data) return
        const count = (j.data as { grade: string; status: string }[])
          .filter(a => a.status !== 'archived' && (a.grade === profile.grade || a.grade === 'ALL'))
          .length
        setPendingReadings(count)
      })
      .catch(() => {})
  }, [profile?.grade])

  useEffect(() => {
    fetch('/api/assessments', { headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token') ?? ''}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setPendingAssessments(data?.data?.counts?.pending ?? 0))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#003f3a] fixed h-full z-20 text-white shadow-xl">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link to="/student/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#f2c94c] text-[#003f3a] flex items-center justify-center text-xl font-black">L</div>
              <div><span className="text-xl font-extrabold tracking-wide">LiSAN</span><span className="block text-[9px] text-[#f2c94c] tracking-widest">READ · LEARN · GROW</span></div>
            </Link>
          </div>
        </div>

        {/* Student info */}
        <Link to="/student/profile" className="block p-4 mx-3 mt-3 bg-white/10 rounded-2xl hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f2c94c] rounded-full flex items-center justify-center text-[#003f3a] font-bold">
              {profile?.firstName?.[0] ?? 'S'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-xs text-white/60">Grade {profile?.grade?.replace('GRADE_', '')}</p>
            </div>
            <span className="ml-auto text-white/70">⌄</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path || (item.path.startsWith('/student/practice') && location.pathname.startsWith('/student/practice'))
            const badge = item.label === 'Assessments' ? pendingAssessments : item.label === 'Reading Passages' ? pendingReadings : 0
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#168f88] text-white shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="w-6 text-center text-lg font-semibold">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    active ? 'bg-white text-[#168f88]' : 'bg-red-500 text-white'
                  }`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <LangSwitcher />
          <button onClick={handleLogout} className="flex items-center gap-3 text-sm text-white/70 hover:text-white w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
            <span>⇥</span> {t.signOut}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-30 px-4 py-3 flex items-center justify-between">
        <Link to="/student/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">ል</span>
          </div>
          <span className="font-bold text-gray-900">Lisan | ልሳን</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
      )}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-0 right-0 bottom-0 w-[min(288px,calc(100vw-40px))] bg-white z-50 shadow-xl p-5 pt-16 overflow-y-auto safe-top safe-bottom">
          <div className="mb-4 p-3 bg-brand-50 rounded-xl">
            <p className="font-semibold text-gray-900">{profile?.firstName} {profile?.lastName}</p>
            <p className="text-xs text-gray-500">Grade {profile?.grade?.replace('GRADE_', '')}</p>
            <div className="flex gap-3 mt-1.5 text-xs text-gray-600">
              <span>⚡ {profile?.xp ?? 0} XP</span>
              <span>🔥 {profile?.streakDays ?? 0}-day streak</span>
            </div>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const badge = item.label === 'Assessments' ? pendingAssessments : item.label === 'Reading Passages' ? pendingReadings : 0
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="text-[10px] font-bold w-4 h-4 bg-brand-500 text-white rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          <button onClick={handleLogout} className="mt-4 flex items-center gap-2 text-sm text-gray-500 px-3 py-2">
            🚪 Sign Out
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="hidden lg:flex h-16 items-center gap-4 px-6 bg-white/90 border-b border-gray-100 sticky top-0 z-10">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="Search lessons, passages, or anything..." />
          </div>
          <NotificationBell />
          <Link to="/student/profile" className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <span className="w-8 h-8 rounded-full bg-[#006b63] text-white text-xs font-bold flex items-center justify-center">{profile?.firstName?.[0] ?? 'S'}</span>
            <span className="hidden xl:block text-left"><span className="block text-xs font-semibold text-gray-800">{profile?.firstName} {profile?.lastName}</span><span className="block text-[11px] text-gray-400">Grade {profile?.grade?.replace('GRADE_', '')} · Student</span></span>
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* AI Tutor floating button */}
      <AiTutor />
    </div>
  )
}
