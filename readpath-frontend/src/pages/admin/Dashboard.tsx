import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

// ─── Tab definitions ──────────────────────────────────────────────────────────
type MainTab = 'dashboard' | 'students' | 'parents' | 'admins' | 'content' | 'assessments' | 'assignments' | 'classes' | 'resources' | 'recordings' | 'payments' | 'analytics' | 'reports' | 'settings'
type PaymentSubTab = 'verifications' | 'plans' | 'transactions'
type AssessmentSubTab = 'list' | 'results'
type AssignmentSubTab = 'assignments' | 'lesson-assignments'
type ResourceSubTab = 'materials' | 'library'

const MAIN_TABS: { id: MainTab; label: string; icon: string; hasSubmenu?: boolean }[] = [
  { id: 'dashboard',    label: 'Dashboard',     icon: '🏠' },
  { id: 'students',     label: 'Students',      icon: '👥' },
  { id: 'parents',      label: 'Parents',       icon: '👨‍👩‍👧' },
  { id: 'admins',       label: 'Admins',        icon: '🛡️' },
  { id: 'content',      label: 'Content',       icon: '📚' },
  { id: 'assessments',  label: 'Assessments',   icon: '📋', hasSubmenu: true },
  { id: 'assignments',  label: 'Assignments',   icon: '📝', hasSubmenu: true },
  { id: 'classes',      label: 'Classes',       icon: '🎓' },
  { id: 'resources',    label: 'Resources',     icon: '☁️', hasSubmenu: true },
  { id: 'recordings',   label: 'Voice Recordings', icon: '🎙️' },
  { id: 'payments',     label: 'Payments',      icon: '💳', hasSubmenu: true },
  { id: 'analytics',    label: 'Analytics',     icon: '📈' },
  { id: 'reports',      label: 'Reports',       icon: '📊' },
  { id: 'settings',     label: 'Settings',      icon: '⚙️' },
]

const PAYMENT_TABS: { id: PaymentSubTab; label: string; icon: string }[] = [
  { id: 'verifications', label: 'Payment Verifications', icon: '✓' },
  { id: 'plans',         label: 'Plans',                 icon: '📋' },
  { id: 'transactions',  label: 'Transactions',          icon: '📄' },
]

