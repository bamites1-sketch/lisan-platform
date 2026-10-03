import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import type { StudentProfile } from '../../types'
import AiTutor from '../AiTutor'
import LangSwitcher from './LangSwitcherSidebar'
import NotificationBell from '../ui/NotificationBell'
import OfflinePwaBanner from '../ui/OfflinePwaBanner'
import { apiUrl } from '../../lib/apiBase'

const NAV_ITEMS = [
  { label: 'Dashboard',        icon: '⌂',  path: '/student/dashboard' },
  { label: '🎙️ Live AI Coach',  icon: '🎙️', path: '/student/karaoke-coach' },
  { label: '📖 Bilingual Stories', icon: '📖', path: '/student/bilingual-library' },
  { label: '🏆 Reading Battle',icon: '🏆', path: '/student/reading-battle' },
  { label: 'My Lessons',       icon: '▤',  path: '/student/plan' },
  { label: 'Reading Passages', icon: '▣',  path: '/student/reading-practice' },
  { label: 'Assignments',      icon: '☑',  path: '/student/assignments' },
  { label: 'Classes',           icon: '🎓', path: '/student/classes' },
  { label: 'Assessments',      icon: '♢',  path: '/student/assessments' },
  { label: 'Resources',        icon: '📁', path: '/student/resources' },
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
    fetch(apiUrl('/api/students/assignments'), { headers: { Authorization: `Bearer ${token}` } })
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
    fetch(apiUrl('/api/assessments'), { headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token') ?? ''}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setPendingAssessments(data?.data?.counts?.pending ?? 0))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1a3a2a] via-[#1a3a2a] to-[#12281d] border-r border-[#2d6a4f]/25 fixed h-full z-20 text-white shadow-2xl">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link to="/student/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] flex items-center justify-center text-xl font-black shadow-md shadow-black/20 group-hover:scale-105 transition-transform">
                ል
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-wide text-white">LiSAN</span>
                <span className="block text-[9px] text-[#d4a017] font-semibold tracking-widest">READ · LEARN · GROW</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Student info */}
        <Link to="/student/profile" className="block p-3.5 mx-3 mt-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-200 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#d4a017] to-[#b88912] rounded-full flex items-center justify-center text-[#1a3a2a] font-bold shadow-sm flex-shrink-0">
              {profile?.firstName?.[0] ?? 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-200 transition-colors">
                {profile?.firstName} {profile?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-white/60">Grade {profile?.grade?.replace('GRADE_', '')}</span>
                <span className="text-[10px] text-[#d4a017] font-semibold">⚡ {profile?.xp ?? 0}</span>
              </div>
            </div>
            <span className="text-white/40 group-hover:text-white/80 transition-colors text-sm">→</span>
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
                    ? 'bg-gradient-to-r from-[#2d6a4f] to-[#387e60] text-white shadow-md border-l-[3px] border-[#d4a017]'
                    : 'text-emerald-100/75 hover:text-white hover:bg-white/8'
                }`}
              >
                <span className="w-6 text-center text-lg font-semibold">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    active ? 'bg-[#d4a017] text-[#1a3a2a]' : 'bg-rose-500 text-white'
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
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a3a2a] text-white border-b border-[#2d6a4f]/30 z-30 px-3.5 py-2.5 flex items-center justify-between shadow-md">
        <Link to="/student/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#d4a017] to-[#b88912] rounded-lg flex items-center justify-center text-[#1a3a2a] font-bold text-sm shadow-xs">
            ል
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-wide">LiSAN</span>
            <span className="text-[11px] text-[#d4a017] ml-1.5 font-semibold">G-{profile?.grade?.replace('GRADE_', '') || '1'}</span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 text-white">
          <NotificationBell />
          <Link
            to="/student/profile"
            className="w-8 h-8 rounded-full bg-white/10 text-[#d4a017] font-bold text-xs flex items-center justify-center border border-white/20 active:scale-95"
            title="Profile"
          >
            {profile?.firstName?.[0] ?? 'S'}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center text-lg active:scale-95"
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
      )}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-0 right-0 bottom-0 w-[min(320px,calc(100vw-36px))] bg-[#1a3a2a] text-white z-50 shadow-2xl p-5 pt-16 overflow-y-auto safe-top safe-bottom border-l border-[#2d6a4f]/30 flex flex-col justify-between">
          <div>
            <div className="mb-4 p-3.5 bg-white/10 border border-white/10 rounded-2xl">
              <p className="font-bold text-white">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-xs text-white/60">Grade {profile?.grade?.replace('GRADE_', '')}</p>
              <div className="flex gap-3 mt-2 text-xs font-semibold">
                <span className="text-[#d4a017]">⚡ {profile?.xp ?? 0} XP</span>
                <span className="text-amber-400">🔥 {profile?.streakDays ?? 0}-day streak</span>
              </div>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(item => {
                const active = location.pathname === item.path || (item.path.startsWith('/student/practice') && location.pathname.startsWith('/student/practice'))
                const badge = item.label === 'Assessments' ? pendingAssessments : item.label === 'Reading Passages' ? pendingReadings : 0
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#2d6a4f] to-[#387e60] text-white border-l-[3px] border-[#d4a017]'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#d4a017] text-[#1a3a2a] rounded-full">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="pt-4 border-t border-white/10 space-y-2">
            <LangSwitcher />
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-3 py-2.5 w-full rounded-xl hover:bg-white/10 transition-colors">
              🚪 {t.signOut}
            </button>
          </div>
        </div>
      )}

      {/* ── Native Mobile Bottom Navigation Bar ── */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#1a3a2a]/95 backdrop-blur-md border-t border-[#2d6a4f]/35 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { path: '/student/dashboard', icon: '⌂', label: 'Home' },
            { path: '/student/karaoke-coach', icon: '🎙️', label: 'AI Coach' },
            { path: '/student/bilingual-library', icon: '📖', label: 'Stories' },
            { path: '/student/reading-battle', icon: '🏆', label: 'Battle' },
          ].map(tab => {
            const active = location.pathname === tab.path
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
                  active ? 'text-[#d4a017]' : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                <span className="text-lg leading-none mb-0.5">{tab.icon}</span>
                <span className={`text-[10px] font-semibold leading-tight ${active ? 'font-bold text-[#d4a017]' : ''}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] mt-0.5" />
                )}
              </Link>
            )
          })}
          {/* More Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(p => !p)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 relative ${
              mobileMenuOpen ? 'text-[#d4a017]' : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            <span className="text-lg leading-none mb-0.5">☰</span>
            <span className="text-[10px] font-semibold leading-tight">Menu</span>
            {(pendingAssessments > 0 || pendingReadings > 0) && (
              <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-[#d4a017]" />
            )}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-24 lg:pb-8 min-h-screen">
        <OfflinePwaBanner />
        <div className="hidden lg:flex h-16 items-center gap-4 px-6 bg-white/85 backdrop-blur-md border-b border-[#1a3a2a]/10 sticky top-0 z-10 shadow-xs">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              className="w-full rounded-xl border border-[#1a3a2a]/15 bg-[#f5f0e8]/30 py-2 pl-10 pr-4 text-sm outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#e8f4f0] transition-all text-gray-800 placeholder-gray-400"
              placeholder="Search lessons, passages, or vocabulary..."
            />
          </div>
          <NotificationBell />
          <Link to="/student/profile" className="flex items-center gap-2.5 pl-3 border-l border-gray-200 hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-bold flex items-center justify-center border border-[#d4a017]/40 shadow-xs">
              {profile?.firstName?.[0] ?? 'S'}
            </div>
            <span className="hidden xl:block text-left">
              <span className="block text-xs font-bold text-[#1a3a2a]">{profile?.firstName} {profile?.lastName}</span>
              <span className="block text-[11px] text-gray-500">Grade {profile?.grade?.replace('GRADE_', '')} · Student</span>
            </span>
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* AI Tutor floating button */}
      <AiTutor />
    </div>
  )
}
