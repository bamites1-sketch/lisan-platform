import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchNotifications,
  markRead,
  markAllRead,
  type AppNotification,
} from '../services/notificationService'
import { timeAgo } from '../lib/utils'
import StudentLayout from '../components/layout/StudentLayout'

// ─── How many items per page ──────────────────────────────────────────────────
const PAGE_SIZE = 6

// ─── Map notification type → display category ─────────────────────────────────
type Category = 'All' | 'Assignments' | 'Assessments' | 'Lessons' | 'Messages' | 'System'

function typeToCategory(type: AppNotification['type']): Category {
  if (type === 'new_content') return 'Assignments'          // content assigned
  if (type === 'new_assessment' || type === 'assessment_done' || type === 'assessment_reviewed') return 'Assessments'
  if (type === 'plan_updated') return 'Lessons'
  if (type === 'teacher_feedback' || type === 'new_recording') return 'Messages'
  if (type === 'system' || type === 'reminder') return 'System'
  if (type === 'achievement') return 'System'
  return 'System'
}

// ─── Icon + colour per notification type ──────────────────────────────────────
interface Style { bg: string; icon: string }
function notifStyle(type: AppNotification['type']): Style {
  switch (type) {
    case 'new_content':         return { bg: 'bg-purple-100 text-purple-600',  icon: '📋' }
    case 'new_assessment':      return { bg: 'bg-blue-100 text-blue-600',      icon: '🛡' }
    case 'assessment_done':     return { bg: 'bg-green-100 text-green-600',    icon: '🛡' }
    case 'assessment_reviewed': return { bg: 'bg-amber-100 text-amber-600',    icon: '⭐' }
    case 'plan_updated':        return { bg: 'bg-sky-100 text-sky-600',        icon: '📘' }
    case 'teacher_feedback':    return { bg: 'bg-rose-100 text-rose-600',      icon: '💬' }
    case 'new_recording':       return { bg: 'bg-rose-100 text-rose-600',      icon: '💬' }
    case 'achievement':         return { bg: 'bg-amber-100 text-amber-600',    icon: '🏆' }
    case 'reminder':            return { bg: 'bg-orange-100 text-orange-600',  icon: '🔔' }
    case 'system':
    default:                    return { bg: 'bg-teal-100 text-teal-700',      icon: '📢' }
  }
}

// ─── Where to navigate when a notification is clicked ─────────────────────────
function notifLink(notif: AppNotification, role: string): string | null {
  if (notif.link) return notif.link
  switch (notif.type) {
    case 'new_assessment':      return '/student/assessments'
    case 'assessment_reviewed': return notif.meta?.assessmentId ? `/student/assessments/${notif.meta.assessmentId}` : '/student/assessments'
    case 'assessment_done':     return '/admin/assessment-submissions'
    case 'plan_updated':        return '/student/plan'
    case 'new_content':         return '/student/assignments'
    case 'teacher_feedback':    return '/student/progress'
    case 'new_recording':       return role === 'STUDENT' ? '/student/progress' : '/teacher/dashboard'
    default:                    return null
  }
}

// ─── Grade badge ──────────────────────────────────────────────────────────────
function GradeBadge({ grade }: { grade?: string }) {
  if (!grade) return null
  const label = grade === 'ALL' ? 'All Grades' : `Grade ${grade.replace('GRADE_', '')}`
  return (
    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f5f4] text-[#003f3a] mt-1.5">
      {label}
    </span>
  )
}