const ASSESSMENT_TABS: { id: AssessmentSubTab; label: string; icon: string }[] = [
  { id: 'list',    label: 'Assessment List',    icon: '📋' },
  { id: 'results', label: 'Assessment Results', icon: '📊' },
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

  const [mainTab, setMainTab]             = useState<MainTab>('dashboard')
  const [paymentSubTab, setPaymentSub]    = useState<PaymentSubTab>('verifications')
  const [assessmentSubTab, setAssessmentSub] = useState<AssessmentSubTab>('list')
  const [assignmentSubTab, setAssignmentSub] = useState<AssignmentSubTab>('assignments')
  const [resourceSubTab, setResourceSub]  = useState<ResourceSubTab>('materials')
  const [sidebarOpen, setSidebar]         = useState(false)

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
  const [_init] = useState(() => {
    if (isContentAdmin) setTimeout(() => setMainTab('assignments'), 0)
    return null
  })

  // Navigation handler — allows child tabs to switch main tab
  const handleNavigate = (target: string) => {
    const allowed = isContentAdmin ? ['assignments', 'content'] : null
    if (allowed && !allowed.includes(target)) return   // block restricted tabs
    setMainTab(target as MainTab)
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 fixed h-full z-20 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-none">{t.appName}</p>
              <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-4 py-3 mx-3 mt-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {adminName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{adminName}</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {VISIBLE_MAIN_TABS.map(tab => (
            <div key={tab.id}>
              <button onClick={() => setMainTab(tab.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  mainTab === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <div className="flex items-center gap-2.5">
                  <span>{tab.icon}</span>{tab.label}
                </div>
                {tab.hasSubmenu && (
                  <span className="text-xs">{mainTab === tab.id ? '▼' : '▶'}</span>
                )}
              </button>

              {/* Payments submenu */}
              {tab.id === 'payments' && mainTab === 'payments' && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {PAYMENT_TABS.map(subTab => (
                    <button key={subTab.id} onClick={() => setPaymentSub(subTab.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        paymentSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}>
                      <span>{subTab.icon}</span>{subTab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Assessments submenu */}
              {tab.id === 'assessments' && mainTab === 'assessments' && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {ASSESSMENT_TABS.map(subTab => (
                    <button key={subTab.id} onClick={() => setAssessmentSub(subTab.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        assessmentSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}>
                      <span>{subTab.icon}</span>{subTab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Assignments submenu */}
              {tab.id === 'assignments' && mainTab === 'assignments' && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {ASSIGNMENT_TABS.map(subTab => (
                    <button key={subTab.id} onClick={() => setAssignmentSub(subTab.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        assignmentSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}>
                      <span>{subTab.icon}</span>{subTab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Resources submenu */}
              {tab.id === 'resources' && mainTab === 'resources' && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {RESOURCE_TABS.map(subTab => (
                    <button key={subTab.id} onClick={() => setResourceSub(subTab.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        resourceSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}>
                      <span>{subTab.icon}</span>{subTab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
          <LangSwitcher compact />
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <span>🚪</span> {t.signOut}
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">{t.appName}</span>
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-xs text-gray-500">Admin</span>
        </div>
        <button onClick={() => setSidebar(p => !p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">☰</button>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebar(false)} />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-xl flex flex-col">
            <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="font-bold text-gray-900">{t.appName}</span>
              </div>
              <button onClick={() => setSidebar(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {VISIBLE_MAIN_TABS.map(tab => (
                <div key={tab.id}>
                  <button onClick={() => { setMainTab(tab.id); setSidebar(false) }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      mainTab === tab.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <div className="flex items-center gap-2.5">
                      <span>{tab.icon}</span>{tab.label}
                    </div>
                    {tab.hasSubmenu && (
                      <span className="text-xs">{mainTab === tab.id ? '▼' : '▶'}</span>
                    )}
                  </button>

                  {/* Payments submenu */}
                  {tab.id === 'payments' && mainTab === 'payments' && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {PAYMENT_TABS.map(subTab => (
                        <button key={subTab.id} onClick={() => { setPaymentSub(subTab.id); setSidebar(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                            paymentSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
                          }`}>
                          <span>{subTab.icon}</span>{subTab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Assessments submenu */}
                  {tab.id === 'assessments' && mainTab === 'assessments' && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {ASSESSMENT_TABS.map(subTab => (
                        <button key={subTab.id} onClick={() => { setAssessmentSub(subTab.id); setSidebar(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                            assessmentSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
                          }`}>
                          <span>{subTab.icon}</span>{subTab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Assignments submenu */}
                  {tab.id === 'assignments' && mainTab === 'assignments' && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {ASSIGNMENT_TABS.map(subTab => (
                        <button key={subTab.id} onClick={() => { setAssignmentSub(subTab.id); setSidebar(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                            assignmentSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
                          }`}>
                          <span>{subTab.icon}</span>{subTab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Resources submenu */}
                  {tab.id === 'resources' && mainTab === 'resources' && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {RESOURCE_TABS.map(subTab => (
                        <button key={subTab.id} onClick={() => { setResourceSub(subTab.id); setSidebar(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                            resourceSubTab === subTab.id ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
                          }`}>
                          <span>{subTab.icon}</span>{subTab.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-1">
              <LangSwitcher compact />
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100">
                🚪 {t.signOut}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        {/* Top bar (desktop only) */}
        <div className="hidden lg:flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100 sticky top-0 z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Admin</span>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-800 capitalize">
              {MAIN_TABS.find(t => t.id === mainTab)?.label}
              {mainTab === 'payments' && (
                <span className="text-gray-400 font-normal"> / {PAYMENT_TABS.find(t => t.id === paymentSubTab)?.label}</span>
              )}
              {mainTab === 'assessments' && (
                <span className="text-gray-400 font-normal"> / {ASSESSMENT_TABS.find(t => t.id === assessmentSubTab)?.label}</span>
              )}
              {mainTab === 'assignments' && (
                <span className="text-gray-400 font-normal"> / {ASSIGNMENT_TABS.find(t => t.id === assignmentSubTab)?.label}</span>
              )}
              {mainTab === 'resources' && (
                <span className="text-gray-400 font-normal"> / {RESOURCE_TABS.find(t => t.id === resourceSubTab)?.label}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <LangSwitcher compact />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl text-sm text-gray-600">
              <span className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">{adminName[0]}</span>
              <span className="hidden xl:block">{adminName}</span>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm py-1.5">{t.signOut}</button>
          </div>
        </div>

        {/* Page content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {mainTab === 'dashboard' && <OverviewTab onNavigate={handleNavigate} />}
          {mainTab === 'students' && <StudentsTab />}
          {mainTab === 'parents' && <ParentsTab />}
                    {mainTab === 'admins' && <AdminsTab />}
          {mainTab === 'recordings' && <RecordingsTab />}
          {mainTab === 'content' && <ContentTab />}
          
          {mainTab === 'assessments' && (
            <div className="space-y-5">
              {assessmentSubTab === 'list' && <AssessmentsTab />}
              {assessmentSubTab === 'results' && <AssessmentSubmissions />}
            </div>
          )}

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
