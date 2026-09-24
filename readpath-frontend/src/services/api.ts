// Central API service — all real HTTP calls go through here.
// Every function returns data or throws an Error with a human-readable message.

import { apiUrl } from '../lib/apiBase'

function token() {
  return localStorage.getItem('lisan_token') ?? ''
}

function headers(extra?: Record<string, string>) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...extra }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method,
    headers: headers(),
    credentials: 'include',
    signal,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json.message || json.error || `Request failed: ${res.status} ${res.statusText}`
    console.error(`[API] ${method} ${path} → ${res.status}`, json)
    throw new Error(msg)
  }
  return json.data as T
}

const get  = <T>(path: string, signal?: AbortSignal) => request<T>('GET',  path, undefined, signal)
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
const put  = <T>(path: string, body?: unknown) => request<T>('PUT',  path, body)
const del  = <T>(path: string) => request<T>('DELETE', path)

// ─── Types returned by the API ────────────────────────────────────────────────

export interface ApiStudent {
  id: string
  userId: string
  firstName: string
  lastName: string
  grade: string
  xp: number
  level: number
  streakDays: number
  lastActiveAt: string
  createdAt: string
  score?: number
  status?: 'PENDING' | 'PAYMENT_PENDING' | 'ACTIVE' | 'SUSPENDED'
  userStatus?: 'PENDING' | 'PAYMENT_PENDING' | 'ACTIVE' | 'SUSPENDED'
  teacherId?: string
  parentId?: string
  readingProfiles?: { readinessScore: number; createdAt: string }[]
}

export interface ApiTeacher {
  id: string
  userId: string
  firstName: string
  lastName: string
  createdAt: string
  students?: { id: string }[]
}

export interface ApiParent {
  id: string
  userId: string
  firstName: string
  lastName: string
  createdAt: string
  children?: { id: string }[]
}

export interface ApiUser {
  id: string
  email: string
  role: string
  createdAt: string
  profile?: ApiStudent | ApiTeacher | ApiParent | { firstName: string; lastName: string }
}

export interface ApiRecording {
  id: string
  studentId: string
  teacherId?: string
  passageId?: string
  passageTitle: string
  audioUrl?: string
  durationSeconds: number
  wpm: number
  accuracy: number
  cwpm: number
  totalWords: number
  pauseCount: number
  hesitationCount: number
  score: number
  reviewed: boolean
  teacherNote?: string
  teacherRating?: number
  reviewedAt?: string
  recordedAt: string
  // enriched by backend
  studentName?: string
  studentGrade?: string
}

export interface ApiPassage {
  id: string
  title: string
  content: string
  grade: string
  difficulty: string
  topic?: string
  wordCount: number
  language: string
  createdAt: string
}

export interface ApiQuestion {
  id: string
  skillArea: string
  subskill?: string
  questionText: string
  questionType: string
  options?: string
  correctAnswer: string
  explanation?: string
  grade: string
  difficulty: string
  successRate?: number
}

export interface ApiVocabulary {
  id: string
  word: string
  definition: string
  exampleSentence?: string
  grade: string
  difficulty: string
  synonyms?: string
  antonyms?: string
  partOfSpeech?: string
  amharicTranslation?: string
}

export interface ApiLesson {
  id: string
  skillArea: string
  subskill: string
  title: string
  grade: string
  difficulty: string
  explanation: string
  order: number
  tips?: string
}

export interface ApiAnalytics {
  gradeBreakdown: Record<string, { count: number; avgScore: number }>
  distribution: { high: number; medium: number; low: number }
  totalAssessed: number
}

export interface ApiDashboardStats {
  stats: {
    totalStudents: number
    totalTeachers: number
    totalParents: number
    completedAssessments: number
    avgReadinessScore: number
  }
  skillAverages: {
    phonemicAwareness: number
    phonicsDecoding: number
    fluency: number
    vocabulary: number
    comprehension: number
  }
}

export interface ApiProgressLog {
  id: string
  metric: string
  value: number
  date: string
  metadata?: string
}

