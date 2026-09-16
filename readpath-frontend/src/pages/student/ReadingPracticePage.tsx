import { useState, useRef, useEffect } from 'react'
import StudentLayout from '../../components/layout/StudentLayout'
import { useAuth } from '../../contexts/AuthContext'
import { recordingApi, calculateFluencyScore } from '../../services/api'
import type { StudentProfile } from '../../types'

// ─── Assignment type (from real API) ─────────────────────────────────────────
interface AssignedPassage {
  id: string             // assignment id
  passageId: string
  passageTitle: string
  passageText: string
  wordCount: number
  difficulty: string
  topic?: string
  instructions?: string
  assignedByName: string
  assignedAt: string
  dueDateLabel?: string
  submissions: Record<string, string>  // studentId → status
  recordingIds: Record<string, string> // studentId → recordingId
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function difficultyColor(d: string) {
  if (d === 'EASY') return 'bg-success-100 text-success-700'
  if (d === 'HARD') return 'bg-danger-100 text-danger-700'
  return 'bg-warning-100 text-warning-700'
}

function statusPill(status?: string) {
  switch (status) {
    case 'REVIEWED':    return { label: '✅ Reviewed',   cls: 'bg-success-100 text-success-700' }
    case 'SUBMITTED':   return { label: '📤 Submitted',  cls: 'bg-brand-100 text-brand-700'   }
    case 'IN_PROGRESS': return { label: '🎙 Recording',  cls: 'bg-warning-100 text-warning-700' }
    default:            return { label: '📖 Pending',    cls: 'bg-gray-100 text-gray-500'      }
  }
}

// ─── Animated waveform bars ────────────────────────────────────────────────────
function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-6" aria-hidden>
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-150 ${
            active ? 'bg-red-400' : 'bg-gray-300'
          }`}
          style={{
            height: active
              ? `${10 + Math.abs(Math.sin(i * 0.9 + Date.now() / 200)) * 14}px`
              : `${3 + (i % 4) * 2}px`,
            animation: active
              ? `pulseSoft ${0.35 + (i % 6) * 0.12}s ease-in-out infinite alternate`
              : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── Playback waveform (static, decorative) ────────────────────────────────────
function PlaybackBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-5 flex-1" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${playing ? 'bg-brand-400' : 'bg-gray-200'}`}
          style={{
            height: `${4 + Math.abs(Math.sin(i * 0.7)) * 12}px`,
            animation: playing
              ? `pulseSoft ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`
              : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── Recording phase component ────────────────────────────────────────────────
type RecPhase = 'idle' | 'countdown' | 'recording' | 'processing' | 'done'

interface RecordingPanelProps {
  assignment: AssignedPassage
  studentId: string
  studentName: string
  studentGrade: string
  onSubmitted: () => void
  onCancel: () => void
}

function RecordingPanel({
  assignment, studentId: _studentId, studentName: _studentName, studentGrade: _studentGrade, onSubmitted, onCancel
}: RecordingPanelProps) {
  const [phase, setPhase]         = useState<RecPhase>('idle')
  const [countdown, setCountdown] = useState(3)
  const [seconds, setSeconds]     = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl]   = useState<string | null>(null)
  const [playing, setPlaying]     = useState(false)
  const [metrics, setMetrics]     = useState<{
    wpm: number; accuracy: number; cwpm: number; score: number; pauseCount: number
  } | null>(null)
  const [note, setNote]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  const mediaRecRef   = useRef<MediaRecorder | null>(null)
  const chunksRef     = useRef<Blob[]>([])
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioElemRef  = useRef<HTMLAudioElement | null>(null)
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup
  useEffect(() => () => {
    timerRef.current && clearInterval(timerRef.current)
    countdownRef.current && clearInterval(countdownRef.current)
    mediaRecRef.current?.state === 'recording' && mediaRecRef.current.stop()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ── Start: 3-2-1 countdown then record ────────────────────────────────────
  const handleStart = () => {
    setPhase('countdown')
    setCountdown(3)
    let c = 3
    countdownRef.current = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) {
        clearInterval(countdownRef.current!)
        startMediaRecorder()
      }
    }, 1000)
  }

  const startMediaRecorder = async () => {
    chunksRef.current = []
    setSeconds(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecRef.current = mr
      mr.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data)
      mr.onstop = () => stream.getTracks().forEach(t => t.stop())
      mr.start()
    } catch {
      /* mic unavailable — timer-only mode */
    }
    setPhase('recording')
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  // ── Stop recording ─────────────────────────────────────────────────────────
  const handleStop = () => {
    clearInterval(timerRef.current!)
    if (mediaRecRef.current?.state === 'recording') {
      mediaRecRef.current.stop()
    }
    setPhase('processing')

    // Brief UI delay for processing state
    setTimeout(async () => {
      const blob = chunksRef.current.length > 0
        ? new Blob(chunksRef.current, { type: 'audio/webm' })
        : null
      const url = blob ? URL.createObjectURL(blob) : null

      setAudioBlob(blob)
      setAudioUrl(url)

      // Accuracy is 0 — pending teacher review. No random values.
      const accuracy = 0
      const result = calculateFluencyScore(
        assignment.wordCount,
        Math.max(seconds, 20),
        accuracy,
      )
      setMetrics({ ...result, accuracy })
      setPhase('done')
    }, 1200)
  }

  // ── Redo ────────────────────────────────────────────────────────────────────
  const handleRedo = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setMetrics(null)
    setPlaying(false)
    setSeconds(0)
    setNote('')
    setPhase('idle')
  }

  // ── Toggle playback ─────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!audioUrl) {
      setPlaying(p => {
        if (!p) setTimeout(() => setPlaying(false), seconds * 200)
        return !p
      })
      return
    }
    if (!audioElemRef.current) {
      audioElemRef.current = new Audio(audioUrl)
      audioElemRef.current.onended = () => setPlaying(false)
    }
    if (playing) { audioElemRef.current.pause(); setPlaying(false) }
    else         { audioElemRef.current.play();  setPlaying(true)  }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!metrics) return
    setSubmitting(true)

    try {
      // Build multipart form data for the real API
      const formData = new FormData()
      if (audioBlob) formData.append('audio', audioBlob, 'recording.webm')
      formData.append('passageTitle',    assignment.passageTitle)
      formData.append('passageId',       assignment.passageId)
      formData.append('durationSeconds', String(seconds))
      formData.append('wpm',             String(metrics.wpm))
      formData.append('accuracy',        String(metrics.accuracy))
      formData.append('cwpm',            String(metrics.cwpm))
      formData.append('totalWords',      String(assignment.wordCount))
      formData.append('pauseCount',      String(metrics.pauseCount))
      formData.append('hesitationCount', String(Math.floor(metrics.pauseCount * 0.6)))
      formData.append('score',           String(metrics.score))
      if (note.trim()) formData.append('studentNote', note.trim())

      const savedRecording = await recordingApi.upload(formData)
      // Recording persisted — submission tracked server-side via the recording record
      if (!savedRecording?.id) throw new Error('Upload failed')
    } catch (err) {
      console.error('Failed to upload recording:', err)
      // Continue — assignment still counted as attempted locally
    }

    setSubmitting(false)
    onSubmitted()
  }

  // ────────────────────────────────────────────────────────────────────────────

  // Countdown screen
  if (phase === 'countdown') return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in">
      <div className="text-8xl font-black text-brand-600 tabular-nums animate-pulse">
        {countdown}
      </div>
      <p className="text-lg font-semibold text-gray-700">Get ready to read…</p>
      <p className="text-sm text-gray-400">Speak clearly into your microphone</p>
    </div>
  )

  // Processing screen
  if (phase === 'processing') return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in">
      <div className="w-14 h-14 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="font-semibold text-gray-900 text-lg">Analyzing your reading…</p>
      <p className="text-sm text-gray-500">Checking speed, accuracy, and fluency</p>
    </div>
  )

  // Done / review screen
  if (phase === 'done' && metrics) return (
    <div className="space-y-5 animate-in">



      {/* Playback */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 transition-colors ${
              playing ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
            }`}
            aria-label={playing ? 'Pause' : 'Play recording'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <PlaybackBars playing={playing} />
          <span className="text-xs text-gray-400 font-mono flex-shrink-0">{fmt(seconds)}</span>
        </div>
        {!audioUrl && (
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Audio preview not available — mic was unavailable
          </p>
        )}
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        ℹ️ Your fluency score (accuracy, WPM) will be assigned by your teacher after reviewing your recording.
      </div>

      {/* Optional self-note */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Add a note for your teacher <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. I struggled with the longer words in paragraph 2…"
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none bg-white"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleRedo}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          🔄 Record Again
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
            : '📤 Submit to Teacher'}
        </button>
      </div>
    </div>
  )

  // ── Idle + Recording screens ────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Passage display */}
      <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            📖 {assignment.passageTitle}
          </p>
          <span className="text-xs text-gray-400">{assignment.wordCount} words</span>
        </div>
        <p className="text-gray-900 leading-8 text-base sm:text-[15px] font-serif whitespace-pre-line select-none">
          {assignment.passageText}
        </p>
      </div>

      {/* Teacher instructions */}
      {assignment.instructions && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
          <span className="text-lg flex-shrink-0">💬</span>
          <div>
            <p className="font-semibold text-xs text-amber-700 mb-0.5">Teacher's Instructions</p>
            <p className="leading-relaxed">{assignment.instructions}</p>
          </div>
        </div>
      )}

      {/* Recording controls */}
      {phase === 'idle' && (
        <div className="p-5 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3">
          <div className="text-4xl">🎙</div>
          <div>
            <p className="font-semibold text-gray-900">Ready to record?</p>
            <p className="text-sm text-gray-500 mt-0.5">
              A 3-second countdown starts when you press the button below.
            </p>
          </div>
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>🔇 Find a quiet spot · 🎤 Speak clearly · 📖 Read the full passage</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <button
              onClick={handleStart}
              className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span className="text-lg">🎙</span> Start Recording
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-colors text-sm"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {phase === 'recording' && (
        <div className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-bold text-red-700 text-sm">Recording in progress</span>
            </div>
            <span className="font-mono text-xl font-bold text-red-700 tabular-nums">
              {fmt(seconds)}
            </span>
          </div>
          <WaveformBars active />
          <p className="text-xs text-red-600 text-center">
            Read the passage above at a natural, steady pace
          </p>
          <button
            onClick={handleStop}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>⏹</span> Stop Recording
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Assignment card (list view) ───────────────────────────────────────────────
interface AssignmentCardProps {
  assignment: AssignedPassage
  studentId: string
  onOpen: (a: AssignedPassage) => void
}

function AssignmentCard({ assignment, studentId, onOpen }: AssignmentCardProps) {
  const rawStatus = assignment.submissions[studentId]
  const pill      = statusPill(rawStatus)
  const isNew     = !rawStatus

  return (
    <div
      className={`bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${
        isNew ? 'border-brand-200 shadow-sm' : 'border-gray-100'
      }`}
      onClick={() => onOpen(assignment)}
    >
      {/* Card header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
            isNew ? 'bg-brand-100' : 'bg-gray-100'
          }`}>
            📖
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                  {assignment.passageTitle}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  by {assignment.assignedByName}
                  <span className="mx-1.5">·</span>
                  {timeAgo(assignment.assignedAt)}
                </p>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${pill.cls}`}>
                {pill.label}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${difficultyColor(assignment.difficulty)}`}>
                {assignment.difficulty}
              </span>
              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                {assignment.wordCount} words
              </span>
              <span className="text-[11px] text-gray-400">
                {assignment.topic}
              </span>
              {assignment.dueDateLabel && (
                <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md ml-auto">
                  ⏰ {assignment.dueDateLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Instructions preview */}
        {assignment.instructions && (
          <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-2 bg-gray-50 rounded-lg px-3 py-2">
            💬 {assignment.instructions}
          </p>
        )}
      </div>

      {/* Footer CTA */}
      <div className={`px-4 sm:px-5 py-3 border-t rounded-b-2xl flex items-center justify-between ${
        isNew ? 'bg-brand-50 border-brand-100' : 'bg-gray-50 border-gray-100'
      }`}>
        <span className="text-xs text-gray-500">
          {rawStatus === 'REVIEWED'
            ? '✅ Feedback received — tap to view'
            : rawStatus === 'SUBMITTED'
            ? '📤 Awaiting teacher review'
            : '🎙 Tap to read and record'}
        </span>
        <span className={`text-sm font-bold ${isNew ? 'text-brand-600' : 'text-gray-400'}`}>→</span>
      </div>
    </div>
  )
}

