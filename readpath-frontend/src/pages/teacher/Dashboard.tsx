import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import NotificationBell from '../../components/ui/NotificationBell'
import LangSwitcher from '../../components/ui/LangSwitcher'
import { recordingApi, type ApiRecording } from '../../services/api'
import { timeAgo } from '../../lib/utils'

type FluencyRecording = ApiRecording & {
  studentName: string
  studentGrade: string
  passageTitle: string
  flagged?: boolean
  studentNote?: string
  assignmentId?: string
}

type TeacherStudent = {
  id: string
  firstName: string
  lastName: string
  grade: string
  readinessScore: number
  status: string
  lastActive: string
}

type Tab = 'overview' | 'students' | 'recordings' | 'assignments'

// ─── Rating stars ─────────────────────────────────────────────────────────────
function Stars({ value, onChange }: { value?: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={`text-lg transition-colors ${
            n <= (value ?? 0) ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'
          } ${onChange ? 'cursor-pointer' : 'cursor-default'}`}>★</button>
      ))}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color = 'bg-brand-500' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

// ─── Recording card — full professional review UI ─────────────────────────────
function RecordingCard({
  rec,
  onReview,
}: {
  rec: FluencyRecording
  onReview: (id: string, note: string, rating: 1|2|3|4|5, flagged: boolean) => void
}) {
  const audioRef              = useRef<HTMLAudioElement | null>(null)
  const progressRef           = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)  // 0-100
  const [elapsed, setElapsed] = useState(0)
  const progressTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const [expanded, setExpanded]     = useState(!rec.reviewed)
  const [showForm, setShowForm]     = useState(false)
  const [note, setNote]             = useState(rec.teacherNote ?? '')
  const [rating, setRating]         = useState<number>(rec.teacherRating ?? 0)
  const [flagged, setFlagged]       = useState(rec.flagged ?? false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  // Cleanup
  useEffect(() => () => {
    progressTimerRef.current && clearInterval(progressTimerRef.current)
    audioRef.current?.pause()
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const togglePlay = () => {
    if (!rec.audioUrl) {
      // Simulate playback
      if (playing) {
        progressTimerRef.current && clearInterval(progressTimerRef.current)
        setPlaying(false)
        return
      }
      setPlaying(true)
      const totalMs = rec.durationSeconds * 1000
      const startTime = Date.now() - elapsed * 1000
      progressTimerRef.current = setInterval(() => {
        const el = (Date.now() - startTime) / 1000
        const pct = Math.min((el / rec.durationSeconds) * 100, 100)
        setElapsed(el)
        setProgress(pct)
        if (pct >= 100) {
          clearInterval(progressTimerRef.current!)
          setPlaying(false)
          setProgress(100)
        }
      }, 100)
      setTimeout(() => {
        progressTimerRef.current && clearInterval(progressTimerRef.current)
        setPlaying(false)
        setProgress(0)
        setElapsed(0)
      }, totalMs)
      return
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(rec.audioUrl)
      audioRef.current.ontimeupdate = () => {
        if (!audioRef.current) return
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
        setProgress(pct)
        setElapsed(audioRef.current.currentTime)
      }
      audioRef.current.onended = () => { setPlaying(false); setProgress(0); setElapsed(0) }
    }
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else         { audioRef.current.play();  setPlaying(true)  }
  }

  const handleSaveReview = async () => {
    if (!note.trim() && rating === 0) return
    setSaving(true)
    onReview(rec.id, note, (rating || 3) as 1|2|3|4|5, flagged)
    // Mark assignment reviewed — handled server-side via POST /api/recordings/:id/review

    setSaving(false)
    setSaved(true)
    setShowForm(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const isPending = !rec.reviewed && rec.score === 0
  const scoreColor  = isPending ? 'text-gray-400' : rec.score >= 75 ? 'text-success-600' : rec.score >= 55 ? 'text-warning-600' : 'text-danger-600'
  const scoreBg     = isPending ? 'bg-gray-100'   : rec.score >= 75 ? 'bg-success-100'   : rec.score >= 55 ? 'bg-warning-100'   : 'bg-danger-100'
  const progressColor = isPending ? 'bg-gray-300' : rec.score >= 75 ? 'bg-success-500' : rec.score >= 55 ? 'bg-warning-500'   : 'bg-danger-500'

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-200 ${
      rec.flagged      ? 'border-danger-300 shadow-sm' :
      !rec.reviewed    ? 'border-brand-200 shadow-md'  :
      'border-gray-100'
    }`}>

      {/* ── Card header ── */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 ${scoreBg} ${scoreColor}`}>
          {rec.studentName[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-sm">{rec.studentName}</p>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
              Grade {rec.studentGrade.replace('GRADE_', '')}
            </span>
            {rec.flagged && (
              <span className="text-xs bg-danger-100 text-danger-700 font-bold px-2 py-0.5 rounded-full">⚑ Flagged</span>
            )}
            {!rec.reviewed && !rec.flagged && (
              <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full animate-pulse">
                ● New
              </span>
            )}
            {rec.reviewed && (
              <span className="text-xs bg-success-100 text-success-700 font-semibold px-2 py-0.5 rounded-full">✓ Reviewed</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            📖 {rec.passageTitle}
            <span className="mx-1.5 text-gray-300">·</span>
            {timeAgo(rec.recordedAt)}
          </p>
          {rec.studentNote && (
            <p className="text-xs text-brand-600 mt-0.5 italic line-clamp-1">
              💬 "{rec.studentNote}"
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-base font-black ${scoreColor}`}>
            {isPending ? <span className="text-xs font-semibold">Pending</span> : <>{rec.score}<span className="text-xs font-normal text-gray-400">/100</span></>}
          </span>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-50 pt-4 animate-in">

          {/* Student note if present */}
          {rec.studentNote && (
            <div className="flex gap-2.5 p-3 bg-brand-50 border border-brand-100 rounded-xl">
              <span className="text-base flex-shrink-0">💬</span>
              <div>
                <p className="text-[11px] font-semibold text-brand-700 mb-0.5">Student's note</p>
                <p className="text-xs text-brand-900 leading-relaxed">{rec.studentNote}</p>
              </div>
            </div>
          )}

          {/* ── Audio player ── */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all active:scale-95 ${
                  playing
                    ? 'bg-red-500 text-white shadow-inner'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? '⏸' : '▶'}
              </button>

              {/* Waveform */}
              <div className="flex-1 flex items-end gap-[2px] h-7 overflow-hidden" ref={progressRef}>
                {Array.from({ length: 32 }).map((_, i) => {
                  const barPct  = (i / 32) * 100
                  const isPast  = barPct <= progress
                  const height  = 5 + Math.abs(Math.sin(i * 0.72)) * 18
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-colors duration-100 ${
                        isPast
                          ? playing ? 'bg-brand-500' : 'bg-brand-300'
                          : 'bg-gray-200'
                      }`}
                      style={{
                        height: `${height}px`,
                        animation: (playing && isPast)
                          ? `pulseSoft ${0.35 + (i % 6) * 0.1}s ease-in-out infinite alternate`
                          : 'none',
                      }}
                    />
                  )
                })}
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs font-mono text-gray-500">
                  {fmt(Math.round(elapsed))} / {fmt(rec.durationSeconds)}
                </span>
              </div>
            </div>

            {/* Seek progress bar */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-1 bg-brand-500 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {!rec.audioUrl && (
              <p className="text-[10px] text-gray-400 text-center">No audio file — demo simulation active</p>
            )}
          </div>

          {/* ── Metrics ── */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Performance Metrics</p>
            <div className="grid grid-cols-2 xs:grid-cols-2 gap-2.5">
              {[
                { label: 'Words per Minute', value: rec.wpm,        max: 150, good: rec.wpm >= 90,       unit: ' wpm',  pendingVal: isPending },
                { label: 'Accuracy',         value: rec.accuracy,   max: 100, good: rec.accuracy >= 85,  unit: '%',     pendingVal: isPending },
                { label: 'Correct WPM',      value: rec.cwpm,       max: 150, good: rec.cwpm >= 80,      unit: ' cwpm', pendingVal: isPending },
                { label: 'Pause Count',      value: rec.pauseCount, max: 20,  good: rec.pauseCount <= 4, unit: '',      pendingVal: false },
              ].map(m => (
                <div key={m.label} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-500">{m.label}</span>
                    <span className={`text-sm font-bold ${m.pendingVal ? 'text-gray-400' : m.good ? 'text-success-600' : 'text-danger-600'}`}>
                      {m.pendingVal ? '—' : `${m.value}${m.unit}`}
                    </span>
                  </div>
                  <ProgressBar
                    value={m.pendingVal ? 0 : (m.value / m.max) * 100}
                    color={m.pendingVal ? 'bg-gray-200' : m.good ? 'bg-success-500' : 'bg-danger-500'}
                  />
                </div>
              ))}
            </div>

            {/* Overall score bar */}
            <div className="mt-2.5 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-500">Fluency Score</span>
                <span className={`text-sm font-bold ${scoreColor}`}>
                  {isPending ? 'Pending review' : `${rec.score}/100`}
                </span>
              </div>
              <ProgressBar value={isPending ? 0 : rec.score} color={progressColor} />
            </div>
          </div>

          {/* ── Existing review ── */}
          {rec.reviewed && rec.teacherNote && !showForm && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-amber-800">Your feedback</p>
                <Stars value={rec.teacherRating} />
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">{rec.teacherNote}</p>
              {saved && (
                <p className="text-xs text-success-600 mt-1.5 font-semibold">✓ Feedback saved</p>
              )}
            </div>
          )}

          {/* ── Review form ── */}
          {showForm ? (
            <div className="p-4 bg-brand-50 border-2 border-brand-200 rounded-xl space-y-3 animate-in">
              <p className="text-xs font-bold text-brand-800 uppercase tracking-wide">Leave Feedback</p>

              {/* Star rating */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Rating</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`text-2xl transition-transform active:scale-110 ${
                        n <= rating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 self-center text-xs text-gray-500">
                      {['', 'Needs major work', 'Needs improvement', 'Developing well', 'Good work', 'Excellent!'][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback text */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Written feedback</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none bg-white"
                  rows={3}
                  placeholder="e.g. Good pacing overall. Work on expression at punctuation marks. Try to reduce the hesitations on longer words…"
                />
              </div>

              {/* Quick phrases */}
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">Quick phrases</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Good pacing!',
                    'Work on expression',
                    'Pause at punctuation',
                    'Excellent accuracy',
                    'Slow down slightly',
                    'Strong fluency',
                  ].map(phrase => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => setNote(n => n ? `${n} ${phrase}` : phrase)}
                      className="text-[11px] bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-600 hover:text-brand-700 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flag toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setFlagged((f: boolean) => !f)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    flagged ? 'bg-danger-500 border-danger-500' : 'border-gray-300 group-hover:border-danger-300'
                  }`}
                >
                  {flagged && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-xs text-gray-600">
                  ⚑ Flag for follow-up <span className="text-gray-400">(needs extra attention)</span>
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReview}
                  disabled={saving || (!note.trim() && rating === 0)}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                    : '✓ Save & Notify Student'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  rec.reviewed
                    ? 'border border-dashed border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {rec.reviewed ? '✏️ Edit Feedback' : '✍️ Leave Feedback'}
              </button>
              {!rec.flagged && !rec.reviewed && (
                <button
                  onClick={() => { setFlagged(true); setShowForm(true) }}
                  className="px-3.5 py-2.5 rounded-xl border border-dashed border-danger-200 text-danger-500 hover:bg-danger-50 text-sm transition-colors"
                  title="Flag for follow-up"
                >
                  ⚑
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Assignments View — loads real admin assignments ──────────────────────────
function AssignmentsView({
  recordings,
  onReviewRecording,
}: {
  recordings: FluencyRecording[]
  onReviewRecording: () => void
}) {
  const [assignments, setAssignments] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/assignments', {
      headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`Server error ${r.status}`)))
      .then(j => {
        if (j.success) setAssignments(j.data ?? [])
        else throw new Error(j.message)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )
  if (error) return (
    <div className="card text-center py-10">
      <p className="text-3xl mb-2">⚠️</p>
      <p className="font-semibold text-gray-700 mb-1">Could not load assignments</p>
      <p className="text-sm text-gray-400">{error}</p>
    </div>
  )
  if (assignments.length === 0) return (
    <div className="text-center py-16 card">
      <p className="text-4xl mb-3">📋</p>
      <p className="font-semibold text-gray-700">No assignments yet</p>
      <p className="text-xs text-gray-400 mt-1">The admin will assign passages and lessons to your students.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {assignments.map(a => {
        const relatedRecordings = recordings.filter(r =>
          r.passageTitle === (a.contentId as string) || r.passageTitle?.includes(a.contentId as string)
        )
        return (
          <div key={a.id as string} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{a.contentType === 'passage' ? '📖' : '🎓'}</span>
                  <p className="font-bold text-gray-900 text-sm">{a.contentId as string}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>👥 Grade {(a.grade as string) === 'ALL' ? 'All' : (a.grade as string).replace('GRADE_', '')}</span>
                  <span>· {timeAgo(a.assignedAt as string)}</span>
                  {(a.note as string | undefined) && <span>· "{a.note as string}"</span>}
                  {(a.dueDate as string | undefined) && <span className="text-orange-600">· Due {new Date(a.dueDate as string).toLocaleDateString()}</span>}
                </div>
              </div>
              {relatedRecordings.length > 0 && (
                <button onClick={onReviewRecording}
                  className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 flex-shrink-0">
                  🎤 {relatedRecordings.length} recording{relatedRecordings.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Teacher Dashboard ───────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const { t }            = useLang()
  const navigate         = useNavigate()
  const [tab, setTab]    = useState<Tab>('overview')
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState('ALL')
  const [recordings, setRecordings] = useState<FluencyRecording[]>([])
  const [_recordingsLoading, setRecordingsLoading] = useState(true)
  const [filterReviewed, setFiltRev] = useState('ALL')
  const [students, setStudents] = useState<TeacherStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  const profile = user?.profile as { firstName?: string; lastName?: string } | undefined
  const teacherName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : 'Teacher'

  // Load real data from API
  useEffect(() => {
    const token = localStorage.getItem('lisan_token')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    // Load students
    setStudentsLoading(true)
    fetch('/api/teachers/students', { headers })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`Server error ${r.status}`)))
      .then(j => {
        if (j?.success) setStudents(j.data?.students ?? j.data ?? [])
        else throw new Error(j.message || 'Failed to load students')
      })
      .catch(err => setStudentsError(err.message))
      .finally(() => setStudentsLoading(false))

    // Load recordings
    recordingApi.forTeacher()
      .then(data => setRecordings(data as FluencyRecording[]))
      .catch(() => {})
      .finally(() => setRecordingsLoading(false))
  }, [])

  const avgScore = students.length > 0
    ? Math.round(students.reduce((a, s) => a + s.readinessScore, 0) / students.length)
    : 0
  const ready      = students.filter(s => s.status === 'READY').length
  const developing = students.filter(s => s.status === 'DEVELOPING').length
  const needs      = students.filter(s => s.status === 'NEEDS_SUPPORT').length
  const unreviewedCount = recordings.filter(r => !r.reviewed).length

  const filteredStudents = students.filter(s => {
    const ms = search === '' || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
    const mf = filterStatus === 'ALL' || s.status === filterStatus
    return ms && mf
  })

  const filteredRecordings = recordings.filter(r => {
    const ms = search === '' || r.studentName.toLowerCase().includes(search.toLowerCase())
    const mf = filterReviewed === 'ALL'
      || (filterReviewed === 'NEW'      ? !r.reviewed      :
          filterReviewed === 'REVIEWED' ? r.reviewed        :
          filterReviewed === 'FLAGGED'  ? (r.flagged ?? false) === true : true)
    return ms && mf
  })

  const handleReview = async (id: string, note: string, rating: 1|2|3|4|5, flagged: boolean) => {
    try {
      await recordingApi.review(id, note, rating, flagged)
      // Update local state optimistically
      setRecordings(prev => prev.map(r =>
        r.id === id ? { ...r, reviewed: true, teacherNote: note, teacherRating: rating, flagged } : r
      ))
    } catch (err) {
      console.error('Failed to submit review:', err)
      // Still update UI optimistically so it doesn't feel broken
      setRecordings(prev => prev.map(r =>
        r.id === id ? { ...r, reviewed: true, teacherNote: note, teacherRating: rating, flagged } : r
      ))
    }
  }

  const TABS = [
    { id: 'overview'     as Tab, label: 'Overview',     icon: '📊' },
    { id: 'students'     as Tab, label: 'Students',     icon: '👥' },
    { id: 'recordings'   as Tab, label: 'Recordings',   icon: '🎤',
      badge: unreviewedCount > 0 ? unreviewedCount : undefined },
    { id: 'assignments'  as Tab, label: 'Assignments',  icon: '📖' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">ል</span>
          </div>
          <span className="font-bold text-gray-900">{t.appName}</span>
          <span className="text-gray-300 mx-1 hidden sm:block">·</span>
          <span className="text-sm text-gray-500 hidden sm:block">Teacher</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <LangSwitcher compact />
          <span className="text-sm text-gray-600 hidden sm:block px-2">{teacherName}</span>
          <button onClick={() => { logout(); navigate('/') }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            {t.signOut}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 sticky top-[57px] z-10 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-1 min-w-max sm:min-w-0">
          {TABS.map(tabItem => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
              className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                tab === tabItem.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabItem.icon} {tabItem.label}
              {tabItem.badge !== undefined && (
                <span className="ml-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {tabItem.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-5 animate-in">
            <h1 className="page-title">🧑‍🏫 Class Overview</h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Students',      value: students.length,  color: 'text-brand-600',   bg: 'bg-brand-50'   },
                { label: '🟢 Ready',      value: ready,            color: 'text-success-600', bg: 'bg-success-50' },
                { label: '🟡 Developing', value: developing,       color: 'text-warning-600', bg: 'bg-warning-50' },
                { label: '🔴 Needs Help', value: needs,            color: 'text-danger-600',  bg: 'bg-danger-50'  },
              ].map(s => (
                <div key={s.label} className={`card border-0 ${s.bg} text-center`}>
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Class average */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-gray-900">Class Average Readiness</h2>
                  <p className="text-xs text-gray-500">{students.length} students assessed</p>
                </div>
                <span className={`text-2xl font-bold ${avgScore >= 75 ? 'text-success-600' : avgScore >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
                  {avgScore}/100
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-3 rounded-full ${avgScore >= 75 ? 'bg-success-500' : avgScore >= 60 ? 'bg-warning-500' : 'bg-danger-500'}`}
                  style={{ width: `${avgScore}%` }} />
              </div>
            </div>

            {/* Unreviewed recordings prompt */}
            {unreviewedCount > 0 && (
              <button onClick={() => setTab('recordings')}
                className="w-full card border-2 border-brand-300 bg-brand-50 hover:shadow-card-hover transition-all cursor-pointer text-left">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🎤</div>
                  <div className="flex-1">
                    <p className="font-bold text-brand-900">
                      {unreviewedCount} new fluency recording{unreviewedCount > 1 ? 's' : ''} waiting for review
                    </p>
                    <p className="text-sm text-brand-700 mt-0.5">
                      Listen to your students read and leave feedback. It takes just a minute!
                    </p>
                  </div>
                  <span className="text-brand-600 font-bold">→</span>
                </div>
              </button>
            )}

            {/* Students needing support */}
            {needs > 0 && (
              <div className="card border-l-4 border-danger-400">
                <h2 className="section-title text-danger-700 mb-3">⚠️ Students Needing Support ({needs})</h2>
                <div className="space-y-2">
                  {students.filter(s => s.status === 'NEEDS_SUPPORT').map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-danger-50 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-danger-100 rounded-lg flex items-center justify-center text-sm font-bold text-danger-700">{s.firstName[0]}</div>
                        <div>
                          <p className="text-sm font-semibold">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-500">Grade {s.grade.replace('GRADE_', '')}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-danger-600">{s.readinessScore}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STUDENTS ── */}
        {tab === 'students' && (
          <div className="space-y-5 animate-in">
            <h1 className="page-title">👥 My Students</h1>

            {studentsLoading && (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            )}

            {!studentsLoading && studentsError && (
              <div className="card text-center py-10">
                <p className="text-4xl mb-3">⚠️</p>
                <p className="font-semibold text-gray-800 mb-1">Could not load students</p>
                <p className="text-sm text-gray-500">{studentsError}</p>
              </div>
            )}

            {!studentsLoading && !studentsError && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" placeholder="Search students…" />
                  </div>
                  <select value={filterStatus} onChange={e => setFilter(e.target.value)} className="input-field w-auto text-sm">
                    <option value="ALL">All Status</option>
                    <option value="READY">🟢 Ready</option>
                    <option value="DEVELOPING">🟡 Developing</option>
                    <option value="NEEDS_SUPPORT">🔴 Needs Support</option>
                  </select>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Grade</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Recordings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredStudents.map(s => {
                        const recs = recordings.filter(r => r.studentName.startsWith(s.firstName))
                        return (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  s.status === 'READY' ? 'bg-success-100 text-success-700' :
                                  s.status === 'DEVELOPING' ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'
                                }`}>{s.firstName[0]}</div>
                                <div>
                                  <p className="font-semibold text-gray-800">{s.firstName} {s.lastName}</p>
                                  <p className="text-xs text-gray-400">{timeAgo(s.lastActive)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell text-xs">
                              Grade {s.grade.replace('GRADE_', '')}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-1.5 rounded-full ${s.readinessScore >= 75 ? 'bg-success-500' : s.readinessScore >= 60 ? 'bg-warning-500' : 'bg-danger-500'}`}
                                    style={{ width: `${s.readinessScore}%` }} />
                                </div>
                                <span className={`text-sm font-bold ${s.readinessScore >= 75 ? 'text-success-600' : s.readinessScore >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
                                  {s.readinessScore}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                s.status === 'READY' ? 'bg-success-100 text-success-700' :
                                s.status === 'DEVELOPING' ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'
                              }`}>
                                {s.status === 'READY' ? '🟢 Ready' : s.status === 'DEVELOPING' ? '🟡 Developing' : '🔴 Needs Support'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 hidden lg:table-cell">
                              {recs.length > 0 ? (
                                <button onClick={() => { setTab('recordings'); setSearch(s.firstName) }}
                                  className="text-xs text-brand-600 font-semibold hover:underline">
                                  🎤 {recs.length} recording{recs.length > 1 ? 's' : ''}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">No recordings</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      {students.length === 0 ? 'No students assigned to you yet.' : 'No students match your search.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RECORDINGS ── */}
        {tab === 'recordings' && (
          <div className="space-y-5 animate-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-title">🎤 Student Readings</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Listen to fluency recordings and leave feedback
                  {unreviewedCount > 0 && <span className="ml-2 text-xs bg-danger-100 text-danger-700 font-bold px-2 py-0.5 rounded-full">{unreviewedCount} unreviewed</span>}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" placeholder="Search by student name…" />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {[
                  { v: 'ALL',      label: 'All'          },
                  { v: 'NEW',      label: '🆕 New'       },
                  { v: 'REVIEWED', label: '✓ Reviewed'   },
                  { v: 'FLAGGED',  label: '⚑ Flagged'    },
                ].map(f => (
                  <button key={f.v} onClick={() => setFiltRev(f.v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterReviewed === f.v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recording cards */}
            {filteredRecordings.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🎤</p>
                <p className="text-sm font-semibold text-gray-700">No recordings yet</p>
                <p className="text-xs text-gray-400 mt-1">Recordings appear here when students complete their fluency assessment</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredRecordings.map(rec => (
                  <RecordingCard key={rec.id} rec={rec} onReview={handleReview} />
                ))}
              </div>
            )}

            {/* Summary */}
            {recordings.length > 0 && (
              <div className="card bg-gray-50 border-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Class Fluency Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{Math.round(recordings.reduce((a,r) => a+r.wpm, 0)/recordings.length)}</p>
                    <p className="text-xs text-gray-500">Avg WPM</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{Math.round(recordings.reduce((a,r) => a+r.accuracy, 0)/recordings.length)}%</p>
                    <p className="text-xs text-gray-500">Avg Accuracy</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{Math.round(recordings.reduce((a,r) => a+r.score, 0)/recordings.length)}</p>
                    <p className="text-xs text-gray-500">Avg Score</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ASSIGNMENTS ── */}
        {tab === 'assignments' && (
          <div className="space-y-5 animate-in">
            <div>
              <h1 className="page-title">📖 Assigned Content</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Passages and lessons assigned to your students by the admin
              </p>
            </div>
            <AssignmentsView recordings={recordings} onReviewRecording={() => setTab('recordings')} />
          </div>
        )}
      </main>
    </div>
  )
}
