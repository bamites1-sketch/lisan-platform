import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import StudentLayout from '../../components/layout/StudentLayout'
import VoiceRecorder from '../../components/ui/VoiceRecorder'
import type { SkillArea, StudentProfile, Question } from '../../types'
import { recordingApi, calculateFluencyScore, assessmentApi } from '../../services/api'

// ─── Section config ───────────────────────────────────────────────────────────
const SECTIONS: { id: SkillArea; label: string; emoji: string; description: string }[] = [
  { id: 'PHONEMIC_AWARENESS', label: 'Phonemic Awareness', emoji: '🔊', description: "We'll explore how well you recognize and work with sounds in words." },
  { id: 'PHONICS_DECODING',   label: 'Phonics & Decoding', emoji: '🔤', description: "We'll see how you decode and sound out new words." },
  { id: 'FLUENCY',            label: 'Reading Fluency',    emoji: '🎤', description: "We'll listen to you read a short passage aloud." },
  { id: 'VOCABULARY',         label: 'Vocabulary',          emoji: '📚', description: "We'll test how well you understand words and their meanings." },
  { id: 'COMPREHENSION',      label: 'Comprehension',       emoji: '🧠', description: "We'll see how well you understand what you read." },
]

// Parse question options from JSON string (SQLite stores as string)
function parseQuestion(q: Record<string, unknown>): Question {
  return {
    ...q,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? []),
  } as Question
}

// ─── Fluency recording sub-component ─────────────────────────────────────────
interface FluencyPassage {
  id: string
  title: string
  content: string
  wordCount: number
}

function FluencySection({
  onComplete,
}: {
  onComplete: (score: number) => void
  assessmentId: string | null
}) {
  const [phase, setPhase] = useState<'loading' | 'intro' | 'reading' | 'submitting' | 'done' | 'error'>('loading')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [passage, setPassage] = useState<FluencyPassage | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Load a fluency passage from the backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/students/content', {
          headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
        })
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        const j = await res.json()
        const passages: FluencyPassage[] = j.data?.passages ?? []
        const pick = passages.find(p => p.wordCount > 0) ?? passages[0] ?? null
        if (!pick) {
          setErrorMsg('No fluency passage is available yet. An admin needs to add a passage before this section can be completed.')
          setPhase('error')
          return
        }
        setPassage(pick)
        setPhase('intro')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load passage')
        setPhase('error')
      }
    }
    load()
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const startRecording = async () => {
    if (!passage) return
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecRef.current = mr
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      mr.start()
      setRecording(true)
    } catch {
      // No mic — timer-only mode still counts duration
    }
    setPhase('reading')
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  const stopRecording = async () => {
    clearInterval(timerRef.current!)
    if (mediaRecRef.current?.state === 'recording') {
      mediaRecRef.current.stop()
      mediaRecRef.current.stream?.getTracks().forEach(t => t.stop())
    }
    setRecording(false)
    setPhase('submitting')

    if (!passage) { onComplete(0); setPhase('done'); return }

    const duration = Math.max(seconds, 10)
    const audioBlob = chunksRef.current.length > 0
      ? new Blob(chunksRef.current, { type: 'audio/webm' })
      : undefined

    // Upload recording to backend — accuracy is 0 (pending teacher review)
    // Teacher/admin assigns the real score after reviewing the recording
    const { wpm, cwpm, pauseCount } = calculateFluencyScore(passage.wordCount, duration, 0)

    try {
      const form = new FormData()
      if (audioBlob) form.append('audio', audioBlob, 'fluency-recording.webm')
      form.append('passageTitle', passage.title)
      form.append('passageId', passage.id)
      form.append('durationSeconds', String(duration))
      form.append('wpm', String(wpm))
      form.append('accuracy', '0')           // Pending teacher review
      form.append('cwpm', String(cwpm))
      form.append('totalWords', String(passage.wordCount))
      form.append('pauseCount', String(pauseCount))
      form.append('hesitationCount', '0')
      form.append('score', '0')             // Score assigned by teacher after review
      await recordingApi.upload(form)
    } catch (err) {
      console.error('Failed to upload fluency recording:', err)
      // Recording upload failure is non-fatal; assessment continues
    }

    // Fluency score for the assessment is marked as 0 / pending until teacher reviews
    // The assessment complete endpoint will use the submitted responses only
    onComplete(0)
    setPhase('done')
  }

  if (phase === 'loading') return (
    <div className="flex flex-col items-center py-16 gap-4">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading passage…</p>
    </div>
  )

  if (phase === 'error') return (
    <div className="p-5 bg-warning-50 border border-warning-200 rounded-2xl text-center">
      <p className="text-2xl mb-2">📖</p>
      <p className="font-semibold text-warning-900 mb-1">Fluency passage not available</p>
      <p className="text-sm text-warning-700">{errorMsg}</p>
      <button onClick={() => onComplete(0)} className="btn-secondary mt-4 text-sm">
        Skip Fluency Section →
      </button>
    </div>
  )

  if (phase === 'intro' && passage) return (
    <div className="space-y-5 animate-in">
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-sm text-orange-800 leading-relaxed">
        <p className="font-semibold mb-1">🎤 Reading Aloud Assessment</p>
        Read the passage below at your natural pace. Click <strong>Start Reading</strong> when ready, then <strong>Stop</strong> when you finish.
      </div>
      <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-orange-400">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📖 {passage.title}</p>
        <p className="text-gray-800 leading-loose whitespace-pre-line">{passage.content}</p>
        <p className="text-xs text-gray-400 mt-2">{passage.wordCount} words</p>
      </div>
      <button onClick={startRecording} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
        <span className="text-lg">🎙</span> Start Reading
      </button>
    </div>
  )

  if (phase === 'reading' && passage) return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
          <span className="text-sm font-semibold text-red-700">{recording ? 'Recording…' : 'Timer running…'}</span>
        </div>
        <span className="font-mono text-lg font-bold text-red-700">{fmt(seconds)}</span>
      </div>
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-gray-800 leading-loose whitespace-pre-line">{passage.content}</p>
      </div>
      <button onClick={stopRecording} className="btn-primary w-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 py-4">
        <span>⏹</span> Stop Reading
      </button>
    </div>
  )

  if (phase === 'submitting') return (
    <div className="flex flex-col items-center py-16 gap-4">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="font-semibold text-gray-900">Uploading your recording…</p>
      <p className="text-sm text-gray-500">Your teacher will review it and provide a fluency score.</p>
    </div>
  )

  return (
    <div className="text-center py-8 space-y-3">
      <p className="text-success-600 font-semibold text-lg">✅ Recording submitted for review</p>
      <p className="text-sm text-gray-500">Your teacher will listen and assign your fluency score.</p>
    </div>
  )
}