// ─── Single row ───────────────────────────────────────────────────────────────
function NotifRow({
  notif,
  onRead,
}: {
  notif: AppNotification
  onRead: (id: string) => void
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { bg, icon } = notifStyle(notif.type)
  const link = notifLink(notif, user?.role ?? 'STUDENT')

  const handleClick = () => {
    if (!notif.read) onRead(notif.id)
    if (link) navigate(link)
  }

  // pick the grade from meta if present
  const grade = notif.meta?.grade ?? notif.meta?.targetGrade ?? undefined

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 transition-colors ${
        link ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${!notif.read ? 'bg-white' : 'bg-white'}`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${bg}`}>
        {notif.icon && notif.icon !== '🔔' ? notif.icon : icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>
        <GradeBadge grade={grade} />
      </div>

      {/* Right side: time + read status */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
        <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
        {!notif.read ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#168f88]">
            <span className="w-2 h-2 rounded-full bg-[#168f88] inline-block" />
            Unread
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            Read
          </span>
        )}
      </div>

      {/* Chevron */}
      {link && (
        <span className="text-gray-300 ml-1 flex-shrink-0">›</span>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-1 py-4 px-2">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-sm"
      >
        ‹
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold border transition-colors ${
            p === page
              ? 'bg-[#003f3a] text-white border-[#003f3a]'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-sm"
      >
        ›
      </button>
    </div>
  )
}

// ─── Filter tab ───────────────────────────────────────────────────────────────
const TAB_ICONS: Record<Category, string> = {
  All:         '',
  Assignments: '📋',
  Assessments: '🛡',
  Lessons:     '📘',
  Messages:    '✉',
  System:      '⚙',
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { user } = useAuth()
  const role = user?.role ?? 'STUDENT'

  const [notifs, setNotifs]   = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<Category>('All')
  const [page, setPage]       = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchNotifications()
    setNotifs(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Counts per category ──
  const countOf = (cat: Category) =>
    cat === 'All'
      ? notifs.length
      : notifs.filter(n => typeToCategory(n.type) === cat).length

  const unreadCount = notifs.filter(n => !n.read).length

  const CATEGORIES: Category[] = ['All', 'Assignments', 'Assessments', 'Lessons', 'Messages', 'System']

  // ── Filter + paginate ──
  const filtered = category === 'All'
    ? notifs
    : notifs.filter(n => typeToCategory(n.type) === category)

  const totalFiltered = filtered.length
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat)
    setPage(1)
  }

  const handleMarkRead = async (id: string) => {
    await markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const content = (
    <div className="space-y-0">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#e8f5f4] flex items-center justify-center text-xl">
            🔔
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Stay updated with your learning activities.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#003f3a] text-[#003f3a] text-sm font-semibold hover:bg-[#e8f5f4] transition-colors"
          >
            <span className="text-xs">✓</span> Mark all as read
          </button>
        )}
      </div>

      {/* ── Category tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Tab strip */}
        <div className="flex items-center gap-0 border-b border-gray-100 overflow-x-auto px-2 pt-2">
          {CATEGORIES.map(cat => {
            const count = countOf(cat)
            const active = cat === category
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-xl transition-colors relative flex-shrink-0 ${
                  active
                    ? 'text-[#003f3a] bg-[#e8f5f4]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {TAB_ICONS[cat] && <span className="text-xs">{TAB_ICONS[cat]}</span>}
                {cat}
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
                  active ? 'bg-[#003f3a] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#e8f5f4] border-t-[#003f3a] rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-4xl mb-3">🔕</p>
            <p className="font-semibold text-gray-700">No notifications here</p>
            <p className="text-sm text-gray-400 mt-1">
              {category === 'All' ? "You're all caught up!" : `No ${category.toLowerCase()} notifications yet.`}
            </p>
          </div>
        ) : (
          <div>
            {paginated.map(notif => (
              <NotifRow key={notif.id} notif={notif} onRead={handleMarkRead} />
            ))}
          </div>
        )}

        {/* ── Footer: count + pagination ── */}
        {!loading && totalFiltered > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalFiltered)}–{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered} notification{totalFiltered !== 1 ? 's' : ''}
            </p>
            <Pagination
              page={page}
              total={totalFiltered}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )

  if (role === 'STUDENT') {
    return <StudentLayout>{content}</StudentLayout>
  }

  // Non-student roles — simple wrapper (teacher/admin have their own layouts)
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
      {content}
    </div>
  )
}
