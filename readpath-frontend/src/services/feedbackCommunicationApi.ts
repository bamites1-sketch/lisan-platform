import { apiUrl } from '../lib/apiBase';
import type {
  ParentFeedback,
  DirectChatMessage,
  DirectChatConversation,
  AssessmentFeedbackItem,
  AssessmentFeedbackStats
} from '../types';

function token() {
  return localStorage.getItem('lisan_token') ?? '';
}

function authHeaders(extra?: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
    ...extra
  };
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(apiUrl(endpoint), {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = json.message || json.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return (json.data !== undefined ? json.data : json) as T;
}

// ─── 1. Parent Feedback API ──────────────────────────────────────────────────

export const parentFeedbackApi = {
  // Parent submits feedback
  submit: (data: {
    studentId?: string;
    category: string;
    rating?: number;
    title?: string;
    progressNotes?: string;
    areasOfConcern?: string;
    suggestions?: string;
  }) => request<ParentFeedback>('POST', '/api/parents/feedback', data),

  // Parent gets their own submitted feedbacks
  getMyFeedbacks: () => request<ParentFeedback[]>('GET', '/api/parents/feedback'),

  // Admin gets all parent feedbacks
  getAdminFeedbacks: (params?: { status?: string; category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    return request<ParentFeedback[]>('GET', `/api/admin/parent-feedbacks?${q.toString()}`);
  },

  // Admin responds to parent feedback
  respond: (id: string, data: { adminResponse: string; status?: string }) =>
    request<ParentFeedback>('POST', `/api/admin/parent-feedbacks/${id}/respond`, data),

  // Admin deletes parent feedback
  delete: (id: string) => request<{ success: boolean }>('DELETE', `/api/admin/parent-feedbacks/${id}`)
};

// ─── 2. Direct Chat (Student <-> Admin) API ─────────────────────────────────

export const directChatApi = {
  // Get unread badge count
  getUnreadCount: () =>
    request<{ unreadCount: number }>('GET', '/api/direct-chat/unread-count'),

  // Send message
  sendMessage: (data: { message: string; studentId?: string; attachmentUrl?: string }) =>
    request<DirectChatMessage>('POST', '/api/direct-chat/messages', data),

  // Student fetches conversation with Admin
  getStudentMessages: (after?: string) => {
    const url = after ? `/api/direct-chat/messages?after=${encodeURIComponent(after)}` : '/api/direct-chat/messages';
    return request<DirectChatMessage[]>('GET', url);
  },

  // Student marks messages as read
  markStudentRead: () => request<{ updatedCount: number }>('PUT', '/api/direct-chat/read'),

  // Admin lists conversations with all students
  getAdminConversations: () =>
    request<DirectChatConversation[]>('GET', '/api/direct-chat/conversations'),

  // Admin fetches conversation with a specific student
  getAdminMessages: (studentId: string, after?: string) => {
    const url = after
      ? `/api/direct-chat/messages/${studentId}?after=${encodeURIComponent(after)}`
      : `/api/direct-chat/messages/${studentId}`;
    return request<DirectChatMessage[]>('GET', url);
  },

  // Admin marks student messages as read
  markAdminRead: (studentId: string) =>
    request<{ updatedCount: number }>('PUT', `/api/direct-chat/read/${studentId}`)
};

// ─── 3. Assessment Feedback & Recommendations API ────────────────────────────

export const assessmentFeedbackApi = {
  // Student views their feedbacks & recommendations
  getStudentFeedbacks: () =>
    request<{ feedbacks: AssessmentFeedbackItem[]; stats: AssessmentFeedbackStats }>(
      'GET',
      '/api/assessment-feedback/student'
    ),

  // Admin views all assessment feedbacks
  getAdminFeedbacks: (params?: { studentId?: string; grade?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.append('studentId', params.studentId);
    if (params?.grade) q.append('grade', params.grade);
    if (params?.search) q.append('search', params.search);
    return request<AssessmentFeedbackItem[]>('GET', `/api/assessment-feedback/admin?${q.toString()}`);
  },

  // Admin creates or updates assessment feedback
  saveFeedback: (data: {
    id?: string;
    studentId: string;
    assessmentId?: string;
    assessmentTitle: string;
    submissionId?: string;
    overallScore?: number;
    skillScores?: Record<string, number>;
    problemAreas?: string[];
    weaknessesSummary?: string;
    feedback: string;
    recommendations?: string[];
    recommendedLevel?: string;
    actionPlan?: string;
  }) => request<AssessmentFeedbackItem>('POST', '/api/assessment-feedback/admin', data),

  // Admin deletes feedback
  deleteFeedback: (id: string) =>
    request<{ success: boolean }>('DELETE', `/api/assessment-feedback/admin/${id}`)
};
