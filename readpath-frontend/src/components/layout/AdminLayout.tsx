import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import NotificationBell from '../ui/NotificationBell';
import LangSwitcher from '../ui/LangSwitcher';

export type AdminMainTab =
  | 'dashboard'
  | 'students'
  | 'student-chat'
  | 'parents'
  | 'parent-feedback'
  | 'admins'
  | 'content'
  | 'assessments'
  | 'assessment-feedback'
  | 'assignments'
  | 'classes'
  | 'resources'
  | 'recordings'
  | 'payments'
  | 'analytics'
  | 'reports'
  | 'settings';

export interface AdminNavItem {
  id: AdminMainTab;
  label: string;
  icon: string;
  path: string;
}

export interface AdminNavGroup {
  groupTitle: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupTitle: 'OVERVIEW & INTEL',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
      { id: 'analytics', label: 'Analytics', icon: '📈', path: '/admin/dashboard?tab=analytics' },
      { id: 'reports',   label: 'Reports',   icon: '📊', path: '/admin/dashboard?tab=reports' },
    ]
  },
  {
    groupTitle: 'LEARNERS & COMMUNITY',
    items: [
      { id: 'students',        label: 'Students',        icon: '👥', path: '/admin/dashboard?tab=students' },
      { id: 'student-chat',    label: 'Student Chat',    icon: '💬', path: '/admin/chat' },
      { id: 'parents',         label: 'Parents',         icon: '👨‍👩‍👧', path: '/admin/dashboard?tab=parents' },
      { id: 'parent-feedback', label: 'Parent Feedback', icon: '📬', path: '/admin/parent-feedback' },
    ]
  },
  {
    groupTitle: 'ACADEMICS & CURRICULUM',
    items: [
      { id: 'assessments',         label: 'Assessments',         icon: '📋', path: '/admin/dashboard?tab=assessments' },
      { id: 'assessment-feedback', label: 'Assessment Feedback', icon: '📝', path: '/admin/assessment-feedback' },
      { id: 'assignments',         label: 'Assignments',         icon: '✍️', path: '/admin/dashboard?tab=assignments' },
      { id: 'classes',             label: 'Classes',             icon: '🎓', path: '/admin/dashboard?tab=classes' },
      { id: 'content',             label: 'Content Library',     icon: '📚', path: '/admin/dashboard?tab=content' },
      { id: 'resources',           label: 'Resources',           icon: '☁️', path: '/admin/dashboard?tab=resources' },
    ]
  },
  {
    groupTitle: 'OPERATIONS & BILLING',
    items: [
      { id: 'recordings', label: 'Voice Recordings', icon: '🎙️', path: '/admin/dashboard?tab=recordings' },
      { id: 'payments',   label: 'Payments',         icon: '💳', path: '/admin/dashboard?tab=payments' },
      { id: 'admins',     label: 'Admins',           icon: '🛡️', path: '/admin/dashboard?tab=admins' },
      { id: 'settings',   label: 'Settings',         icon: '⚙️', path: '/admin/dashboard?tab=settings' },
    ]
  }
];

export const ALL_ADMIN_TABS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(g => g.items);

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: AdminMainTab;
  breadcrumb?: string;
  onTabSelect?: (tab: AdminMainTab) => void;
}

