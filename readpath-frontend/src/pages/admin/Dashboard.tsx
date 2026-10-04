import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { ToastProvider } from '../../components/ui/Toast'
import NotificationBell from '../../components/ui/NotificationBell'
import LangSwitcher from '../../components/ui/LangSwitcher'

import OverviewTab    from '../../components/admin/OverviewTab'
import StudentsTab    from '../../components/admin/StudentsTab'
import ParentsTab     from '../../components/admin/ParentsTab'
import AdminsTab      from '../../components/admin/AdminsTab'
import ContentTab     from '../../components/admin/ContentTab'
import AssessmentsTab from '../../components/admin/AssessmentsTab'
import AssessmentSubmissions from '../../components/admin/AssessmentSubmissions'
import AnalyticsTab   from '../../components/admin/AnalyticsTab'
import AssignmentsTab      from '../../components/admin/AssignmentsTab'
import LessonAssignmentsTab from '../../components/admin/LessonAssignmentsTab'
import PaymentsTab    from '../../components/admin/PaymentsTab'
import ClassesTab     from '../../components/admin/ClassesTab'
import ResourcesTab   from '../../components/admin/ResourcesTab'
import { PaymentPlansTab, TransactionsTab, ReportsTab, SettingsTab } from '../../components/admin/AdminTools'
import RecordingsTab  from '../../components/admin/RecordingsTab'
import ParentFeedbackTab from '../../components/admin/ParentFeedbackTab'
import StudentChatTab from '../../components/admin/StudentChatTab'
import AssessmentFeedbackTab from '../../components/admin/AssessmentFeedbackTab'
import { InstallAppModal } from '../../components/ui/InstallAppModal'

// ─── Tab definitions ──────────────────────────────────────────────────────────
type MainTab = 'dashboard' | 'students' | 'student-chat' | 'parents' | 'parent-feedback' | 'admins' | 'content' | 'assessments' | 'assessment-feedback' | 'assignments' | 'classes' | 'resources' | 'recordings' | 'payments' | 'analytics' | 'reports' | 'settings'
type PaymentSubTab = 'verifications' | 'plans' | 'transactions'
type AssessmentSubTab = 'list' | 'results' | 'feedback'
type AssignmentSubTab = 'assignments' | 'lesson-assignments'
type ResourceSubTab = 'materials' | 'library'

const MAIN_TABS: { id: MainTab; label: string; icon: string; hasSubmenu?: boolean }[] = [
  { id: 'dashboard',           label: 'Dashboard',           icon: '🏠' },
  { id: 'students',            label: 'Students',            icon: '👥' },
  { id: 'student-chat',        label: 'Student Chat',        icon: '💬' },
  { id: 'parents',             label: 'Parents',             icon: '👨‍👩‍👧' },
  { id: 'parent-feedback',     label: 'Parent Feedback',     icon: '📬' },
  { id: 'content',             label: 'Content',             icon: '📚' },
  { id: 'assessments',         label: 'Assessments',         icon: '📋', hasSubmenu: true },
  { id: 'assessment-feedback', label: 'Assessment Feedback', icon: '📝' },
  { id: 'assignments',         label: 'Assignments',         icon: '✍️', hasSubmenu: true },
  { id: 'classes',             label: 'Classes',             icon: '🎓' },
  { id: 'resources',           label: 'Resources',           icon: '☁️', hasSubmenu: true },
  { id: 'recordings',          label: 'Voice Recordings',    icon: '🎙️' },
  { id: 'payments',            label: 'Payments',            icon: '💳', hasSubmenu: true },
  { id: 'analytics',           label: 'Analytics',           icon: '📈' },
  { id: 'reports',             label: 'Reports',             icon: '📊' },
  { id: 'admins',              label: 'Admins',              icon: '🛡️' },
  { id: 'settings',            label: 'Settings',            icon: '⚙️' },
]

const TAB_GROUPS: { title: string; tabIds: MainTab[] }[] = [
  {
    title: 'OVERVIEW & INTEL',
    tabIds: ['dashboard', 'analytics', 'reports']
  },
  {
    title: 'LEARNERS & COMMUNITY',
    tabIds: ['students', 'student-chat', 'parents', 'parent-feedback']
  },
  {
    title: 'ACADEMICS & CURRICULUM',
    tabIds: ['assessments', 'assessment-feedback', 'assignments', 'classes', 'content', 'resources']
  },
  {
    title: 'OPERATIONS & BILLING',
    tabIds: ['recordings', 'payments', 'admins', 'settings']
  }
]

