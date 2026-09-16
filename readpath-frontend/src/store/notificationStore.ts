// Notification Store — in-memory pub/sub style notification system
// Roles: STUDENT, TEACHER, ADMIN each get their own notification queue

export type NotifRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface Notification {
  id: string
  role: NotifRole
  recipientId?: string   // specific user id, or undefined = broadcast to role
  type:
    | 'new_content'        // admin assigned new content to student's grade
    | 'new_recording'      // student submitted a fluency recording
    | 'assessment_done'    // student completed assessment
    | 'new_assessment'    // admin assigned an assessment
    | 'assessment_reviewed' // admin reviewed an assessment
    | 'plan_updated'       // learning plan updated
    | 'reminder'           // practice reminder
    | 'achievement'        // badge / XP milestone
    | 'system'             // general system notification
  title: string
  message: string
  icon: string
  link?: string           // route to navigate on click
  read: boolean
  createdAt: string
  meta?: Record<string, string>
}

const uid  = () => `n_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
const now  = () => new Date().toISOString()
const dago = (d: number) => new Date(Date.now() - d * 86400000).toISOString()

let notifications: Notification[] = [
  // Student notifications
  { id: 'n1', role: 'STUDENT', type: 'new_content',    title: 'New Passage Assigned',      message: 'Admin assigned "The Ethiopian Highlands" to Grade 6.',     icon: '📖', link: '/student/dashboard', read: false, createdAt: dago(0)  },
  { id: 'n2', role: 'STUDENT', type: 'new_content',    title: 'New Lesson Assigned',       message: 'Admin assigned "Using Context Clues" to all grades.',       icon: '🎓', link: '/student/plan',       read: false, createdAt: dago(1)  },
  { id: 'n3', role: 'STUDENT', type: 'achievement',    title: '7-Day Streak! 🔥',          message: "You've read every day for 7 days in a row. Amazing work!",  icon: '🔥', link: '/student/progress',   read: true,  createdAt: dago(2)  },
  { id: 'n4', role: 'STUDENT', type: 'plan_updated',   title: 'Your Plan Updated',         message: 'Your 6-week reading plan has been refreshed.',              icon: '🗓️',  link: '/student/plan',       read: true,  createdAt: dago(3)  },
  // Teacher notifications
  { id: 'n5', role: 'TEACHER', type: 'new_recording',  title: 'New Fluency Recording',     message: 'Sara Tadesse submitted a reading of "The Market Morning".', icon: '🎤', link: '/teacher/dashboard',  read: false, createdAt: dago(0), meta: { studentName: 'Sara Tadesse', passage: 'The Market Morning' } },
  { id: 'n6', role: 'TEACHER', type: 'new_recording',  title: 'New Fluency Recording',     message: 'Abel Haile submitted a reading of "The Ethiopian Highlands".', icon: '🎤', link: '/teacher/dashboard', read: false, createdAt: dago(1), meta: { studentName: 'Abel Haile', passage: 'The Ethiopian Highlands' } },
  { id: 'n7', role: 'TEACHER', type: 'assessment_done', title: 'Assessment Completed',     message: 'Hana Girma completed their reading assessment. Score: 58.',  icon: '📝', link: '/teacher/dashboard',  read: false, createdAt: dago(2), meta: { studentName: 'Hana Girma', score: '58' } },
  // Admin notifications
  { id: 'n8',  role: 'ADMIN',  type: 'assessment_done', title: 'Assessment Completed',    message: 'Sara Tadesse completed a reading assessment. Score: 72.',    icon: '📊', link: '/admin/dashboard',    read: false, createdAt: dago(0)  },
  { id: 'n9',  role: 'ADMIN',  type: 'new_recording',   title: 'New Fluency Recording',   message: '3 new fluency recordings need review.',                     icon: '🎤', link: '/admin/dashboard',    read: false, createdAt: dago(0)  },
  { id: 'n10', role: 'ADMIN',  type: 'system',          title: 'Platform Update',         message: 'Content sync complete. 5 new passages available.',          icon: '⚙️', link: '/admin/dashboard',    read: true,  createdAt: dago(1)  },
]

export const notificationStore = {
  // Get all notifications for a role/recipient
  getForRole: (role: NotifRole, recipientId?: string): Notification[] =>
    notifications
      .filter(n => n.role === role && (!n.recipientId || n.recipientId === recipientId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getUnreadCount: (role: NotifRole, recipientId?: string): number =>
    notifications.filter(n => n.role === role && !n.read && (!n.recipientId || n.recipientId === recipientId)).length,

  markRead: (id: string) => {
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n)
  },

  markAllRead: (role: NotifRole, recipientId?: string) => {
    notifications = notifications.map(n =>
      n.role === role && (!n.recipientId || n.recipientId === recipientId)
        ? { ...n, read: true } : n
    )
  },

  // Push a new notification
  push: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification => {
    const item: Notification = { ...data, id: uid(), createdAt: now(), read: false }
    notifications = [item, ...notifications]
    return item
  },

  delete: (id: string) => {
    notifications = notifications.filter(n => n.id !== id)
  },

  clear: (role: NotifRole) => {
    notifications = notifications.filter(n => n.role !== role)
  },
}
