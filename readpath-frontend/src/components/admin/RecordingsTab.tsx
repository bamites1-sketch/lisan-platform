import { useEffect, useMemo, useState } from 'react'
import { recordingApi, type ApiRecording } from '../../services/api'
import { useToast } from '../ui/Toast'
import { SearchBar, EmptyState } from './AdminShared'

function recordingUrl(url?: string) {
  if (!url) return ''
  return url.startsWith('http') ? url : url
}

export default function RecordingsTab() {
  const toast = useToast()
  const [rows, setRows] = useState<ApiRecording[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [ratings, setRatings] = useState<Record<string, number>>({})

  const load = () => {
    setLoading(true)
    recordingApi.forAdmin().then(setRows).catch(error => {
      toast.error('Could not load recordings', error instanceof Error ? error.message : 'Please try again.')
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => rows.filter(row => {
    const query = search.toLowerCase()
    const matchesSearch = !query || `${row.studentName ?? ''} ${row.passageTitle}`.toLowerCase().includes(query)
    const matchesFilter = filter === 'ALL' || (filter === 'REVIEWED' ? row.reviewed : !row.reviewed)
    return matchesSearch && matchesFilter
  }), [rows, search, filter])

  const review = async (row: ApiRecording) => {
    const note = notes[row.id]?.trim() ?? row.teacherNote ?? ''
    const rating = ratings[row.id] ?? row.teacherRating ?? 3
    setSaving(row.id)
    try {
      const updated = await recordingApi.review(row.id, note, rating)
      setRows(previous => previous.map(item => item.id === row.id ? { ...item, ...updated, reviewed: true, teacherNote: note, teacherRating: rating } : item))
      toast.success('Recording reviewed', `${row.studentName ?? 'Student'} was notified.`)
    } catch (error) {
      toast.error('Review failed', error instanceof Error ? error.message : 'Please try again.')
    } finally { setSaving(null) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Voice Recordings</h1>
        <p className="text-sm text-gray-500 mt-1">Listen to student reading submissions, download audio, and leave admin feedback.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        {[['ALL', 'All', rows.length], ['PENDING', 'Pending review', rows.filter(row => !row.reviewed).length], ['REVIEWED', 'Reviewed', rows.filter(row => row.reviewed).length]].map(([value, label, count]) => (
          <button key={value} onClick={() => setFilter(value as typeof filter)} className={`rounded-xl border p-3 text-left ${filter === value ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-white'}`}>
            <p className="text-xl font-bold text-gray-900">{count}</p><p className="text-xs text-gray-500">{label}</p>
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search student or passage..." />

      {loading ? <div className="card text-center text-sm text-gray-500 py-12">Loading recordings...</div> : filtered.length === 0 ? (
        <div className="card"><EmptyState emoji="🎙️" title="No recordings found" subtitle={rows.length ? 'Try another search or filter.' : 'Student voice submissions will appear here.'} /></div>
      ) : <div className="space-y-4">{filtered.map(row => {
        const url = recordingUrl(row.audioUrl)
        return <div key={row.id} className="card">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-bold text-gray-900">{row.studentName ?? 'Unknown student'}</h2><p className="text-sm text-gray-500">{row.studentGrade?.replace('GRADE_', 'Grade ')} · {row.passageTitle}</p></div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.reviewed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{row.reviewed ? 'Reviewed' : 'Pending'}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500"><span>Recorded {new Date(row.recordedAt).toLocaleString()}</span><span>{row.durationSeconds || 0}s</span><span>{row.totalWords || 0} words</span><span>Score: {row.score || 'Pending'}</span></div>
              {url ? <audio controls preload="metadata" src={url} className="w-full mt-4" /> : <p className="mt-4 text-sm text-amber-600">Audio file is not available.</p>}
            </div>
            <div className="w-full lg:w-72 space-y-3">
              <div className="flex gap-2"><select value={ratings[row.id] ?? row.teacherRating ?? 3} onChange={event => setRatings(previous => ({ ...previous, [row.id]: Number(event.target.value) }))} className="input-field flex-1"><option value="1">1 / 5</option><option value="2">2 / 5</option><option value="3">3 / 5</option><option value="4">4 / 5</option><option value="5">5 / 5</option></select>{url && <a href={url} download className="btn-secondary text-sm inline-flex items-center">Download</a>}</div>
              <textarea value={notes[row.id] ?? row.teacherNote ?? ''} onChange={event => setNotes(previous => ({ ...previous, [row.id]: event.target.value }))} className="input-field" rows={3} placeholder="Admin feedback..." />
              <button onClick={() => review(row)} disabled={saving === row.id} className="btn-primary w-full text-sm">{saving === row.id ? 'Saving...' : row.reviewed ? 'Update Review' : 'Save Review'}</button>
            </div>
          </div>
        </div>
      })}</div>}
    </div>
  )
}