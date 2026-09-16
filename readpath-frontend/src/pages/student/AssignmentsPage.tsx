import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentLayout from '../../components/layout/StudentLayout'

type Assignment = {
  id: string
  contentType: 'passage' | 'lesson'
  contentId: string
  grade: string
  assignedAt: string
  dueDate?: string | null
  note?: string | null
  status: string
  title?: string
}

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('lisan_token') ?? ''}` }
        const [assignmentResponse, contentResponse] = await Promise.all([
          fetch('/api/students/assignments', { headers }),
          fetch('/api/students/content', { headers }),
        ])
        if (!assignmentResponse.ok || !contentResponse.ok) throw new Error('Could not load assignments')
        const assignments = (await assignmentResponse.json()).data ?? []
        const content = (await contentResponse.json()).data ?? {}
        const titles = new Map<string, string>([
          ...(content.passages ?? []).map((item: { id: string; title: string }) => [item.id, item.title] as [string, string]),
          ...(content.lessons ?? []).map((item: { id: string; title: string }) => [item.id, item.title] as [string, string]),
        ])
        setItems(assignments.map((item: Assignment) => ({ ...item, title: titles.get(item.contentId) ?? 'Assigned learning activity' })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load assignments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeItems = useMemo(() => items.filter(item => item.status !== 'archived'), [items])

  return (
    <StudentLayout>
      <div className="space-y-6 animate-in">
        <div>
          <p className="text-sm font-semibold text-brand-600">Your work</p>
          <h1 className="page-title mt-1">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Work assigned to you by the LISAN admin.</p>
        </div>
        {loading && <div className="card py-14 text-center text-sm text-gray-500">Loading your assignments...</div>}
        {!loading && error && <div className="card py-14 text-center"><p className="text-sm text-red-600">{error}</p><button onClick={() => window.location.reload()} className="btn-primary mt-4 text-sm">Try again</button></div>}
        {!loading && !error && activeItems.length === 0 && <div className="card py-14 text-center"><p className="text-4xl mb-3">✓</p><h2 className="font-bold text-gray-900">You are all caught up</h2><p className="text-sm text-gray-500 mt-1">New assignments will appear here.</p></div>}
        {!loading && !error && activeItems.length > 0 && <div className="grid md:grid-cols-2 gap-4">{activeItems.map(item => <div key={item.id} className="card flex flex-col"><div className="flex items-start gap-3"><span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center text-xl">{item.contentType === 'passage' ? '📖' : '📘'}</span><div className="flex-1 min-w-0"><h2 className="font-bold text-gray-900 truncate">{item.title}</h2><p className="text-xs text-gray-500 mt-1">{item.contentType === 'passage' ? 'Reading passage' : 'Lesson'} · Assigned {new Date(item.assignedAt).toLocaleDateString()}</p></div></div>{item.note && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mt-4">{item.note}</p>}{item.dueDate && <p className="text-xs text-orange-600 mt-3">Due {new Date(item.dueDate).toLocaleDateString()}</p>}<div className="mt-5 pt-4 border-t border-gray-100">{item.contentType === 'passage' ? <Link to="/student/reading-practice" className="btn-primary w-full text-center text-sm">Open passage</Link> : <Link to="/student/plan" className="btn-secondary w-full text-center text-sm">Open lesson plan</Link>}</div></div>)}</div>}
      </div>
    </StudentLayout>
  )
}
