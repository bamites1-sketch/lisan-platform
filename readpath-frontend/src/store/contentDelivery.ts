// Content Delivery — real API calls only.
// Students see content assigned to their grade via GET /api/admin/assignments.
// This module is kept for interface compatibility but all data comes from the backend.

export interface ContentAssignment {
  id: string
  contentType: 'passage' | 'lesson'
  contentId: string
  grade: string
  assignedAt: string
  assignedBy: string
  dueDate?: string
  note?: string
  status: 'active' | 'archived'
}

// Fetch assignments for a student's grade from the real backend.
// Returns only active assignments matching the student's grade or 'ALL'.
export async function fetchAssignmentsForStudent(
  grade: string,
  token: string
): Promise<ContentAssignment[]> {
  const res = await fetch('/api/admin/assignments', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  const json = await res.json()
  const all: ContentAssignment[] = json.data ?? []
  return all.filter(
    a => a.status !== 'archived' && (a.grade === grade || a.grade === 'ALL')
  )
}
