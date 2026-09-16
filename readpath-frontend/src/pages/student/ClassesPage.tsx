import { useEffect, useState } from 'react'
import StudentLayout from '../../components/layout/StudentLayout'

type ClassGroup = { id: string; name: string; grade: string; description?: string | null; onlineLink?: string | null; memberships: { student: { firstName: string; lastName: string } }[] }

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    fetch('/api/students/classes', { headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token') ?? ''}` } })
      .then(response => { if (!response.ok) throw new Error('Could not load your classes'); return response.json() })
      .then(data => setClasses(data.data ?? []))
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your classes'))
      .finally(() => setLoading(false))
  }, [])
  return <StudentLayout><div className="space-y-6 animate-in"><div><p className="text-sm font-semibold text-brand-600">Your learning groups</p><h1 className="page-title mt-1">Classes</h1><p className="text-sm text-gray-500 mt-1">See the classes and online sessions assigned to you by the admin.</p></div>{loading && <div className="card py-14 text-center text-sm text-gray-500">Loading your classes...</div>}{!loading && error && <div className="card py-14 text-center text-sm text-red-600">{error}</div>}{!loading && !error && classes.length === 0 && <div className="card py-14 text-center"><p className="text-4xl mb-3">🎓</p><h2 className="font-bold text-gray-900">No class assigned yet</h2><p className="text-sm text-gray-500 mt-1">Your admin will add you to a class when one is ready.</p></div>}{!loading && !error && classes.length > 0 && <div className="grid md:grid-cols-2 gap-5">{classes.map(group => <div key={group.id} className="card"><div className="flex items-start gap-3"><span className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center text-2xl">🎓</span><div><h2 className="text-lg font-bold text-gray-900">{group.name}</h2><p className="text-sm text-gray-500">Grade {group.grade.replace('GRADE_', '')} · {group.memberships.length} learners</p></div></div>{group.description && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{group.description}</p>}<div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3"><span className="text-xs text-gray-500">Your class space</span>{group.onlineLink ? <a href={group.onlineLink} target="_blank" rel="noreferrer" className="btn-primary text-sm py-2.5">Join online class ↗</a> : <span className="text-xs text-gray-400">Online link not added yet</span>}</div></div>)}</div>}</div></StudentLayout>
}
