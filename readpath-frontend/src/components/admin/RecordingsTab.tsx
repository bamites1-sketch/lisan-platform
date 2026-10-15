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
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return iso
  }
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function gradeLabel(raw: string | undefined): string {
  return (raw ?? '').replace('GRADE_', 'Grade ')
}

function normalizeAudioUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return apiUrl(url.startsWith('/') ? url : `/${url}`)
  }
  if (url.startsWith('recordings/')) {
    return apiUrl(`/uploads/${url}`)
  }
  return apiUrl(url.startsWith('/') ? url : `/${url}`)
}

// Fetch signed / direct audio URL from backend
async function fetchAudioUrl(recordingId: string): Promise<string> {
  const token = localStorage.getItem('lisan_token') ?? ''
  const res = await fetch(apiUrl(`/api/admin/recordings/${recordingId}/audio`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return normalizeAudioUrl(json.data?.url ?? '')
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

// ─── Professional Audio Player ────────────────────────────────────────────────

export function AudioPlayer({
  src,
  passageTitle,
  studentName,
  initialDuration = 0,
}: {
  src: string
  passageTitle: string
  studentName: string
  initialDuration?: number
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(initialDuration)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState<number>(1)

  const normalizedSrc = useMemo(() => normalizeAudioUrl(src), [src])
  const pct = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0

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
    const clickX = e.clientX - rect.left
    const newPct = Math.max(0, Math.min(1, clickX / rect.width))
    a.currentTime = newPct * duration
    setCurrent(a.currentTime)
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
    a.currentTime = Math.max(0, Math.min(duration || 9999, a.currentTime + secs))
    setCurrent(a.currentTime)
  }

  const changeSpeed = (s: number) => {
    setSpeed(s)
    if (audioRef.current) {
      audioRef.current.playbackRate = s
    }
  }

  // Detect extension
  const ext = normalizedSrc.startsWith('data:audio/mp4') || normalizedSrc.startsWith('data:audio/m4a')
    ? 'm4a'
    : normalizedSrc.startsWith('data:audio/mpeg') ? 'mp3' : 'webm'

  const downloadName = `${(studentName || 'student').replace(/\s+/g, '-')}_${(passageTitle || 'recording').replace(/\s+/g, '-')}.${ext}`

  if (errored) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-semibold">Audio playback stream issue</p>
            <p className="text-amber-700 text-[11px] mt-0.5">The recording is present. You can try downloading it directly.</p>
          </div>
        </div>
        {normalizedSrc && (
          <a
            href={normalizedSrc}
            download={downloadName}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs"
          >
            Direct Audio Download
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#122b1f] via-[#1a3a2a] to-[#255740] rounded-2xl p-4 sm:p-5 shadow-xl select-none text-white border border-[#2d6a4f]/50">
      <audio
        ref={audioRef}
        src={normalizedSrc}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
            setDuration(audioRef.current.duration)
          }
          setLoading(false)
        }}
        onDurationChange={() => {
          if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
            setDuration(audioRef.current.duration)
          }
        }}
        onCanPlay={() => setLoading(false)}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onError={() => { setErrored(true); setLoading(false) }}
      />

      {/* Header bar: Title + Animated Soundwave + Download */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base">🎙️</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white tracking-wide truncate">
              {passageTitle || 'Student Recording'}
            </p>
            <p className="text-[10px] text-white/60 truncate">
              Reader: <span className="font-semibold text-white/90">{studentName || 'Student'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Animated soundwave bars when playing */}
          {playing && (
            <div className="flex items-end gap-0.5 h-4 px-2 py-0.5 bg-white/10 rounded-full">
              <span className="w-1 bg-[#d4a017] rounded-full animate-pulse h-2" style={{ animationDuration: '0.4s' }} />
              <span className="w-1 bg-white rounded-full animate-pulse h-3.5" style={{ animationDuration: '0.6s' }} />
              <span className="w-1 bg-[#d4a017] rounded-full animate-pulse h-2.5" style={{ animationDuration: '0.5s' }} />
              <span className="w-1 bg-white rounded-full animate-pulse h-4" style={{ animationDuration: '0.35s' }} />
              <span className="w-1 bg-[#d4a017] rounded-full animate-pulse h-2" style={{ animationDuration: '0.7s' }} />
            </div>
          )}

          {/* Download button */}
          <a
            href={normalizedSrc}
            download={downloadName}
            title="Download original audio recording"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white/80 hover:text-white"
            aria-label="Download"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div
        className="w-full h-2.5 bg-white/15 hover:bg-white/25 rounded-full cursor-pointer mb-2 group relative transition-colors"
        onClick={seek}
      >
        <div
          className="h-full bg-gradient-to-r from-[#d4a017] to-amber-300 rounded-full transition-all relative"
          style={{ width: `${pct}%` }}
        >
          {/* Scrubber thumb */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-[#d4a017] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Time display */}
      <div className="flex items-center justify-between text-[11px] font-mono mb-3 text-white/70">
        <span>{fmtTime(current)}</span>
        <span>{duration > 0 ? fmtTime(duration) : loading ? 'Buffering…' : '0:00'}</span>
      </div>

      {/* Main playback controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
        
        {/* Left: Skip back, Play/Pause, Skip forward */}
        <div className="flex items-center gap-2">
          {/* Skip -5s */}
          <button
            type="button"
            onClick={() => skipBy(-5)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 text-xs font-semibold"
            title="Rewind 5s"
          >
            -5s
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={toggle}
            className="w-10 h-10 rounded-full bg-[#d4a017] hover:bg-[#e6b820] active:scale-95 flex items-center justify-center transition-all text-[#1a3a2a] shadow-lg shadow-black/20"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {loading && !playing ? (
              <span className="w-4 h-4 border-2 border-[#1a3a2a]/30 border-t-[#1a3a2a] rounded-full animate-spin" />
            ) : playing ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>

          {/* Skip +10s */}
          <button
            type="button"
            onClick={() => skipBy(10)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 text-xs font-semibold"
            title="Forward 10s"
          >
            +10s
          </button>
        </div>

        {/* Center: Playback Speed selector */}
        <div className="flex items-center gap-1 bg-black/25 rounded-lg p-0.5 border border-white/10">
          {[0.8, 1, 1.25, 1.5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeSpeed(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                speed === s
                  ? 'bg-[#d4a017] text-[#1a3a2a] shadow-xs'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Right: Volume & Mute */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            title={muted ? 'Unmute' : 'Mute'}
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
            className="w-14 sm:w-16 accent-[#d4a017] cursor-pointer"
            aria-label="Volume"
          />
        </div>

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
  row: ApiRecording & { type?: 'assessment' | 'fluency' }
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

  const isAssessment = row.type === 'assessment'

  return (
    <div className={`rounded-2xl border bg-white shadow-xs overflow-hidden transition-all hover:shadow-md ${
      !row.reviewed ? 'border-[#2d6a4f]/40 ring-1 ring-[#2d6a4f]/15' : 'border-gray-200/80'
    }`}>

      {/* ── Card header ── */}
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">

        {/* Student Avatar */}
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-sm sm:text-base font-black flex-shrink-0 shadow-xs ${
          row.reviewed ? 'bg-gray-100 text-gray-500' : 'bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25'
        }`}>
          {(row.studentName ?? 'S').charAt(0).toUpperCase()}
        </div>

        {/* Student & Passage Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-gray-900 text-sm sm:text-base">{row.studentName ?? 'Student'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
              {gradeLabel(row.studentGrade)}
            </span>
            {isAssessment ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 inline-flex items-center gap-1">
                <span>📋</span> Diagnostic Assessment
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 inline-flex items-center gap-1">
                <span>🎤</span> Reading Fluency Practice
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 truncate flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-700">{row.passageTitle}</span>
            <span>·</span>
            <span>{fmtDate(row.recordedAt)}</span>
            {row.durationSeconds > 0 && (
              <>
                <span>·</span>
                <span className="font-mono text-gray-600">⏱️ {fmtTime(row.durationSeconds)}</span>
              </>
            )}
            {row.wpm > 0 && (
              <>
                <span>·</span>
                <span className="text-[#2d6a4f] font-semibold">{row.wpm} WPM</span>
              </>
            )}
          </p>
        </div>

        {/* Status badge & expand button */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
            row.reviewed
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {row.reviewed ? '✓ Reviewed' : '● Needs Review'}
          </span>

          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all border border-gray-200/80"
            aria-label={panelOpen ? 'Collapse' : 'Expand & Listen'}
            title={panelOpen ? 'Collapse' : 'Listen & Review'}
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
        <div className="border-t border-gray-100 px-4 sm:px-6 py-5 space-y-5 bg-[#fafcfb]">

          {/* Reading metrics strip */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { icon: '🕐', label: 'Recorded', val: fmtDateTime(row.recordedAt) },
              { icon: '⏱️', label: 'Duration', val: row.durationSeconds > 0 ? fmtTime(row.durationSeconds) : 'N/A' },
              ...(row.wpm > 0 ? [{ icon: '⚡', label: 'Speed', val: `${row.wpm} WPM` }] : []),
              ...(row.accuracy > 0 ? [{ icon: '🎯', label: 'Accuracy', val: `${Math.round(row.accuracy)}%` }] : []),
              { icon: '📊', label: 'Overall Score', val: row.score > 0 ? `${row.score}/100` : 'Pending Score' },
              ...(row.reviewed && row.reviewedAt
                ? [{ icon: '✅', label: 'Reviewed', val: fmtDateTime(row.reviewedAt) }]
                : []),
            ].map(({ icon, label, val }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200/80 px-3 py-1.5 shadow-2xs">
                <span className="text-sm">{icon}</span>
                <span className="text-[10px] text-gray-500 font-medium">{label}:</span>
                <span className="text-[11px] text-gray-800 font-bold">{val}</span>
              </div>
            ))}
          </div>

          {/* Audio player */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
              <span>🎧</span> Student Audio Recording
            </h4>

            {audioLoading ? (
              <div className="bg-gradient-to-br from-[#122b1f] to-[#255740] rounded-2xl p-6 flex items-center justify-center gap-3 text-white/80 text-sm">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Preparing recording audio for playback…
              </div>
            ) : audioUrl ? (
              <AudioPlayer
                src={audioUrl}
                passageTitle={row.passageTitle}
                studentName={row.studentName ?? 'Student'}
                initialDuration={row.durationSeconds}
              />
            ) : (
              <div className="flex items-center gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-800">
                <span className="text-lg">⚠️</span>
                <span>No audio stream could be located for this record.</span>
              </div>
            )}
          </div>

          {/* Existing review note display if reviewed */}
          {row.reviewed && row.teacherNote && (
            <div className="p-3.5 bg-white border border-emerald-100 rounded-xl text-xs text-gray-700 shadow-2xs">
              <span className="font-bold text-[#1a3a2a]">Current Feedback: </span>
              {row.teacherNote}
              {row.teacherRating && (
                <div className="mt-1 flex items-center gap-1 text-amber-500 font-semibold">
                  <span>Rating:</span>
                  <span>{'★'.repeat(row.teacherRating)}</span>
                </div>
              )}
            </div>
          )}

          {/* Admin Review / Feedback form */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>{row.reviewed ? '✏️' : '📝'}</span>
                <span>{row.reviewed ? 'Update Admin Review' : 'Provide Feedback & Fluency Score'}</span>
              </p>
              <span className="text-[11px] text-gray-400">Delivered directly to student profile</span>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-600">Reading Rating:</span>
              <StarRating value={rating} onChange={setRating} />
              <span className="text-xs font-medium text-gray-400">
                {['', 'Needs support', 'Developing', 'Competent', 'Strong fluency', 'Mastery reading'][rating] ?? ''}
              </span>
            </div>

            {/* Note text area */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Feedback &amp; Recommendations for Learner
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write helpful feedback on expression, pacing, phonics, and strengths…"
                className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-gray-50/50 hover:bg-white transition-all resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleReview}
                className="btn-primary text-xs py-2 px-5 font-bold shadow-sm"
              >
                {saving ? 'Saving review…' : row.reviewed ? 'Save Updated Review' : 'Deliver Feedback to Student'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Main Voice Recordings Tab ────────────────────────────────────────────────

export default function RecordingsTab() {
  const toast = useToast()
  const [rows, setRows] = useState<(ApiRecording & { type?: 'assessment' | 'fluency' })[]>([])
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'assessment' | 'fluency'>('ALL')
  const [loading, setLoading] = useState(true)

  // Load recordings and immediately resolve playable audio
  const load = async () => {
    setLoading(true)
    try {
      const recordings = (await recordingApi.forAdmin()) as (ApiRecording & { type?: 'assessment' | 'fluency' })[]
      setRows(recordings)

      // 1. Immediately store any audioUrl that is already a playable data URI, blob, or full HTTP link
      const directUrls: Record<string, string> = {}
      recordings.forEach((r) => {
        if (r.audioUrl && (r.audioUrl.startsWith('data:') || r.audioUrl.startsWith('http') || r.audioUrl.startsWith('blob:'))) {
          directUrls[r.id] = r.audioUrl
        }
      })
      setAudioUrls(directUrls)

      // 2. For items with storage keys needing signed URLs, fetch them
      const needsFetch = recordings.filter(
        (r) => r.audioUrl && !directUrls[r.id] && !r.audioUrl.includes('__no_storage__')
      )

      if (needsFetch.length > 0) {
        const loadingMap: Record<string, boolean> = {}
        needsFetch.forEach((r) => { loadingMap[r.id] = true })
        setAudioLoading(loadingMap)

        await Promise.all(
          needsFetch.map(async (r) => {
            try {
              const url = await fetchAudioUrl(r.id)
              if (url) {
                setAudioUrls((prev) => ({ ...prev, [r.id]: url }))
              }
            } catch {
              if (r.audioUrl) {
                setAudioUrls((prev) => ({ ...prev, [r.id]: normalizeAudioUrl(r.audioUrl) }))
              }
            } finally {
              setAudioLoading((prev) => ({ ...prev, [r.id]: false }))
            }
          })
        )
      }
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
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const matchSearch =
        !q ||
        (r.studentName ?? '').toLowerCase().includes(q) ||
        r.passageTitle.toLowerCase().includes(q) ||
        (r.studentGrade ?? '').toLowerCase().includes(q)

      const matchFilter =
        filter === 'ALL' ||
        (filter === 'REVIEWED' ? r.reviewed : !r.reviewed)

      const matchType =
        typeFilter === 'ALL' || r.type === typeFilter

      return matchSearch && matchFilter && matchType
    })
  }, [rows, search, filter, typeFilter])

  const pending  = rows.filter((r) => !r.reviewed).length
  const reviewed = rows.filter((r) =>  r.reviewed).length
  const assessmentCount = rows.filter((r) => r.type === 'assessment').length
  const fluencyCount    = rows.filter((r) => r.type === 'fluency').length

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25 mb-2">
            <span>🎙️</span> VOICE RECORDINGS &amp; FLUENCY REVIEW
          </div>
          <h1 className="text-2xl font-black text-[#1a3a2a] tracking-tight">
            Student Voice Submissions
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Listen to student reading assessments and fluency practice recordings with professional audio controls.
          </p>
        </div>

        {/* Reload button */}
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh Recordings</span>
        </button>
      </div>

      {/* ── Summary & Filter Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Recordings', count: rows.length, color: 'bg-white border-gray-200', num: 'text-[#1a3a2a]', id: 'ALL' },
          { label: 'Awaiting Review', count: pending, color: 'bg-amber-50/80 border-amber-200', num: 'text-amber-800', id: 'PENDING' },
          { label: 'Reviewed', count: reviewed, color: 'bg-emerald-50/80 border-emerald-200', num: 'text-emerald-800', id: 'REVIEWED' },
          { label: 'Diagnostic Recordings', count: assessmentCount, color: 'bg-blue-50/80 border-blue-200', num: 'text-blue-800', id: 'ASSESSMENT' },
        ].map(({ label, count, color, num, id }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === 'ASSESSMENT') {
                setTypeFilter('assessment')
                setFilter('ALL')
              } else {
                setFilter(id as typeof filter)
              }
            }}
            className={`${color} border rounded-2xl p-4 text-left transition-all hover:shadow-xs active:scale-[0.98] ${
              (filter === id && typeFilter === 'ALL') || (id === 'ASSESSMENT' && typeFilter === 'assessment')
                ? 'ring-2 ring-[#2d6a4f]'
                : ''
            }`}
          >
            <p className={`text-2xl font-black ${num}`}>{count}</p>
            <p className="text-xs font-bold text-gray-600 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Filters bar: Search & Category tabs ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by student name, passage title, or grade…"
          />
        </div>

        {/* Recording Category Filter pills */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl self-start md:self-auto">
          {[
            { id: 'ALL', label: `All (${rows.length})` },
            { id: 'assessment', label: `Assessments (${assessmentCount})` },
            { id: 'fluency', label: `Fluency Practice (${fluencyCount})` },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setTypeFilter(cat.id as typeof typeFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === cat.id
                  ? 'bg-white text-[#1a3a2a] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recordings Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-gray-100">
          <span className="w-10 h-10 border-4 border-[#e8f4f0] border-t-[#2d6a4f] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading voice submissions &amp; audio players…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-10 text-center shadow-xs">
          <EmptyState
            emoji="🎙️"
            title={rows.length === 0 ? 'No voice recordings received yet' : 'No matching recordings found'}
            subtitle={
              rows.length === 0
                ? 'Student recordings will appear here automatically when students take reading assessments or practice fluency.'
                : 'Try clearing your search query or switching your status filter.'
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending / Awaiting Review */}
          {filter !== 'REVIEWED' && filtered.some((r) => !r.reviewed) && (
            <div>
              {filter === 'ALL' && (
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block animate-pulse" />
                    Awaiting Review ({filtered.filter((r) => !r.reviewed).length})
                  </p>
                  <span className="text-[11px] text-gray-400">Click card to listen &amp; grade</span>
                </div>
              )}
              <div className="space-y-3.5">
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

          {/* Already Reviewed */}
          {filter !== 'PENDING' && filtered.some((r) => r.reviewed) && (
            <div>
              {filter === 'ALL' && (
                <div className="flex items-center justify-between mb-3 mt-8">
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                    Reviewed &amp; Scored ({filtered.filter((r) => r.reviewed).length})
                  </p>
                </div>
              )}
              <div className="space-y-3.5">
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
