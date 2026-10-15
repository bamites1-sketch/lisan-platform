import { useEffect, useMemo, useRef, useState } from 'react'
import { recordingApi, type ApiRecording } from '../../services/api'
import { apiUrl } from '../../lib/apiBase'
import { useToast } from '../ui/Toast'
import { SearchBar, EmptyState } from './AdminShared'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function gradeLabel(raw: string | undefined): string {
  return (raw ?? '').replace('GRADE_', 'Grade ')
}

// Fetch signed / direct audio URL from backend
async function fetchAudioUrl(recordingId: string): Promise<string> {
  const token = localStorage.getItem('lisan_token') ?? ''
  const res = await fetch(apiUrl(`/api/admin/recordings/${recordingId}/audio`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return (json.data?.url ?? '') as string
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}) {
  const [hov, setHov] = useState(0)
  const sz = size === 'sm' ? 'text-base' : 'text-xl'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHov(s)}
          onMouseLeave={() => !readonly && setHov(0)}
          className={`${sz} leading-none transition-transform ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
        >
          <span className={s <= (hov || value) ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

// ─── Custom Audio Player ──────────────────────────────────────────────────────

function AudioPlayer({
  src,
  passageTitle,
  studentName,
}: {
  src: string
  passageTitle: string
  studentName: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const pct = duration > 0 ? (current / duration) * 100 : 0

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
    } else {
      a.play().catch(() => setErrored(true))
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    if (audioRef.current) {
      audioRef.current.volume = v
      audioRef.current.muted = v === 0
    }
    setMuted(v === 0)
  }

  const toggleMute = () => {
    const a = audioRef.current
    if (!a) return
    a.muted = !muted
    setMuted(!muted)
  }

  const skipBy = (secs: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + secs))
  }

  // Detect audio format for download extension
  const ext = src.startsWith('data:audio/mp4') || src.startsWith('data:audio/m4a')
    ? 'm4a'
    : src.startsWith('data:audio/mpeg') ? 'mp3' : 'webm'

  const downloadName = `${studentName.replace(/\s+/g, '-')}_${passageTitle.replace(/\s+/g, '-')}.${ext}`

  if (errored) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
        <span>⚠️</span>
        <span>Audio could not be loaded. The file may be corrupted or unsupported.</span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#1a3a2a] via-[#1e4230] to-[#2d6a4f] rounded-2xl p-4 shadow-xl select-none">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration ?? 0)
          setLoading(false)
        }}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onError={() => { setErrored(true); setLoading(false) }}
      />

      {/* Passage label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#d4a017] text-sm">🎙️</span>
          <p className="text-[11px] font-bold text-white/80 truncate uppercase tracking-wider">
            {passageTitle}
          </p>
        </div>
        {/* Download */}
        <a
          href={src}
          download={downloadName}
          title="Download recording"
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          aria-label="Download"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 bg-white/15 rounded-full cursor-pointer mb-3 group relative overflow-hidden"
        onClick={seek}
      >
        <div
          className="h-full bg-[#d4a017] rounded-full transition-none"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-white/40 group-hover:w-0.5 transition-all"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Time */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-white/60">{fmtTime(current)}</span>
        <span className="text-[10px] font-mono text-white/40">
          {loading ? 'Loading…' : fmtTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Skip back */}
        <button
          type="button"
          onClick={() => skipBy(-10)}
          disabled={loading}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all disabled:opacity-40"
          title="Rewind 10s"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.5 12l8.5 6V6l-8.5 6zm-1 0L2 6v12l8.5-6z" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="w-11 h-11 rounded-full bg-[#d4a017] hover:bg-[#e6b820] active:scale-95 flex items-center justify-center transition-all disabled:opacity-50 shadow-lg"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : playing ? (
            <svg className="w-4 h-4 text-[#1a3a2a]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#1a3a2a] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>

        {/* Skip forward */}
        <button
          type="button"
          onClick={() => skipBy(10)}
          disabled={loading}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all disabled:opacity-40"
          title="Forward 10s"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
          </svg>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Volume */}
        <button
          type="button"
          onClick={toggleMute}
          className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          {muted || volume === 0 ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={handleVolume}
          className="w-16 accent-[#d4a017]"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}

// ─── Recording Card ───────────────────────────────────────────────────────────

function RecordingCard({
  row,
  audioUrl,
  audioLoading,
  onReviewed,
}: {
  row: ApiRecording
  audioUrl: string
  audioLoading: boolean
  onReviewed: (updated: Partial<ApiRecording> & { id: string }) => void
}) {
  const toast = useToast()
  const [note, setNote] = useState(row.teacherNote ?? '')
  const [rating, setRating] = useState(row.teacherRating ?? 3)
  const [saving, setSaving] = useState(false)
  const [panelOpen, setPanelOpen] = useState(!row.reviewed)

  const handleReview = async () => {
    setSaving(true)
    try {
      const updated = await recordingApi.review(row.id, note.trim(), rating)
      onReviewed({ ...updated, id: row.id, reviewed: true, teacherNote: note.trim(), teacherRating: rating })
      toast.success('Review saved', `Feedback delivered to ${row.studentName ?? 'student'}.`)
      setPanelOpen(false)
    } catch (err) {
      toast.error('Save failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
      !row.reviewed ? 'border-[#2d6a4f]/30' : 'border-gray-100'
    }`}>

      {/* ── Card header ── */}
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Avatar */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black flex-shrink-0 ${
          row.reviewed ? 'bg-gray-100 text-gray-500' : 'bg-[#e8f4f0] text-[#1a3a2a]'
        }`}>
          {(row.studentName ?? 'S').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">{row.studentName ?? 'Unknown student'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
              {gradeLabel(row.studentGrade)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            <span className="font-medium text-gray-700">{row.passageTitle}</span>
            <span className="mx-1.5">·</span>
            <span>{fmtDate(row.recordedAt)}</span>
          </p>
        </div>

        {/* Status badge + expand toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
            row.reviewed
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {row.reviewed ? '✓ Reviewed' : '● Pending'}
          </span>
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
            aria-label={panelOpen ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Expandable body ── */}
      {panelOpen && (
        <div className="border-t border-gray-50 px-5 py-5 space-y-5 bg-gray-50/40">

          {/* Metadata strip */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: '🕐', label: 'Recorded', val: fmtDateTime(row.recordedAt) },
              { icon: '⏱️', label: 'Duration', val: row.durationSeconds > 0 ? fmtTime(row.durationSeconds) : 'N/A' },
              { icon: '📊', label: 'Score', val: row.score > 0 ? String(row.score) : 'Pending' },
              ...(row.reviewed && row.reviewedAt
                ? [{ icon: '✅', label: 'Reviewed', val: fmtDateTime(row.reviewedAt) }]
                : []),
            ].map(({ icon, label, val }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-100 px-3 py-1.5 shadow-xs">
                <span className="text-sm">{icon}</span>
                <span className="text-[10px] text-gray-400 font-medium">{label}:</span>
                <span className="text-[10px] text-gray-700 font-bold">{val}</span>
              </div>
            ))}
          </div>

          {/* Audio player */}
          {audioLoading ? (
            <div className="bg-gradient-to-br from-[#1a3a2a] to-[#2d6a4f] rounded-2xl p-5 flex items-center justify-center gap-3 text-white/60 text-sm">
              <span className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              Loading audio…
            </div>
          ) : audioUrl ? (
            <AudioPlayer
              src={audioUrl}
              passageTitle={row.passageTitle}
              studentName={row.studentName ?? 'student'}
            />
          ) : (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
              <span>⚠️</span>
              <span>No audio file is available for this recording.</span>
            </div>
          )}

          {/* Existing feedback (if reviewed) */}
          {row.reviewed && row.teacherNote && !panelOpen && (
            <div className="p-3 bg-white border border-gray-100 rounded-xl text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Previous feedback: </span>
              {row.teacherNote}
            </div>
          )}

          {/* Review form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              {row.reviewed ? '✏️ Update Review' : '📝 Leave Feedback'}
            </p>

            {/* Rating */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Admin Feedback
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Write your feedback for the student…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] resize-none placeholder-gray-300 transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleReview}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#1a3a2a] hover:bg-[#2d6a4f] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : row.reviewed ? (
                '✓ Update Feedback'
              ) : (
                '✓ Save & Notify Student'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function RecordingsTab() {
  const toast = useToast()
  const [rows, setRows] = useState<ApiRecording[]>([])
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL')
  const [loading, setLoading] = useState(true)

  // Load recordings then lazily load their audio URLs
  const load = async () => {
    setLoading(true)
    try {
      const recordings = await recordingApi.forAdmin()
      setRows(recordings)

      // Kick off parallel audio URL fetches for recordings that have audio
      const withAudio = recordings.filter(
        (r) => r.audioUrl && !r.audioUrl.includes('__no_storage__'),
      )

      // Mark all as loading
      const loadingMap: Record<string, boolean> = {}
      withAudio.forEach((r) => { loadingMap[r.id] = true })
      setAudioLoading(loadingMap)

      // Fetch all in parallel
      await Promise.all(
        withAudio.map(async (r) => {
          try {
            const url = await fetchAudioUrl(r.id)
            setAudioUrls((prev) => ({ ...prev, [r.id]: url }))
          } catch {
            // leave entry missing — player will show error state
          } finally {
            setAudioLoading((prev) => ({ ...prev, [r.id]: false }))
          }
        }),
      )
    } catch (err) {
      toast.error('Could not load recordings', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReviewed = (updated: Partial<ApiRecording> & { id: string }) => {
    setRows((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
    )
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const matchSearch =
        !q ||
        (r.studentName ?? '').toLowerCase().includes(q) ||
        r.passageTitle.toLowerCase().includes(q)
      const matchFilter =
        filter === 'ALL' ||
        (filter === 'REVIEWED' ? r.reviewed : !r.reviewed)
      return matchSearch && matchFilter
    })
  }, [rows, search, filter])

  const pending  = rows.filter((r) => !r.reviewed).length
  const reviewed = rows.filter((r) =>  r.reviewed).length

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25 mb-2">
            <span>🎙️</span> VOICE RECORDINGS
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a3a2a] tracking-tight">
            Student Voice Submissions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Listen to reading recordings, rate fluency, and send personalised feedback to students.
          </p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', count: rows.length, color: 'bg-white border-gray-100', num: 'text-[#1a3a2a]', id: 'ALL' },
          { label: 'Pending Review', count: pending, color: 'bg-amber-50 border-amber-200', num: 'text-amber-700', id: 'PENDING' },
          { label: 'Reviewed', count: reviewed, color: 'bg-emerald-50 border-emerald-200', num: 'text-emerald-700', id: 'REVIEWED' },
        ].map(({ label, count, color, num, id }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id as typeof filter)}
            className={`${color} border rounded-2xl p-4 text-left transition-all hover:shadow-sm active:scale-[0.98] ${
              filter === id ? 'ring-2 ring-[#2d6a4f]/40' : ''
            }`}
          >
            <p className={`text-2xl font-extrabold ${num}`}>{count}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search student name or passage…"
      />

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="w-10 h-10 border-4 border-[#e8f4f0] border-t-[#2d6a4f] rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading voice recordings…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <EmptyState
            emoji="🎙️"
            title={rows.length === 0 ? 'No recordings yet' : 'No results found'}
            subtitle={
              rows.length === 0
                ? 'Student voice submissions will appear here once they complete assessments.'
                : 'Try adjusting your search or filter.'
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending section */}
          {filter !== 'REVIEWED' && filtered.some((r) => !r.reviewed) && (
            <div>
              {filter === 'ALL' && (
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />
                  Awaiting Review ({filtered.filter((r) => !r.reviewed).length})
                </p>
              )}
              <div className="space-y-4">
                {filtered
                  .filter((r) => !r.reviewed)
                  .map((row) => (
                    <RecordingCard
                      key={row.id}
                      row={row}
                      audioUrl={audioUrls[row.id] ?? ''}
                      audioLoading={audioLoading[row.id] ?? false}
                      onReviewed={handleReviewed}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Reviewed section */}
          {filter !== 'PENDING' && filtered.some((r) => r.reviewed) && (
            <div>
              {filter === 'ALL' && (
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 mt-6 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />
                  Reviewed ({filtered.filter((r) => r.reviewed).length})
                </p>
              )}
              <div className="space-y-4">
                {filtered
                  .filter((r) => r.reviewed)
                  .map((row) => (
                    <RecordingCard
                      key={row.id}
                      row={row}
                      audioUrl={audioUrls[row.id] ?? ''}
                      audioLoading={audioLoading[row.id] ?? false}
                      onReviewed={handleReviewed}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