// ─── Main Assessment Page ─────────────────────────────────────────────────────
export default function AssessmentPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const profile = user?.profile as StudentProfile

  const [phase, setPhase] = useState<'intro' | 'sections' | 'complete'>('intro')
  const [startError, setStartError] = useState<string | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)

  // Per-section question state
  const [currentSection, setCurrentSection] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)

  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [answers, setAnswers] = useState<Record<string, { answer: string; correct: boolean }>>({})
  const [sectionScores, setSectionScores] = useState<Record<string, number>>({})
  const [passageCache, setPassageCache] = useState<Record<string, string>>({}) // passageId → content
  const [showHint, setShowHint] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  const section = SECTIONS[currentSection]
  const question = questions[currentQ]
  const overallProgress = (currentSection / SECTIONS.length) * 100 +
    (currentQ / Math.max(questions.length, 1)) * (100 / SECTIONS.length)

  // Load questions for the current section from the real API
  const loadQuestionsForSection = useCallback(async (sectionId: SkillArea, asmId: string) => {
    if (sectionId === 'FLUENCY') return // Fluency has its own sub-component
    setQuestionsLoading(true)
    setQuestionsError(null)
    setQuestions([])
    try {
      const res = await fetch(
        `/api/assessments/${asmId}/questions?skillArea=${sectionId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` } }
      )
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message || `Server error ${res.status}`)
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load questions')
      const qs: Question[] = (json.data ?? []).map(parseQuestion)
      setQuestions(qs)
      setCurrentQ(0)
      setSelectedAnswer(null)
      setConfirmed(false)
      setShowHint(false)
      setHintLevel(0)
      setQuestionStartTime(Date.now())

      // Pre-fetch any passage content referenced by comprehension questions
      const passageIds = [...new Set(qs.map(q => q.passageId).filter(Boolean))] as string[]
      for (const pid of passageIds) {
        if (passageCache[pid]) continue
        try {
          const pr = await fetch(`/api/students/content/passage/${pid}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
          })
          if (pr.ok) {
            const pj = await pr.json()
            if (pj.data?.content) setPassageCache(c => ({ ...c, [pid]: pj.data.content }))
          }
        } catch { /* passage text unavailable; omit */ }
      }
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setQuestionsLoading(false)
    }
  }, [passageCache])

  const handleSelectAnswer = (opt: string) => {
    if (confirmed) return
    setSelectedAnswer(opt)
    setShowHint(false)
  }

  // Voice transcript → fuzzy-match to an option
  const handleVoiceTranscript = (text: string) => {
    if (!question?.options) return
    const lower = text.toLowerCase().trim()
    const match = question.options.find(opt =>
      lower.includes(opt.toLowerCase()) || opt.toLowerCase().includes(lower.split(' ')[0])
    )
    setSelectedAnswer(match ?? text)
  }

  const handleConfirm = async () => {
    if (!selectedAnswer || !question) return
    const correct = selectedAnswer === question.correctAnswer
    setAnswers(prev => ({ ...prev, [question.id]: { answer: selectedAnswer, correct } }))
    setConfirmed(true)

    if (assessmentId) {
      try {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
        await assessmentApi.submitResponse(assessmentId, {
          questionId: question.id,
          answer: selectedAnswer,
          timeSpent,
        })
      } catch {
        // Non-fatal — continue without blocking the student
      }
    }
  }

  const advanceSection = async () => {
    // Calculate score only from answered questions
    const answered = questions.filter(q => answers[q.id])
    const correct = answered.filter(q => answers[q.id]?.correct).length
    const score = answered.length > 0 ? Math.round((correct / answered.length) * 100) : 0
    setSectionScores(prev => ({ ...prev, [section.id]: score }))

    if (currentSection < SECTIONS.length - 1) {
      const nextSection = SECTIONS[currentSection + 1]
      setCurrentSection(s => s + 1)
      if (nextSection.id !== 'FLUENCY' && assessmentId) {
        await loadQuestionsForSection(nextSection.id, assessmentId)
      }
    } else {
      if (assessmentId) {
        try { await assessmentApi.complete(assessmentId) } catch { /* non-fatal */ }
      }
      setPhase('complete')
    }
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
      setSelectedAnswer(null)
      setConfirmed(false)
      setShowHint(false)
      setHintLevel(0)
      setQuestionStartTime(Date.now())
    } else {
      advanceSection()
    }
  }

  const handleFluencyComplete = async (score: number) => {
    setSectionScores(prev => ({ ...prev, FLUENCY: score }))
    await new Promise(r => setTimeout(r, 800)) // brief pause before moving on
    if (currentSection < SECTIONS.length - 1) {
      const nextSection = SECTIONS[currentSection + 1]
      setCurrentSection(s => s + 1)
      if (nextSection.id !== 'FLUENCY' && assessmentId) {
        await loadQuestionsForSection(nextSection.id, assessmentId)
      }
    } else {
      if (assessmentId) {
        try { await assessmentApi.complete(assessmentId) } catch { /* non-fatal */ }
      }
      setPhase('complete')
    }
  }

  const getHintText = () => {
    if (!question) return ''
    if (hintLevel === 1) return `💡 Think about the key words in the question. What stands out to you?`
    if (hintLevel === 2) return `💡 Look at the options — can you eliminate any that clearly don't fit? Try to narrow it down to two.`
    return `💡 Explanation: ${question.explanation ?? 'Consider the context carefully.'}`
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto animate-in">
        <div className="card text-center py-10 px-8">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{t.assessmentTitle}</h1>
          <p className="text-gray-600 leading-relaxed mb-6">{t.assessmentIntro}</p>

          <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-2xl text-sm text-brand-800 text-left">
            <p className="font-semibold mb-1">🎙 Answer with your voice!</p>
            <p>Each question has a mic button. Tap it, speak your answer, and Lisan will match it automatically. You can also type as usual.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8 text-left">
            {SECTIONS.map((s, i) => (
              <div key={s.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">{i + 1}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.emoji} {s.label}</p>
                  <p className="text-xs text-gray-500 leading-snug">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {startError && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
              ⚠️ {startError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={async () => {
                setStartError(null)
                try {
                  const result = await assessmentApi.start()
                  setAssessmentId(result.id)
                  // Load questions for the first non-fluency section
                  const first = SECTIONS[0]
                  if (first.id !== 'FLUENCY') {
                    await loadQuestionsForSection(first.id, result.id)
                  }
                  setPhase('sections')
                  setQuestionStartTime(Date.now())
                } catch (err) {
                  setStartError(err instanceof Error ? err.message : 'Failed to start assessment. Please try again.')
                }
              }}
              className="btn-primary px-8 py-3.5"
            >
              {t.letsBegin}
            </button>
            <button onClick={() => navigate('/student/dashboard')} className="btn-secondary px-6">{t.maybeLater}</button>
          </div>
          <p className="text-xs text-gray-400 mt-4">Takes about 20–25 minutes · Progress is saved</p>
        </div>
      </div>
    </StudentLayout>
  )

  // ── COMPLETE ───────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    // Use only scores from sections that were answered; fluency = pending review
    const scoredSections = SECTIONS.filter(s => sectionScores[s.id] !== undefined)
    const overall = scoredSections.length > 0
      ? Math.round(scoredSections.reduce((a, s) => a + sectionScores[s.id], 0) / scoredSections.length)
      : 0

    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto animate-in">
          <div className="card text-center py-10 px-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.assessmentComplete}</h1>
            <p className="text-gray-500 mb-8">Great work, {profile?.firstName}!</p>

            <div className="inline-block bg-brand-50 border-2 border-brand-200 rounded-3xl px-8 py-5 mb-6">
              <div className="text-5xl font-bold text-brand-600 mb-1">{overall}</div>
              <div className="text-sm text-gray-600 font-medium">Overall Readiness Score</div>
            </div>

            <div className="space-y-3 mb-8 text-left">
              {SECTIONS.map(s => {
                const score = sectionScores[s.id]
                const isPending = score === undefined || (s.id === 'FLUENCY' && score === 0)
                const bar = isPending ? 'bg-gray-300' : score >= 75 ? 'bg-success-500' : score >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                const txt = isPending ? 'text-gray-400' : score >= 75 ? 'text-success-700' : score >= 60 ? 'text-warning-700' : 'text-danger-700'
                return (
                  <div key={s.id} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-lg w-6 flex-shrink-0">{s.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 w-28 sm:w-44 flex-shrink-0 truncate">{s.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-0">
                      <div className={`h-2 rounded-full ${bar} transition-all duration-700`} style={{ width: isPending ? '100%' : `${score}%` }} />
                    </div>
                    <span className={`text-sm font-bold w-20 text-right flex-shrink-0 ${txt}`}>
                      {isPending ? 'Pending review' : score}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-gray-400 mb-6">
              Fluency score will be assigned after your teacher reviews your recording.
            </p>

            <button onClick={() => navigate('/student/profile')} className="btn-primary px-8 py-3.5 w-full sm:w-auto">
              View Your Reading Profile →
            </button>
          </div>
        </div>
      </StudentLayout>
    )
  }

  // ── SECTIONS ───────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto animate-in">
        {/* Overall progress header */}
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Assessment {currentSection + 1} of {SECTIONS.length}
            </span>
            <span className="text-sm text-gray-500">{section.emoji} {section.label}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-2 bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            {SECTIONS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < currentSection  ? 'bg-success-500 text-white' :
                  i === currentSection ? 'bg-brand-600 text-white'  :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < currentSection ? '✓' : i + 1}
                </div>
                {i < SECTIONS.length - 1 && (
                  <div className={`h-0.5 w-5 ${i < currentSection ? 'bg-success-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section intro banner */}
        <div className={`mb-5 p-4 rounded-2xl ${
          section.id === 'PHONEMIC_AWARENESS' ? 'bg-purple-50 border border-purple-200' :
          section.id === 'PHONICS_DECODING'   ? 'bg-brand-50 border border-brand-200' :
          section.id === 'FLUENCY'            ? 'bg-orange-50 border border-orange-200' :
          section.id === 'VOCABULARY'         ? 'bg-green-50 border border-green-200' :
                                                 'bg-indigo-50 border border-indigo-200'
        }`}>
          <p className="font-semibold text-gray-900">{section.emoji} {section.label}</p>
          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
        </div>

        {/* Fluency section */}
        {section.id === 'FLUENCY' ? (
          <div className="card">
            <FluencySection onComplete={handleFluencyComplete} assessmentId={assessmentId} />
          </div>
        ) : questionsLoading ? (
          <div className="card flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading questions…</p>
          </div>
        ) : questionsError ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-semibold text-gray-800 mb-1">Could not load questions</p>
            <p className="text-sm text-gray-500 mb-4">{questionsError}</p>
            <p className="text-xs text-gray-400">If no questions have been added by an admin yet, this section cannot be completed.</p>
            <button onClick={advanceSection} className="btn-secondary mt-4 text-sm">Skip Section →</button>
          </div>
        ) : questions.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-gray-800 mb-1">No questions available for this section</p>
            <p className="text-sm text-gray-500 mb-4">
              Questions for <strong>{section.label}</strong> haven't been added yet. An admin needs to add questions before this section can be completed.
            </p>
            <button onClick={advanceSection} className="btn-secondary text-sm">Skip Section →</button>
          </div>
        ) : question ? (
          <div className="card">
            {/* Passage for comprehension */}
            {question.passageId && passageCache[question.passageId] && (
              <div className="mb-5 p-4 bg-gray-50 rounded-xl border-l-4 border-brand-400">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📖 Reading Passage</p>
                <p className="text-sm text-gray-700 leading-relaxed">{passageCache[question.passageId]}</p>
              </div>
            )}

            {/* Q header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Question {currentQ + 1} of {questions.length}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                question.difficulty === 'EASY' ? 'bg-success-100 text-success-700' :
                question.difficulty === 'HARD' ? 'bg-danger-100 text-danger-700' :
                'bg-warning-100 text-warning-700'
              }`}>
                {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
              </span>
            </div>

            <p className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed mb-5">
              {question.questionText}
            </p>

            {/* Voice input */}
            {!confirmed && (
              <div className="mb-5 pb-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  🎙 Answer with voice
                </p>
                <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={confirmed} />
                <p className="text-xs text-gray-400 mt-2 text-center">{t.orType}</p>
              </div>
            )}

            {/* Options */}
            <div className="space-y-2.5 mb-5">
              {(question.options ?? []).map(opt => {
                let style = 'border-gray-200 bg-white text-gray-700 hover:border-brand-400 hover:bg-brand-50'
                if (confirmed) {
                  if (opt === question.correctAnswer) style = 'border-success-400 bg-success-50 text-success-800'
                  else if (opt === selectedAnswer)     style = 'border-danger-400 bg-danger-50 text-danger-700'
                  else                                 style = 'border-gray-100 bg-gray-50 text-gray-400'
                } else if (opt === selectedAnswer) {
                  style = 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                }
                return (
                  <button key={opt} onClick={() => handleSelectAnswer(opt)} disabled={confirmed}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${style}`}>
                    <span className="flex items-center gap-2">
                      {confirmed && opt === question.correctAnswer && <span className="text-success-600 flex-shrink-0">✓</span>}
                      {confirmed && opt === selectedAnswer && opt !== question.correctAnswer && <span className="text-danger-600 flex-shrink-0">✗</span>}
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Hint */}
            {!confirmed && (
              <div className="mb-4">
                {showHint ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
                    <p className="font-semibold mb-1">💡 Hint {hintLevel} of 3</p>
                    <p>{getHintText()}</p>
                    {hintLevel < 3 && (
                      <button onClick={() => setHintLevel(l => l + 1)} className="mt-1.5 text-xs text-amber-700 underline">
                        Need another hint?
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => { setHintLevel(1); setShowHint(true) }}
                    className="text-sm text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1.5">
                    <span>💡</span> {t.needHint}
                  </button>
                )}
              </div>
            )}

            {/* Answer feedback */}
            {confirmed && (
              <div className={`mb-5 p-4 rounded-xl text-sm animate-in ${
                selectedAnswer === question.correctAnswer
                  ? 'bg-success-50 border border-success-200 text-success-800'
                  : 'bg-danger-50 border border-danger-200 text-danger-800'
              }`}>
                <p className="font-semibold mb-1">
                  {selectedAnswer === question.correctAnswer ? t.correct : t.incorrect}
                </p>
                <p>{question.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!confirmed ? (
                <button onClick={handleConfirm} disabled={!selectedAnswer} className="btn-primary flex-1 disabled:opacity-40">
                  {t.checkAnswer}
                </button>
              ) : (
                <button onClick={handleNext} className="btn-primary flex-1">
                  {currentQ < questions.length - 1 ? t.nextQuestion :
                   currentSection < SECTIONS.length - 1 ? `Next: ${SECTIONS[currentSection + 1].label} →` :
                   t.seeResults}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </StudentLayout>
  )
}
