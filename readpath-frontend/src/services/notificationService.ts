// notificationService — real API-backed notification system
// Replaces the old in-memory notificationStore

export interface AppNotification {
  id: string
  recipientId: string
  role: string
  type:
    | 'new_content'
    | 'new_recording'
    | 'assessment_done'
    | 'new_assessment'
    | 'assessment_reviewed'
    | 'plan_updated'
    | 'teacher_feedback'
    | 'achievement'
    | 'reminder'
    | 'system'
  title: string
  message: string
  icon: string
  link?: string
  read: boolean
  meta: Record<string, string>
  createdAt: string
}

function getToken() {
  return localStorage.getItem('lisan_token') ?? ''
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

// ── Fetch notifications for the current user ──────────────────────────────────
export async function fetchNotifications(unreadOnly = false): Promise<AppNotification[]> {
  const url = `/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`
  const res = await fetch(url, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) return []
  const data = await res.json()
  return data.data ?? []
}

// ── Fetch unread count only (lightweight, used by the bell) ───────────────────
export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return 0
  const data = await res.json()
  return data.data?.count ?? 0
}

// ── Mark a single notification as read ───────────────────────────────────────
export async function markRead(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
    credentials: 'include',
  })
}

// ── Mark all notifications as read ───────────────────────────────────────────
export async function markAllRead(): Promise<void> {
  await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    headers: authHeaders(),
    credentials: 'include',
  })
}

// ── Delete a single notification ─────────────────────────────────────────────
export async function deleteNotification(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  })
}

// ── Clear all notifications for the current user ─────────────────────────────
export async function clearAllNotifications(): Promise<void> {
  await fetch('/api/notifications/clear-all', {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  })
}