export default function AdminLayout({
  children,
  activeTab = 'dashboard',
  breadcrumb,
  onTabSelect
}: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Content admin check
  const profile = user?.profile as { firstName?: string; lastName?: string; adminRole?: string } | undefined;
  const isContentAdmin = profile?.adminRole === 'CONTENT_ADMIN' || user?.email === 'content@lisan.com';
  const adminName = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Admin'
    : 'Admin';

  const filterItems = (items: AdminNavItem[]) =>
    items.filter(item =>
      isContentAdmin ? ['assignments', 'content'].includes(item.id) : true
    );

  const handleTabClick = (item: AdminNavItem) => {
    setSidebarOpen(false);
    if (onTabSelect) {
      onTabSelect(item.id);
    } else {
      navigate(item.path);
    }
  };

  const currentTabObj = ALL_ADMIN_TABS.find(t => t.id === activeTab);
  const currentTabLabel = breadcrumb || currentTabObj?.label || 'Console';

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col lg:flex-row antialiased text-gray-900">
      {/* ── SIDEBAR (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1a3a2a] via-[#1a3a2a] to-[#12281d] border-r border-[#2d6a4f]/25 fixed h-full z-30 text-white shadow-2xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] flex items-center justify-center text-xl font-black shadow-md shadow-black/20 group-hover:scale-105 transition-transform flex-shrink-0">
              ል
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wide text-white">LiSAN</span>
              <span className="block text-[9px] text-[#d4a017] font-semibold tracking-widest uppercase">
                ADMIN CONSOLE
              </span>
            </div>
          </Link>
        </div>

        {/* Grouped Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {ADMIN_NAV_GROUPS.map(group => {
            const visibleGroupItems = filterItems(group.items);
            if (visibleGroupItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold text-[#d4a017]/80 tracking-wider uppercase">
                  {group.groupTitle}
                </p>
                {visibleGroupItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#2d6a4f] to-[#36795b] text-white shadow-sm border-l-[3px] border-[#d4a017]'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {['student-chat', 'parent-feedback', 'assessment-feedback'].includes(item.id) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom profile & actions */}
        <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-2 bg-[#142e21]/50">
          <div className="flex items-center justify-between px-1">
            <LangSwitcher compact />
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span>🚪</span> {t.signOut}
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR & QUICK NAV ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a3a2a] text-white border-b border-[#2d6a4f]/30 z-40 shadow-md">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] rounded-lg flex items-center justify-center font-black text-sm shadow-xs">
              ል
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-wide">LiSAN</span>
              <span className="text-xs text-[#d4a017] ml-1.5 font-semibold capitalize">
                | {currentTabLabel}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className="p-2 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Horizontal scrollable tab pills for fast mobile access */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto no-scrollbar border-t border-white/10 bg-[#142e21]">
          {filterItems(ALL_ADMIN_TABS).map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#d4a017] text-[#1a3a2a] shadow-xs font-bold'
                    : 'text-white/75 hover:text-white hover:bg-white/10 font-semibold'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-[min(300px,calc(100vw-40px))] bg-[#1a3a2a] text-white z-50 shadow-2xl flex flex-col border-r border-[#2d6a4f]/30 animate-in slide-in-from-left duration-200">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] rounded-lg flex items-center justify-center font-bold text-sm">
                  ል
                </div>
                <div>
                  <span className="font-extrabold text-white text-base">LiSAN</span>
                  <span className="block text-[9px] text-[#d4a017] font-semibold tracking-widest uppercase">
                    Admin Panel
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
              {ADMIN_NAV_GROUPS.map(group => {
                const visibleGroupItems = filterItems(group.items);
                if (visibleGroupItems.length === 0) return null;

                return (
                  <div key={group.groupTitle} className="space-y-1">
                    <p className="px-2 text-[10px] font-extrabold text-[#d4a017]/80 uppercase tracking-wider">
                      {group.groupTitle}
                    </p>
                    {visibleGroupItems.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item)}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-[#2d6a4f] to-[#36795b] text-white font-bold border-l-[3px] border-[#d4a017]'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="px-4 py-4 pt-3 border-t border-white/10 space-y-2 bg-[#142e21]/50">
              <LangSwitcher compact />
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                🚪 {t.signOut}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 min-h-screen bg-[#f8faf9] flex flex-col">
        {/* Top bar (Desktop) */}
        <div className="hidden lg:flex items-center justify-between px-7 py-3 bg-white/85 backdrop-blur-md border-b border-[#1a3a2a]/10 sticky top-0 z-20 shadow-xs flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <Link to="/admin/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
              Admin
            </Link>
            <span className="text-[#2d6a4f]/40">/</span>
            <span className="font-extrabold text-[#1a3a2a] capitalize">
              {currentTabLabel}
            </span>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <LangSwitcher compact />
            <div className="flex items-center gap-2.5 px-3 py-1 bg-white border border-[#1a3a2a]/10 rounded-xl text-xs shadow-2xs">
              <span className="w-6 h-6 bg-[#1a3a2a] text-[#d4a017] rounded-lg flex items-center justify-center text-xs font-black">
                {adminName[0]}
              </span>
              <span className="font-bold text-gray-800">{adminName}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              {t.signOut}
            </button>
          </div>
        </div>

        {/* Content Children */}
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