export interface ApiChildDetail {
  id: string
  firstName: string
  lastName: string
  grade: string
  xp: number
  level: number
  streakDays: number
  lastActiveAt: string
  currentScore: number
  previousScore: number
  improvement: number
  strengths: string[]
  weaknesses: string[]
  skillScores: {
    phonemicAwareness: number
    phonicsDecoding: number
    fluency: number
    vocabulary: number
    comprehension: number
  }
  badges: { badgeType: string; earnedAt: string }[]
  weeklyGoal?: string
}

// ─── Recordings ───────────────────────────────────────────────────────────────
export const recordingApi = {
  mine:       ()                                         => get<ApiRecording[]>('/api/recordings/mine'),
  forTeacher: ()                                         => get<ApiRecording[]>('/api/recordings/teacher'),
  forAdmin:   ()                                         => get<ApiRecording[]>('/api/admin/recordings'), // Updated to use admin endpoint
  review:     (id: string, note: string, rating: number, flagged?: boolean) =>
    post<ApiRecording>(`/api/admin/recordings/${id}/review`, { note, rating, flagged }), // Updated to use admin endpoint
  upload: async (formData: FormData) => {
    const res = await fetch(apiUrl('/api/recordings/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      credentials: 'include',
      body: formData,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.message || 'Upload failed')
    return json.data as ApiRecording
  },
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard:   (signal?: AbortSignal) => get<ApiDashboardStats>('/api/admin/dashboard', signal),
  analytics:   (signal?: AbortSignal) => get<ApiAnalytics>('/api/admin/analytics', signal),
  students:    (signal?: AbortSignal) => get<ApiStudent[]>('/api/admin/students', signal),
  teachers:    (signal?: AbortSignal) => get<ApiTeacher[]>('/api/admin/teachers', signal),
  parents:     (signal?: AbortSignal) => get<ApiParent[]>('/api/admin/parents', signal),
  users:       (signal?: AbortSignal) => get<ApiUser[]>('/api/admin/users', signal),
  createUser:  (data: unknown)         => post<ApiUser>('/api/admin/users', data),
  deleteUser:  (id: string)            => del<void>(`/api/admin/users/${id}`),

  passages:    (signal?: AbortSignal) => get<ApiPassage[]>('/api/admin/content/passages', signal),
  questions:   (signal?: AbortSignal) => get<ApiQuestion[]>('/api/admin/content/questions', signal),
  vocabulary:  (signal?: AbortSignal) => get<ApiVocabulary[]>('/api/admin/content/vocabulary', signal),
  lessons:     (signal?: AbortSignal) => get<ApiLesson[]>('/api/admin/content/lessons', signal),
  getPDFResources: (signal?: AbortSignal) => get<any[]>('/api/admin/content/pdf-resources', signal),
  createContent: (type: string, data: unknown) => post<unknown>('/api/admin/content', { type, data }),
  updateContent: (type: string, id: string, data: unknown) => put<unknown>(`/api/admin/content/${type}/${id}`, data),
  deleteContent: (type: string, id: string)    => del<void>(`/api/admin/content/${type}/${id}`),

  assignments:      (signal?: AbortSignal) => get<unknown[]>('/api/admin/assignments', signal),
  createAssignment: (data: unknown)         => post<unknown>('/api/admin/assignments', data),
  updateAssignment: (id: string, data: unknown) => put<unknown>(`/api/admin/assignments/${id}`, data),
  deleteAssignment: (id: string)            => del<void>(`/api/admin/assignments/${id}`),
  classes:          (signal?: AbortSignal) => get<any[]>('/api/admin/classes', signal),
  createClass:      (data: unknown)         => post<unknown>('/api/admin/classes', data),
  assignClassStudents: (id: string, studentIds: string[]) => post<void>(`/api/admin/classes/${id}/students`, { studentIds }),
  deleteClass:      (id: string)            => del<void>(`/api/admin/classes/${id}`),
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export interface ApiPaymentSubmission {
  id: string
  userId: string
  package: string
  amount: number
  paymentMethod: string
  transactionRef: string
  paymentDate: string
  receiptUrl?: string | null
  notes?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNote?: string
  reviewedAt?: string
  createdAt: string
  user?: {
    id: string; email: string; role: string; status: string
    student?: { firstName: string; lastName: string; grade: string } | null
    parent?:  { firstName: string; lastName: string } | null
  }
}

export const paymentApi = {
  submit:  (data: unknown)           => post<ApiPaymentSubmission>('/api/payments', data),
  mine:    ()                        => get<ApiPaymentSubmission[]>('/api/payments/mine'),
  all:     ()                        => get<ApiPaymentSubmission[]>('/api/payments'),
  approve: (id: string)              => post<void>(`/api/payments/${id}/approve`, {}),
  reject:  (id: string, reason: string) => post<void>(`/api/payments/${id}/reject`, { reason }),
}

// ─── Student ──────────────────────────────────────────────────────────────────
export const studentApi = {
  dashboard:   (signal?: AbortSignal) => get<unknown>('/api/students/dashboard', signal),
  progress:    (signal?: AbortSignal) => get<ApiProgressLog[]>('/api/students/progress', signal),
  updateProfile: (data: { firstName: string; lastName: string }) => put<unknown>('/api/students/profile', data),
}

// ─── Parent ───────────────────────────────────────────────────────────────────
export const parentApi = {
  children:    (signal?: AbortSignal) => get<ApiChildDetail[]>('/api/parents/children', signal),
  childDetail: (id: string)            => get<ApiChildDetail>(`/api/parents/children/${id}`),
}

// ─── Teacher ──────────────────────────────────────────────────────────────────
export const teacherApi = {
  students:   (signal?: AbortSignal) => get<{ students: ApiStudent[]; summary: unknown }>('/api/teachers/students', signal),
  analytics:  (signal?: AbortSignal) => get<unknown>('/api/teachers/analytics', signal),
  studentDetail: (id: string)        => get<unknown>(`/api/teachers/students/${id}`),
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profileApi = {
  current: (signal?: AbortSignal) => get<unknown>('/api/profiles/current', signal),
  history: (signal?: AbortSignal) => get<unknown[]>('/api/profiles/history', signal),
}

// ─── Learning ─────────────────────────────────────────────────────────────────
export const learningApi = {
  plan:       (signal?: AbortSignal) => get<unknown>('/api/learning/plan', signal),
  lessons:    (signal?: AbortSignal) => get<ApiLesson[]>('/api/learning/lessons', signal),
  lesson:     (id: string)           => get<unknown>(`/api/learning/lessons/${id}`),
  complete:   (id: string)           => post<unknown>(`/api/learning/activities/${id}/complete`),
}

// ─── Assessment ───────────────────────────────────────────────────────────────
export const assessmentApi = {
  start:        ()                            => post<{ id: string }>('/api/assessments/start'),
  get:          (id: string)                  => get<unknown>(`/api/assessments/${id}`),
  questions:    (id: string, skillArea: string) => get<ApiQuestion[]>(`/api/assessments/${id}/questions?skillArea=${skillArea}`),
  submitResponse: (id: string, data: unknown) => post<unknown>(`/api/assessments/${id}/responses`, data),
  complete:     (id: string)                  => post<unknown>(`/api/assessments/${id}/complete`),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  send:    (message: string, context?: unknown) => post<{ message: string }>('/api/chat/messages', { message, context }),
  history: (signal?: AbortSignal)               => get<unknown[]>('/api/chat/history', signal),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export { fetchNotifications, fetchUnreadCount, markAllRead, markRead, deleteNotification } from './notificationService'

// ─── Utility Functions ────────────────────────────────────────────────────────
export function calculateFluencyScore(
  totalWords: number, durationSeconds: number, accuracy: number
): { wpm: number; cwpm: number; score: number; pauseCount: number } {
  const minutes = Math.max(durationSeconds / 60, 0.1)
  const wpm = Math.round(totalWords / minutes)
  const cwpm = Math.round(wpm * (accuracy / 100))

  // Scoring rubric: 50% accuracy + 50% rate (capped at grade-level target of 120 cwpm)
  const accuracyScore = accuracy * 0.5
  const rateScore = Math.min(cwpm, 120) / 120 * 50
  const score = Math.min(100, Math.round(accuracyScore + rateScore))

  // Estimate pauses from duration — longer than expected = more pauses
  const expectedDuration = (totalWords / 110) * 60  // 110 wpm target
  const pauseCount = Math.max(0, Math.round((durationSeconds - expectedDuration) / 3))

  return { wpm, cwpm, score, pauseCount }
}