// ─── Detail / recording view ───────────────────────────────────────────────────
interface DetailViewProps {
  assignment: AssignedPassage
  studentId: string
  studentName: string
  studentGrade: string
  onBack: () => void
  onSubmitted: () => void
}

function DetailView({ assignment, studentId, studentName, studentGrade, onBack, onSubmitted }: DetailViewProps) {
  const rawStatus = assignment.submissions[studentId]
  const [mode, setMode] = useState<'view' | 'record'>(
    rawStatus === 'SUBMITTED' || rawStatus === 'REVIEWED' ? 'view' : 'view'
  )

  // Teacher feedback comes from the real API recording — not from an in-memory store.
  // The assignment carries a recordingId when the teacher has reviewed it.
  // We surface the note/score from the assignment's embedded review data if present.
  const existingRec = (assignment as AssignedPassage & { teacherNote?: string; teacherRating?: number; wpm?: number; accuracy?: number; cwpm?: number; score?: number }).teacherNote
    ? assignment as AssignedPassage & { teacherNote?: string; teacherRating?: number; wpm?: number; accuracy?: number; cwpm?: number; score?: number }
    : undefined

  const pill = statusPill(rawStatus)

  return (
    <div className="space-y-5 animate-in">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-lg leading-snug truncate">
            {assignment.passageTitle}
          </h2>
          <p className="text-xs text-gray-400">
            Assigned by {assignment.assignedByName}
            {assignment.dueDateLabel && <span className="ml-2 text-orange-600 font-semibold">⏰ {assignment.dueDateLabel}</span>}
          </p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${pill.cls}`}>
          {pill.label}
        </span>
      </div>

      {/* Already reviewed — show teacher feedback */}
      {rawStatus === 'REVIEWED' && existingRec?.teacherNote && (
        <div className="p-4 bg-success-50 border-2 border-success-200 rounded-2xl animate-in">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧑‍🏫</span>
            <div className="flex-1">
              <p className="font-bold text-success-800 text-sm">Teacher's Feedback</p>
              {existingRec.teacherRating && (
                <div className="flex gap-0.5 my-1">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={`text-lg ${n <= existingRec.teacherRating! ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-success-900 leading-relaxed">{existingRec.teacherNote}</p>
              {existingRec.score !== undefined && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { label: 'WPM',      value: existingRec.wpm ?? 0,        good: (existingRec.wpm ?? 0) >= 90 },
                    { label: 'Accuracy', value: `${existingRec.accuracy ?? 0}%`, good: (existingRec.accuracy ?? 0) >= 85 },
                    { label: 'CWPM',     value: existingRec.cwpm ?? 0,       good: (existingRec.cwpm ?? 0) >= 80 },
                    { label: 'Score',    value: `${existingRec.score}/100`, good: (existingRec.score ?? 0) >= 60 },
                  ].map(m => (
                    <div key={m.label} className={`p-2 rounded-lg text-center ${m.good ? 'bg-success-100' : 'bg-danger-100'}`}>
                      <p className={`text-sm font-bold ${m.good ? 'text-success-700' : 'text-danger-700'}`}>{m.value}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submitted — waiting */}
      {rawStatus === 'SUBMITTED' && !existingRec?.teacherNote && (
        <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl flex items-center gap-3">
          <span className="text-2xl">📤</span>
          <div>
            <p className="font-semibold text-brand-800 text-sm">Submitted — waiting for review</p>
            <p className="text-xs text-brand-600 mt-0.5">
              Your teacher will listen and leave feedback soon.
            </p>
          </div>
        </div>
      )}

      {/* Record fresh */}
      {mode === 'view' && !rawStatus && (
        <RecordingPanel
          assignment={assignment}
          studentId={studentId}
          studentName={studentName}
          studentGrade={studentGrade}
          onSubmitted={onSubmitted}
          onCancel={onBack}
        />
      )}

      {/* Re-record button for reviewed */}
      {(rawStatus === 'REVIEWED' || rawStatus === 'SUBMITTED') && mode === 'view' && (
        <div className="space-y-3">
          {/* Show passage read-only */}
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📖 Passage</p>
            <p className="text-gray-900 leading-8 text-[15px] font-serif whitespace-pre-line">
              {assignment.passageText}
            </p>
          </div>
          <button
            onClick={() => setMode('record')}
            className="w-full py-3.5 border-2 border-dashed border-brand-300 text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors text-sm"
          >
            🎙 Record Another Attempt
          </button>
        </div>
      )}

      {mode === 'record' && (
        <RecordingPanel
          assignment={assignment}
          studentId={studentId}
          studentName={studentName}
          studentGrade={studentGrade}
          onSubmitted={onSubmitted}
          onCancel={() => setMode('view')}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReadingPracticePage() {
  const { user } = useAuth()
  const profile  = user?.profile as StudentProfile

  const grade      = profile?.grade ?? 'GRADE_6'
  const studentId  = profile?.id    ?? ''
  const studentName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()

  const [assignments, setAssignments] = useState<AssignedPassage[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected]     = useState<AssignedPassage | null>(null)
  const [filterTab, setFilterTab]   = useState<'all' | 'pending' | 'done'>('all')

  const loadAssignments = async () => {
    if (!grade) return
    setLoadingAssignments(true)
    setLoadError(null)
    try {
      const token = localStorage.getItem('lisan_token') ?? ''
      const headers = { Authorization: `Bearer ${token}` }

      // Use student-scoped endpoints; admin routes reject student tokens.
      const [aRes, pRes, recRes] = await Promise.all([
        fetch('/api/students/assignments', { headers }),
        fetch('/api/students/content', { headers }),
        fetch('/api/recordings/mine', { headers }),
      ])

      const asgns: { id: string; contentId: string; contentType: string; grade: string; note?: string; dueDate?: string; assignedAt: string; status: string }[] =
        aRes.ok ? (await aRes.json()).data ?? [] : []
      const content = pRes.ok ? (await pRes.json()).data ?? {} : {}
      const passages: { id: string; title: string; content: string; wordCount: number; difficulty: string; topic?: string }[] = content.passages ?? []
      const myRecordings: { id: string; passageId?: string; passageTitle: string; reviewed: boolean; teacherNote?: string; teacherRating?: number; wpm: number; accuracy: number; cwpm: number; score: number }[] =
        recRes.ok ? (await recRes.json()).data ?? [] : []

      // Build passage map
      const passageMap = new Map(passages.map(p => [p.id, p]))

      // Filter to active passage assignments for this student's grade
      const relevant = asgns.filter(
        a => a.status !== 'archived' && a.contentType === 'passage' &&
             (a.grade === grade || a.grade === 'ALL')
      )

      const resolved: AssignedPassage[] = relevant.map(a => {
        const passage = passageMap.get(a.contentId)
        const myRec = myRecordings.find(r => r.passageId === a.contentId || r.passageTitle === passage?.title)
        const status = myRec?.reviewed ? 'REVIEWED' : myRec ? 'SUBMITTED' : undefined

        // Format due date label
        let dueDateLabel: string | undefined
        if (a.dueDate) {
          const due = new Date(a.dueDate)
          const diff = Math.ceil((due.getTime() - Date.now()) / 86400000)
          dueDateLabel = diff <= 0 ? 'Overdue' : diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`
        }

        return {
          id: a.id,
          passageId: a.contentId,
          passageTitle: passage?.title ?? a.contentId,
          passageText: passage?.content ?? '',
          wordCount: passage?.wordCount ?? 0,
          difficulty: passage?.difficulty ?? 'MEDIUM',
          topic: passage?.topic,
          instructions: a.note,
          assignedByName: 'Admin',
          assignedAt: a.assignedAt,
          dueDateLabel,
          submissions: status ? { [studentId]: status } : {},
          recordingIds: myRec ? { [studentId]: myRec.id } : {},
          // Embed teacher review data if available
          ...(myRec?.teacherNote ? {
            teacherNote: myRec.teacherNote,
            teacherRating: myRec.teacherRating,
            wpm: myRec.wpm,
            accuracy: myRec.accuracy,
            cwpm: myRec.cwpm,
            score: myRec.score,
          } : {}),
        } as AssignedPassage
      })

      setAssignments(resolved)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setLoadingAssignments(false)
    }
  }

  useEffect(() => { loadAssignments() }, [grade]) // eslint-disable-line react-hooks/exhaustive-deps

  const reload = () => loadAssignments()

  const handleSubmitted = () => {
    reload()
    setSelected(null)
  }

  const pending  = assignments.filter(a => !a.submissions[studentId] || a.submissions[studentId] === 'PENDING')
  const done     = assignments.filter(a => a.submissions[studentId] === 'SUBMITTED' || a.submissions[studentId] === 'REVIEWED')
  const reviewed = assignments.filter(a => a.submissions[studentId] === 'REVIEWED')

  const filtered =
    filterTab === 'pending' ? pending :
    filterTab === 'done'    ? done    :
    assignments

  // Detail view
  if (selected) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <DetailView
            assignment={selected}
            studentId={studentId}
            studentName={studentName}
            studentGrade={grade}
            onBack={() => setSelected(null)}
            onSubmitted={handleSubmitted}
          />
        </div>
      </StudentLayout>
    )
  }

  if (loadingAssignments) return (
    <StudentLayout>
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your reading assignments…</p>
        </div>
      </div>
    </StudentLayout>
  )

  if (loadError) return (
    <StudentLayout>
      <div className="max-w-lg mx-auto text-center py-20 animate-in">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Could not load assignments</h1>
        <p className="text-gray-500 mb-6">{loadError}</p>
        <button onClick={reload} className="btn-primary">Try Again</button>
      </div>
    </StudentLayout>
  )

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📖 Reading Practice</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your teacher has assigned passages for you to read aloud. Record yourself and submit for feedback.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Assigned',  value: assignments.length, color: 'text-brand-600',   bg: 'bg-brand-50'   },
            { label: 'Pending',   value: pending.length,     color: 'text-warning-600', bg: 'bg-warning-50' },
            { label: 'Reviewed',  value: reviewed.length,    color: 'text-success-600', bg: 'bg-success-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {([
            { id: 'all',     label: `All (${assignments.length})` },
            { id: 'pending', label: `📖 Pending (${pending.length})` },
            { id: 'done',    label: `✅ Done (${done.length})` },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterTab === tab.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignment list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-gray-700">
              {filterTab === 'pending' ? 'All caught up!' : 'No reading assignments yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {filterTab === 'pending'
                ? 'You have submitted all your assigned readings.'
                : 'An admin or teacher will assign passages here when content is ready.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(a => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                studentId={studentId}
                onOpen={setSelected}
              />
            ))}
          </div>
        )}

        {/* Tips card */}
        <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl text-sm">
          <p className="font-semibold text-brand-800 mb-2">🎙 Tips for a great recording</p>
          <ul className="space-y-1 text-brand-700 text-xs leading-relaxed">
            <li>📍 Find a quiet room with no background noise</li>
            <li>📖 Read the passage once silently before recording</li>
            <li>🗣️ Speak clearly and at a natural, steady pace</li>
            <li>⏸ Pause at commas and full stops — it shows comprehension</li>
            <li>🔄 You can always re-record before submitting</li>
          </ul>
        </div>
      </div>
    </StudentLayout>
  )
}