const PAYMENT_TABS: { id: PaymentSubTab; label: string; icon: string }[] = [
  { id: 'verifications', label: 'Payment Verifications', icon: '✓' },
  { id: 'plans',         label: 'Plans',                 icon: '📋' },
  { id: 'transactions',  label: 'Transactions',          icon: '📄' },
]

const ASSESSMENT_TABS: { id: AssessmentSubTab; label: string; icon: string }[] = [
  { id: 'list',     label: 'Assessment List',     icon: '📋' },
  { id: 'results',  label: 'Assessment Results',  icon: '📊' },
  { id: 'feedback', label: 'Diagnostic Feedback', icon: '📝' },
]

const ASSIGNMENT_TABS: { id: AssignmentSubTab; label: string; icon: string }[] = [
  { id: 'assignments',        label: 'Assignments',      icon: '📝' },
  { id: 'lesson-assignments', label: 'Lesson Assignments', icon: '🎓' },
]

const RESOURCE_TABS: { id: ResourceSubTab; label: string; icon: string }[] = [
  { id: 'materials', label: 'Materials', icon: '📦' },
  { id: 'library',   label: 'Library',   icon: '📚' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminDashboardInner() {
  const { user, logout } = useAuth()
  const { t }            = useLang()
  const navigate         = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as MainTab | null
  const subTabFromUrl = searchParams.get('subtab')

  const [mainTab, setMainTab]             = useState<MainTab>(() => {
    if (tabFromUrl && MAIN_TABS.some(t => t.id === tabFromUrl)) return tabFromUrl
    return 'dashboard'
  })
  const [paymentSubTab, setPaymentSub]    = useState<PaymentSubTab>(() => {
    if (subTabFromUrl && PAYMENT_TABS.some(t => t.id === subTabFromUrl)) return subTabFromUrl as PaymentSubTab
    return 'verifications'
  })
  const [assessmentSubTab, setAssessmentSub] = useState<AssessmentSubTab>(() => {
    if (subTabFromUrl && ASSESSMENT_TABS.some(t => t.id === subTabFromUrl)) return subTabFromUrl as AssessmentSubTab
    return 'list'
  })
  const [assignmentSubTab, setAssignmentSub] = useState<AssignmentSubTab>(() => {
    if (subTabFromUrl && ASSIGNMENT_TABS.some(t => t.id === subTabFromUrl)) return subTabFromUrl as AssignmentSubTab
    return 'assignments'
  })
  const [resourceSubTab, setResourceSub]  = useState<ResourceSubTab>('materials')
  const [sidebarOpen, setSidebar]         = useState(false)
  const [installModalOpen, setInstallModalOpen] = useState(false)

  // Sync tab if URL changes
  useEffect(() => {
    if (tabFromUrl && MAIN_TABS.some(t => t.id === tabFromUrl)) {
      setMainTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // Helper to switch main tab and update URL
  const selectMainTab = (tab: MainTab) => {
    setMainTab(tab)
    setSearchParams({ tab })
  }

  // Detect Content Admin role
  const profile = user?.profile as { firstName?: string; lastName?: string; adminRole?: string } | undefined
  const isContentAdmin = profile?.adminRole === 'CONTENT_ADMIN' || user?.email === 'content@lisan.com'
  const adminName = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
    : 'Admin'

  // Content Admin only sees Assignments + Content tabs
  const VISIBLE_MAIN_TABS = MAIN_TABS.filter(tab =>
    isContentAdmin ? ['assignments', 'content'].includes(tab.id) : true
  )

  // On first render: redirect Content Admin to their allowed first tab
  useEffect(() => {
    if (isContentAdmin && !['assignments', 'content'].includes(mainTab)) {
      setMainTab('assignments')
      setSearchParams({ tab: 'assignments' })
    }
  }, [isContentAdmin, mainTab])

  // Navigation handler — allows child tabs to switch main tab
  const handleNavigate = (target: string) => {
    const allowed = isContentAdmin ? ['assignments', 'content'] : null
    if (allowed && !allowed.includes(target)) return   // block restricted tabs
    selectMainTab(target as MainTab)
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1a3a2a] via-[#1a3a2a] to-[#12281d] border-r border-[#2d6a4f]/25 fixed h-full z-20 text-white shadow-2xl">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] flex items-center justify-center text-xl font-black shadow-md shadow-black/20 group-hover:scale-105 transition-transform">
              ል
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wide text-white">LiSAN</span>
              <span className="block text-[9px] text-[#d4a017] font-semibold tracking-widest uppercase">ADMIN CONSOLE</span>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-3.5 py-3 mx-3 mt-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] rounded-xl flex items-center justify-center text-xs font-black shadow-xs flex-shrink-0">
              {adminName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{adminName}</p>
              <span className="inline-block text-[10px] text-[#d4a017] font-semibold">
                {isContentAdmin ? 'Content Admin' : 'Super Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Main nav grouped */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin">
          {TAB_GROUPS.map(group => {
            const groupTabs = VISIBLE_MAIN_TABS.filter(t => group.tabIds.includes(t.id));
            if (groupTabs.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold text-[#d4a017]/80 tracking-wider uppercase">
                  {group.title}
                </p>
                {groupTabs.map(tab => (
                  <div key={tab.id}>
                    <button
                      onClick={() => selectMainTab(tab.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        mainTab === tab.id
                          ? 'bg-gradient-to-r from-[#2d6a4f] to-[#36795b] text-white shadow-sm border-l-[3px] border-[#d4a017]'
                          : 'text-emerald-100/75 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm flex-shrink-0">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                      </div>
                      {tab.hasSubmenu && (
                        <span className="text-[10px] opacity-70">{mainTab === tab.id ? '▼' : '▶'}</span>
                      )}
                    </button>

                    {/* Payments submenu */}
                    {tab.id === 'payments' && mainTab === 'payments' && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                        {PAYMENT_TABS.map(subTab => (
                          <button
                            key={subTab.id}
                            onClick={() => setPaymentSub(subTab.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                              paymentSubTab === subTab.id
                                ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{subTab.icon}</span>
                            {subTab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Assessments submenu */}
                    {tab.id === 'assessments' && mainTab === 'assessments' && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                        {ASSESSMENT_TABS.map(subTab => (
                          <button
                            key={subTab.id}
                            onClick={() => setAssessmentSub(subTab.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                              assessmentSubTab === subTab.id
                                ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{subTab.icon}</span>
                            {subTab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Assignments submenu */}
                    {tab.id === 'assignments' && mainTab === 'assignments' && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                        {ASSIGNMENT_TABS.map(subTab => (
                          <button
                            key={subTab.id}
                            onClick={() => setAssignmentSub(subTab.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                              assignmentSubTab === subTab.id
                                ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{subTab.icon}</span>
                            {subTab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Resources submenu */}
                    {tab.id === 'resources' && mainTab === 'resources' && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                        {RESOURCE_TABS.map(subTab => (
                          <button
                            key={subTab.id}
                            onClick={() => setResourceSub(subTab.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                              resourceSubTab === subTab.id
                                ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{subTab.icon}</span>
                            {subTab.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setInstallModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#f3ca52] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span>📲</span> Download App
          </button>
          <LangSwitcher compact />
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <span>🚪</span> {t.signOut}
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER & QUICK TAB BAR ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a3a2a] text-white border-b border-[#2d6a4f]/30 z-30 shadow-md">
        <div className="px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] rounded-lg flex items-center justify-center font-bold text-sm shadow-xs">
              ል
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-wide">LiSAN</span>
              <span className="text-xs text-[#d4a017] ml-1.5 font-semibold capitalize">
                | {MAIN_TABS.find(t => t.id === mainTab)?.label || 'Admin'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <button onClick={() => setSidebar(p => !p)} className="p-2 rounded-lg hover:bg-white/10 text-white" aria-label="Menu">☰</button>
          </div>
        </div>

        {/* Horizontal scrollable tab pills for fast mobile access */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto no-scrollbar border-t border-white/10 bg-[#142e21] touch-scroll">
          {VISIBLE_MAIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => selectMainTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                mainTab === tab.id
                  ? 'bg-[#d4a017] text-[#1a3a2a] shadow-sm font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Subtabs horizontal bar for Payments / Assessments / Assignments / Resources on mobile */}
        {mainTab === 'payments' && (
          <div className="flex items-center gap-1 px-3 py-1 overflow-x-auto no-scrollbar bg-[#10241a] border-t border-white/5">
            {PAYMENT_TABS.map(st => (
              <button
                key={st.id}
                onClick={() => setPaymentSub(st.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                  paymentSubTab === st.id ? 'bg-[#d4a017]/25 text-[#d4a017] font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                {st.icon} {st.label}
              </button>
            ))}
          </div>
        )}
        {mainTab === 'assessments' && (
          <div className="flex items-center gap-1 px-3 py-1 overflow-x-auto no-scrollbar bg-[#10241a] border-t border-white/5">
            {ASSESSMENT_TABS.map(st => (
              <button
                key={st.id}
                onClick={() => setAssessmentSub(st.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                  assessmentSubTab === st.id ? 'bg-[#d4a017]/25 text-[#d4a017] font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                {st.icon} {st.label}
              </button>
            ))}
          </div>
        )}
        {mainTab === 'assignments' && (
          <div className="flex items-center gap-1 px-3 py-1 overflow-x-auto no-scrollbar bg-[#10241a] border-t border-white/5">
            {ASSIGNMENT_TABS.map(st => (
              <button
                key={st.id}
                onClick={() => setAssignmentSub(st.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                  assignmentSubTab === st.id ? 'bg-[#d4a017]/25 text-[#d4a017] font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                {st.icon} {st.label}
              </button>
            ))}
          </div>
        )}
        {mainTab === 'resources' && (
          <div className="flex items-center gap-1 px-3 py-1 overflow-x-auto no-scrollbar bg-[#10241a] border-t border-white/5">
            {RESOURCE_TABS.map(st => (
              <button
                key={st.id}
                onClick={() => setResourceSub(st.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                  resourceSubTab === st.id ? 'bg-[#d4a017]/25 text-[#d4a017] font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                {st.icon} {st.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs" onClick={() => setSidebar(false)} />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-[min(300px,calc(100vw-40px))] bg-[#1a3a2a] text-white z-50 shadow-2xl flex flex-col border-r border-[#2d6a4f]/30">
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] rounded-lg flex items-center justify-center font-bold text-sm">
                  ል
                </div>
                <div>
                  <span className="font-extrabold text-white text-base">LiSAN</span>
                  <span className="block text-[9px] text-[#d4a017] font-semibold tracking-widest uppercase">Admin Panel</span>
                </div>
              </div>
              <button onClick={() => setSidebar(false)} className="text-white/60 hover:text-white p-1">✕</button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
              {TAB_GROUPS.map(group => {
                const groupTabs = VISIBLE_MAIN_TABS.filter(t => group.tabIds.includes(t.id));
                if (groupTabs.length === 0) return null;

                return (
                  <div key={group.title} className="space-y-1">
                    <p className="px-3 text-[10px] font-extrabold text-[#d4a017]/80 tracking-wider uppercase">
                      {group.title}
                    </p>
                    {groupTabs.map(tab => (
                      <div key={tab.id}>
                        <button
                          onClick={() => { selectMainTab(tab.id); setSidebar(false) }}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                            mainTab === tab.id
                              ? 'bg-gradient-to-r from-[#2d6a4f] to-[#36795b] text-white border-l-[3px] border-[#d4a017]'
                              : 'text-emerald-100/75 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm">{tab.icon}</span>
                            <span className="font-semibold">{tab.label}</span>
                          </div>
                          {tab.hasSubmenu && (
                            <span className="text-xs opacity-70">{mainTab === tab.id ? '▼' : '▶'}</span>
                          )}
                        </button>

                        {/* Payments submenu */}
                        {tab.id === 'payments' && mainTab === 'payments' && (
                          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                            {PAYMENT_TABS.map(subTab => (
                              <button
                                key={subTab.id}
                                onClick={() => { setPaymentSub(subTab.id); setSidebar(false) }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                                  paymentSubTab === subTab.id ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold' : 'text-white/60 hover:bg-white/5'
                                }`}
                              >
                                <span>{subTab.icon}</span>{subTab.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Assessments submenu */}
                        {tab.id === 'assessments' && mainTab === 'assessments' && (
                          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                            {ASSESSMENT_TABS.map(subTab => (
                              <button
                                key={subTab.id}
                                onClick={() => { setAssessmentSub(subTab.id); setSidebar(false) }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                                  assessmentSubTab === subTab.id ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold' : 'text-white/60 hover:bg-white/5'
                                }`}
                              >
                                <span>{subTab.icon}</span>{subTab.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Assignments submenu */}
                        {tab.id === 'assignments' && mainTab === 'assignments' && (
                          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                            {ASSIGNMENT_TABS.map(subTab => (
                              <button
                                key={subTab.id}
                                onClick={() => { setAssignmentSub(subTab.id); setSidebar(false) }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                                  assignmentSubTab === subTab.id ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold' : 'text-white/60 hover:bg-white/5'
                                }`}
                              >
                                <span>{subTab.icon}</span>{subTab.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Resources submenu */}
                        {tab.id === 'resources' && mainTab === 'resources' && (
                          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-2">
                            {RESOURCE_TABS.map(subTab => (
                              <button
                                key={subTab.id}
                                onClick={() => { setResourceSub(subTab.id); setSidebar(false) }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                                  resourceSubTab === subTab.id ? 'bg-[#d4a017]/20 text-[#d4a017] font-bold' : 'text-white/60 hover:bg-white/5'
                                }`}
                              >
                                <span>{subTab.icon}</span>{subTab.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </nav>
            <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-1">
              <button
                type="button"
                onClick={() => { setSidebar(false); setInstallModalOpen(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#f3ca52] bg-[#d4a017]/15 border border-[#d4a017]/30 hover:bg-[#d4a017]/25 transition-colors cursor-pointer"
              >
                <span>📲</span> Download LiSAN App
              </button>
              <LangSwitcher compact />
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
                🚪 {t.signOut}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 lg:ml-64 ${
        ['payments', 'assessments', 'assignments', 'resources'].includes(mainTab) ? 'pt-28' : 'pt-24'
      } lg:pt-0 min-h-screen bg-[#f8faf9]`}>
        {/* Top bar (desktop only) */}
        <div className="hidden lg:flex items-center justify-between px-7 py-3.5 bg-white/85 backdrop-blur-md border-b border-[#1a3a2a]/10 sticky top-0 z-10 shadow-xs">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-gray-400">Admin</span>
            <span className="text-[#2d6a4f]/40">/</span>
            <span className="font-bold text-[#1a3a2a] capitalize">
              {MAIN_TABS.find(t => t.id === mainTab)?.label}
              {mainTab === 'payments' && (
                <span className="text-[#2d6a4f] font-semibold"> / {PAYMENT_TABS.find(t => t.id === paymentSubTab)?.label}</span>
              )}
              {mainTab === 'assessments' && (
                <span className="text-[#2d6a4f] font-semibold"> / {ASSESSMENT_TABS.find(t => t.id === assessmentSubTab)?.label}</span>
              )}
              {mainTab === 'assignments' && (
                <span className="text-[#2d6a4f] font-semibold"> / {ASSIGNMENT_TABS.find(t => t.id === assignmentSubTab)?.label}</span>
              )}
              {mainTab === 'resources' && (
                <span className="text-[#2d6a4f] font-semibold"> / {RESOURCE_TABS.find(t => t.id === resourceSubTab)?.label}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <LangSwitcher compact />
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-[#1a3a2a]/10 rounded-xl text-sm shadow-xs">
              <span className="w-7 h-7 bg-[#1a3a2a] text-[#d4a017] rounded-lg flex items-center justify-center text-xs font-black shadow-xs">
                {adminName[0]}
              </span>
              <span className="hidden xl:block font-bold text-xs text-[#1a3a2a]">{adminName}</span>
            </div>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
              {t.signOut}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {mainTab === 'dashboard' && <OverviewTab onNavigate={handleNavigate} />}
          {mainTab === 'students' && <StudentsTab />}
          {mainTab === 'student-chat' && <StudentChatTab />}
          {mainTab === 'parents' && <ParentsTab />}
          {mainTab === 'parent-feedback' && <ParentFeedbackTab />}
          {mainTab === 'admins' && <AdminsTab />}
          {mainTab === 'recordings' && <RecordingsTab />}
          {mainTab === 'content' && <ContentTab />}
          
          {mainTab === 'assessments' && (
            <div className="space-y-5">
              {assessmentSubTab === 'list' && <AssessmentsTab />}
              {assessmentSubTab === 'results' && <AssessmentSubmissions />}
              {assessmentSubTab === 'feedback' && <AssessmentFeedbackTab />}
            </div>
          )}

          {mainTab === 'assessment-feedback' && <AssessmentFeedbackTab />}

          {mainTab === 'assignments' && (
            <div className="space-y-5">
              {assignmentSubTab === 'assignments' && <AssignmentsTab />}
              {assignmentSubTab === 'lesson-assignments' && <LessonAssignmentsTab />}
            </div>
          )}

          {mainTab === 'classes' && <ClassesTab />}

          {mainTab === 'resources' && (
            <div className="space-y-5">
              <ResourcesTab subTab={resourceSubTab} />
            </div>
          )}

          {mainTab === 'payments' && (
            <div className="space-y-5">
              {paymentSubTab === 'verifications' && <PaymentsTab />}
              {paymentSubTab === 'plans' && <PaymentPlansTab />}
              {paymentSubTab === 'transactions' && <TransactionsTab />}
            </div>
          )}

          {mainTab === 'analytics' && <AnalyticsTab />}
          {mainTab === 'reports' && <ReportsTab />}
          {mainTab === 'settings' && <SettingsTab />}
        </div>
      </main>

      {/* Universal Install App Modal */}
      <InstallAppModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />
    </div>
  )
}

// Wrap with ToastProvider so all child tabs can use useToast()
export default function AdminDashboard() {
  return (
    <ToastProvider>
      <AdminDashboardInner />
    </ToastProvider>
  )
}
