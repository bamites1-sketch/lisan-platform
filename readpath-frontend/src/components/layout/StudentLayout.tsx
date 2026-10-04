import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import type { StudentProfile } from '../../types'
import AiTutor from '../AiTutor'
import LangSwitcher from './LangSwitcherSidebar'
import NotificationBell from '../ui/NotificationBell'
import OfflinePwaBanner from '../ui/OfflinePwaBanner'
import { InstallAppModal } from '../ui/InstallAppModal'
import { apiUrl } from '../../lib/apiBase'

interface NavItem {
  label: string
  icon: string
  path: string
  badgeKey?: 'assessments' | 'readings' | 'chat'
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "TODAY'S PATH",
    items: [
      { label: 'Dashboard',   icon: '⌂', path: '/student/dashboard' },
      { label: 'My Lessons',  icon: '📖', path: '/student/plan' },
      { label: 'Assignments', icon: '☑', path: '/student/assignments', badgeKey: 'readings' },
    ]
  },
  {
    title: 'LEARNING ACTIVITIES',
    items: [
      { label: 'Live AI Coach',      icon: '🎙️', path: '/student/karaoke-coach' },
      { label: 'Bilingual Stories',  icon: '📚', path: '/student/bilingual-library' },
      { label: 'Reading Battle',     icon: '🏆', path: '/student/reading-battle' },
      { label: 'Reading Passages',   icon: '▣', path: '/student/reading-practice' },
      { label: 'Vocabulary & Fluency', icon: 'Aa', path: '/student/practice/fluency' },
    ]
  },
  {
    title: 'EVALUATION & GROWTH',
    items: [
      { label: 'Assessments',          icon: '♢', path: '/student/assessments', badgeKey: 'assessments' },
      { label: 'Assessment Feedback',  icon: '📋', path: '/student/assessment-feedback' },
      { label: 'My Reading Profile',   icon: '📊', path: '/student/profile' },
      { label: 'My Progress',          icon: '📈', path: '/student/progress' },
    ]
  },
  {
    title: 'COMMUNICATION & HELP',
    items: [
      { label: 'Admin Chat', icon: '💬', path: '/student/chat', badgeKey: 'chat' },
      { label: 'Classes',    icon: '🎓', path: '/student/classes' },
      { label: 'Resources',  icon: '📁', path: '/student/resources' },
    ]
  }
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [installModalOpen, setInstallModalOpen] = useState(false)
  const profile = user?.profile as StudentProfile
  const [pendingReadings, setPendingReadings] = useState(0)
  const [pendingAssessments, setPendingAssessments] = useState(0)
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  // Load pending assignments count
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

  // Load pending assessments
  useEffect(() => {
    fetch(apiUrl('/api/assessments'), { headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token') ?? ''}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setPendingAssessments(data?.data?.counts?.pending ?? 0))
      .catch(() => {})
  }, [])

  // Poll unread chat messages from admin
  useEffect(() => {
    const token = localStorage.getItem('lisan_token') ?? ''
    if (!token) return
    const fetchUnread = () => {
      fetch(apiUrl('/api/direct-chat/unread-count'), { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => setUnreadChatCount(data?.data?.unreadCount ?? 0))
        .catch(() => {})
    }
    fetchUnread()
    const timer = setInterval(fetchUnread, 4000)
    return () => clearInterval(timer)
  }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/') }

  const getBadge = (key?: string) => {
    if (key === 'assessments') return pendingAssessments
    if (key === 'readings') return pendingReadings
    if (key === 'chat') return unreadChatCount
    return 0
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col antialiased text-gray-900">
      {/* ── SIDEBAR (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1a3a2a] via-[#1a3a2a] to-[#12281d] border-r border-[#2d6a4f]/25 fixed h-full z-20 text-white shadow-2xl">
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-white/10">
          <Link to="/student/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md shadow-black/20 group-hover:scale-105 transition-transform flex-shrink-0 p-1 flex items-center justify-center">
              <img src="/icon-192.png" alt="LiSAN" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wide text-white">LiSAN</span>
              <span className="block text-[9px] text-[#d4a017] font-semibold tracking-widest uppercase">
                LEARNER PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Student Mini Card */}
        <div className="px-3 pt-3">
          <Link
            to="/student/profile"
            className="block p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#d4a017] to-[#b88912] rounded-full flex items-center justify-center text-[#1a3a2a] font-black text-sm shadow-xs flex-shrink-0">
                {profile?.firstName?.[0] ?? 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-200 transition-colors">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-white/60 font-medium">Grade {profile?.grade?.replace('GRADE_', '')}</span>
                  <span className="text-[10px] text-[#d4a017] font-bold">⚡ {profile?.xp ?? 0}</span>
                </div>
              </div>
              <span className="text-white/40 group-hover:text-white/80 transition-colors text-xs">→</span>
            </div>
          </Link>
        </div>

        {/* Grouped Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-[#d4a017]/80 tracking-wider uppercase">
                {group.title}
              </p>
              {group.items.map(item => {
                const active = location.pathname === item.path ||
                  (item.path.startsWith('/student/practice') && location.pathname.startsWith('/student/practice'))
                const badge = getBadge(item.badgeKey)

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#2d6a4f] to-[#387e60] text-white shadow-sm border-l-[3px] border-[#d4a017]'
                        : 'text-emerald-100/75 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {badge > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                        active ? 'bg-[#d4a017] text-[#1a3a2a]' : 'bg-rose-500 text-white shadow-xs'
                      }`}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer controls */}
        <div className="p-3 border-t border-white/10 space-y-1 bg-[#142e21]/40">
          <button
            type="button"
            onClick={() => setInstallModalOpen(true)}
            className="flex items-center gap-2.5 text-xs font-semibold text-[#f3ca52] hover:text-white w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span>📲</span> Download App
          </button>
          <LangSwitcher />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 text-xs font-semibold text-white/70 hover:text-white w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span>🚪</span> {t.signOut}
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER (Phone & Tablet) ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a3a2a] text-white border-b border-[#2d6a4f]/30 z-30 px-4 py-2.5 flex items-center justify-between shadow-md">
        <Link to="/student/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-xs p-0.5 flex-shrink-0">
            <img src="/icon-192.png" alt="LiSAN" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-wide">LiSAN</span>
            <span className="text-[11px] text-[#d4a017] ml-1.5 font-semibold">
              G-{profile?.grade?.replace('GRADE_', '') || '1'}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-white">
          <NotificationBell />
          <Link
            to="/student/profile"
            className="w-8 h-8 rounded-full bg-white/10 text-[#d4a017] font-bold text-xs flex items-center justify-center border border-white/20 active:scale-95 shadow-xs"
            title="Profile"
          >
            {profile?.firstName?.[0] ?? 'S'}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center text-lg active:scale-95 cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER MENU ── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-0 right-0 bottom-0 w-[min(320px,calc(100vw-36px))] bg-[#1a3a2a] text-white z-50 shadow-2xl p-5 pt-16 overflow-y-auto border-l border-[#2d6a4f]/30 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="mb-4 p-3.5 bg-white/10 border border-white/10 rounded-2xl">
              <p className="font-bold text-white text-sm">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-xs text-emerald-200/80">Grade {profile?.grade?.replace('GRADE_', '')}</p>
              <div className="flex gap-3 mt-2 text-xs font-semibold">
                <span className="text-[#d4a017]">⚡ {profile?.xp ?? 0} XP</span>
                <span className="text-amber-400">🔥 {profile?.streakDays ?? 0}-day streak</span>
              </div>
            </div>

            <nav className="space-y-4">
              {NAV_GROUPS.map(group => (
                <div key={group.title} className="space-y-1">
                  <p className="px-2 text-[10px] font-extrabold text-[#d4a017]/80 uppercase tracking-wider">
                    {group.title}
                  </p>
                  {group.items.map(item => {
                    const active = location.pathname === item.path
                    const badge = getBadge(item.badgeKey)
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-gradient-to-r from-[#2d6a4f] to-[#387e60] text-white border-l-[3px] border-[#d4a017]'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {badge > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                            {badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/10 mt-6 space-y-2">
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setInstallModalOpen(true); }}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#d4a017]/20 border border-[#d4a017]/40 text-[#f3ca52] hover:bg-[#d4a017]/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>📲</span> Download LiSAN App
            </button>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── NATIVE MOBILE BOTTOM NAVIGATION BAR (5 CORE PILLARS) ── */}
      <nav
        aria-label="Mobile Bottom Bar"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#1a3a2a]/95 backdrop-blur-md border-t border-[#2d6a4f]/35 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { path: '/student/dashboard',          icon: '⌂',  label: 'Today' },
            { path: '/student/plan',               icon: '📖', label: 'Lessons' },
            { path: '/student/karaoke-coach',       icon: '🎙️', label: 'AI Coach' },
            { path: '/student/assessment-feedback', icon: '📋', label: 'Growth' },
            { path: '/student/chat',                icon: '💬', label: 'Chat', badge: unreadChatCount },
          ].map(tab => {
            const active = location.pathname === tab.path
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-90 relative ${
                  active ? 'text-[#d4a017]' : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                <div className="relative">
                  <span className="text-lg leading-none">{tab.icon}</span>
                  {(tab.badge ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                      {(tab.badge ?? 0) > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold mt-0.5 leading-tight ${active ? 'font-black text-[#d4a017]' : ''}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] mt-0.5 shadow-xs" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-24 lg:pb-8 min-h-screen flex flex-col">
        <OfflinePwaBanner />

        {/* Desktop Top Header Bar */}
        <div className="hidden lg:flex h-14 items-center justify-between px-6 bg-white/85 backdrop-blur-md border-b border-[#1a3a2a]/10 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span className="text-[#2d6a4f] font-bold">ልሳን LiSAN</span>
            <span>/</span>
            <span className="text-gray-900 font-extrabold capitalize">
              {location.pathname.replace('/student/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#f8faf9] border border-gray-200 px-3 py-1 rounded-xl text-xs">
              <span className="text-[#d4a017] font-bold">⚡ {profile?.xp ?? 0} XP</span>
              <span className="text-gray-300">|</span>
              <span className="text-amber-500 font-bold">🔥 {profile?.streakDays ?? 0} Days</span>
            </div>
            <NotificationBell />
            <Link
              to="/student/profile"
              className="flex items-center gap-2 pl-2 border-l border-gray-200 hover:opacity-85 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center shadow-xs">
                {profile?.firstName?.[0] ?? 'S'}
              </div>
              <span className="text-xs font-bold text-gray-800 hidden xl:block">
                {profile?.firstName}
              </span>
            </Link>
          </div>
        </div>

        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 flex-1">
          {children}
        </div>
      </main>

      {/* Floating AI Tutor helper */}
      <AiTutor />

      {/* Universal Install App Modal */}
      <InstallAppModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />
    </div>
  )
}
