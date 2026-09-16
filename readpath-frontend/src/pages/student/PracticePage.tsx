import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StudentLayout from '../../components/layout/StudentLayout'
import type { Question, SkillArea } from '../../types'

type Phase = 'loading' | 'error' | 'empty' | 'intro' | 'practice' | 'result'

const SKILL_INTROS: Record<string, { title: string; tip: string; emoji: string }> = {
  phonemic_awareness: { emoji: '🔊', title: 'Phonemic Awareness Practice', tip: 'Listen carefully to the sounds in words. Think about beginnings, middles, and endings.' },
  phonics_decoding:   { emoji: '🔤', title: 'Phonics & Decoding Practice', tip: 'Sound out each part of the word. Look for patterns you already know.' },
  fluency:            { emoji: '🎤', title: 'Fluency Practice', tip: "Read aloud, naturally and accurately. Don't rush." },
  vocabulary:         { emoji: '📚', title: 'Vocabulary Practice', tip: 'Use context clues — look at the words around the unfamiliar word for hints.' },
  comprehension:      { emoji: '🧠', title: 'Comprehension Practice', tip: 'Ask yourself: What is this mostly about? What can I figure out from what\'s said?' },
}

function parseQuestion(q: Record<string, unknown>): Question {
  return {
    ...q,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? []),
  } as Question
}

export default function PracticePage() {
  const { skill } = useParams<{ skill: string }>()
  const skillKey = skill?.toUpperCase().replace(/-/g, '_') as SkillArea
  const info = SKILL_INTROS[skill?.toLowerCase() ?? 'vocabulary'] ?? SKILL_INTROS.vocabulary

  const [phase, setPhase] = useState<Phase>('loading')
  const [loadError, setLoadError] = useState('')
  const [practiceId, setPracticeId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showHint, setShowHint] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)

  const startPractice = async () => {
    setPhase('loading')
    setLoadError('')
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lisan_token')}`,
        },
        body: JSON.stringify({ skillArea: skillKey }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message || `Server error ${res.status}`)
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to start practice')

      const qs: Question[] = (json.data?.questions ?? []).map(parseQuestion)

      setPracticeId(json.data?.practice?.id ?? null)
      setQuestions(qs)
      setCurrentIdx(0)
      setSelected(null)
      setConfirmed(false)
      setScore({ correct: 0, total: 0 })
      setShowHint(false)
      setHintLevel(0)
      setHintsUsed(0)

      if (qs.length === 0) {
        setPhase('empty')
      } else {
        setPhase('intro')
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load practice questions')
      setPhase('error')
    }
  }

  useEffect(() => {
    startPractice()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillKey])

  const q = questions[currentIdx]

  const handleConfirm = async () => {
    if (!selected || !q) return
    const correct = selected === q.correctAnswer
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setConfirmed(true)

    if (practiceId) {
      try {
        await fetch(`/api/practice/${practiceId}/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('lisan_token')}`,
          },
          body: JSON.stringify({
            questionId: q.id,
            answer: selected,
            hintsUsed: hintLevel,
          }),
        })
      } catch { /* non-fatal */ }
    }
  }

  const handleHint = () => {
    const next = Math.min(hintLevel + 1, 3)
    setHintLevel(next)
    setHintsUsed(h => h + 1)
    setShowHint(true)
  }

  const getHint = (): string => {
    if (!q) return ''
    if (hintLevel === 1) return `💡 Think about what you already know about this topic. What key words stand out to you in the question?`
    if (hintLevel === 2) return `💡 Look at the options carefully. Can you eliminate any that clearly don't make sense? Try to narrow it down to two choices.`
    return `💡 Here's the key insight: ${q.explanation ?? 'Consider the context carefully before choosing.'}`
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setConfirmed(false)
      setShowHint(false)
      setHintLevel(0)
    } else {
      completePractice()
    }
  }

  const completePractice = async () => {
    if (practiceId) {
      try {
        await fetch(`/api/practice/${practiceId}/complete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
        })
      } catch { /* non-fatal */ }
    }
    setPhase('result')
  }

  const restart = () => startPractice()

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <StudentLayout>
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading questions…</p>
        </div>
      </div>
    </StudentLayout>
  )

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (phase === 'error') return (
    <StudentLayout>
      <div className="max-w-xl mx-auto text-center py-20 animate-in">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Could not load practice</h1>
        <p className="text-gray-500 mb-6">{loadError}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={restart} className="btn-primary">Try Again</button>
          <Link to="/student/dashboard" className="btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    </StudentLayout>
  )

  // ── EMPTY ──────────────────────────────────────────────────────────────────
  if (phase === 'empty') return (
    <StudentLayout>
      <div className="max-w-xl mx-auto animate-in">
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{info.title}</h1>
          <p className="text-gray-500 mb-6 text-sm">
            No questions are available for <strong>{info.title}</strong> yet. An admin needs to add questions to the content library before you can practice this skill.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/student/dashboard" className="btn-secondary px-6">Back to Dashboard</Link>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Practice other skills</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(SKILL_INTROS)
              .filter(([k]) => k !== skill?.toLowerCase())
              .map(([k, v]) => (
                <Link key={k} to={`/student/practice/${k}`}
                  className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all text-sm font-medium text-gray-700 hover:text-brand-700">
                  <span>{v.emoji}</span>
                  <span className="truncate">{v.title.replace(' Practice', '')}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  )

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <StudentLayout>
      <div className="max-w-xl mx-auto animate-in">
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">{info.emoji}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{info.title}</h1>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed max-w-sm mx-auto">{info.tip}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setPhase('practice')} className="btn-primary px-8">
              Start Practice →
            </button>
            <Link to="/student/dashboard" className="btn-secondary px-6">Back to Dashboard</Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">{questions.length} question{questions.length !== 1 ? 's' : ''} · Hints available</p>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Practice other skills</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(SKILL_INTROS)
              .filter(([k]) => k !== skill?.toLowerCase())
              .map(([k, v]) => (
                <Link key={k} to={`/student/practice/${k}`}
                  className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all text-sm font-medium text-gray-700 hover:text-brand-700">
                  <span>{v.emoji}</span>
                  <span className="truncate">{v.title.replace(' Practice', '')}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  )

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const msg = accuracy >= 80 ? { emoji: '🎉', text: 'Excellent work!',   color: 'text-success-700', bg: 'bg-success-50 border-success-200' }
      : accuracy >= 60 ? { emoji: '💪', text: 'Good effort!',    color: 'text-warning-700', bg: 'bg-warning-50 border-warning-200' }
      : { emoji: '📚', text: 'Keep practicing!', color: 'text-brand-700',   bg: 'bg-brand-50 border-brand-200' }
    const xp = score.correct * 5
    return (
      <StudentLayout>
        <div className="max-w-xl mx-auto animate-in">
          <div className="card text-center py-10">
            <div className="text-5xl mb-3">{msg.emoji}</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{msg.text}</h1>
            <p className="text-gray-500 text-sm mb-6">Practice session complete</p>

            <div className={`inline-block px-8 py-4 rounded-2xl border mb-6 ${msg.bg}`}>
              <div className={`text-4xl font-bold ${msg.color} mb-1`}>{accuracy}%</div>
              <div className="text-sm text-gray-600">{score.correct} of {score.total} correct</div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 text-sm text-gray-600">
              <div className="text-center"><div className="font-bold text-lg text-brand-600">+{xp}</div><div>XP Earned</div></div>
              <div className="text-center"><div className="font-bold text-lg">{hintsUsed}</div><div>Hints Used</div></div>
              <div className="text-center"><div className="font-bold text-lg">{questions.length}</div><div>Questions</div></div>
            </div>

            {accuracy < 80 && (
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-800 mb-6 text-left">
                <p className="font-semibold mb-1">💡 Lemi's tip:</p>
                <p>
                  {accuracy < 50
                    ? "This skill needs more practice. Try the lesson first to build your understanding, then come back."
                    : "You're getting there! Review any questions you missed and try again — each attempt makes you stronger."}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={restart} className="btn-primary">Practice Again</button>
              <Link to="/student/plan" className="btn-secondary">Back to Plan</Link>
            </div>
          </div>
        </div>
      </StudentLayout>
    )
  }

  // ── PRACTICE ───────────────────────────────────────────────────────────────
  if (!q) return (
    <StudentLayout>
      <div className="text-center py-20">
        <p className="text-gray-500">Loading questions…</p>
      </div>
    </StudentLayout>
  )

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto animate-in">
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{info.emoji} {info.title}</span>
            <span className="text-sm text-gray-500">{currentIdx + 1} / {questions.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-2 bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentIdx / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Question {currentIdx + 1}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              q.difficulty === 'EASY' ? 'bg-success-100 text-success-700' :
              q.difficulty === 'HARD' ? 'bg-danger-100 text-danger-700' :
              'bg-warning-100 text-warning-700'
            }`}>{q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}</span>
          </div>

          <p className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed mb-6">
            {q.questionText}
          </p>

          <div className="space-y-2.5 mb-5">
            {(q.options ?? []).map(opt => {
              let style = 'border-gray-200 bg-white text-gray-700 hover:border-brand-400 hover:bg-brand-50'
              if (confirmed) {
                if (opt === q.correctAnswer) style = 'border-success-400 bg-success-50 text-success-800'
                else if (opt === selected) style = 'border-danger-400 bg-danger-50 text-danger-700'
                else style = 'border-gray-100 bg-gray-50 text-gray-400'
              } else if (opt === selected) {
                style = 'border-brand-500 bg-brand-50 text-brand-800'
              }
              return (
                <button key={opt} onClick={() => !confirmed && setSelected(opt)} disabled={confirmed}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${style}`}>
                  <span className="flex items-center gap-2">
                    {confirmed && opt === q.correctAnswer && <span className="text-success-600">✓</span>}
                    {confirmed && opt === selected && opt !== q.correctAnswer && <span className="text-danger-600">✗</span>}
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Hint — Lemi's guided approach */}
          {!confirmed && (
            <div className="mb-4">
              {showHint ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
                  <p className="font-semibold mb-1">💡 Hint {hintLevel} of 3</p>
                  <p>{getHint()}</p>
                  {hintLevel < 3 && (
                    <button onClick={handleHint} className="mt-2 text-xs text-amber-700 underline">
                      Need another hint?
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={handleHint} className="text-sm text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1.5">
                  <span>💡</span> Need a hint?
                </button>
              )}
            </div>
          )}

          {confirmed && (
            <div className={`mb-5 p-4 rounded-xl text-sm animate-in ${
              selected === q.correctAnswer
                ? 'bg-success-50 border border-success-200 text-success-800'
                : 'bg-danger-50 border border-danger-200 text-danger-800'
            }`}>
              <p className="font-semibold mb-1">
                {selected === q.correctAnswer ? '✅ Correct! Well done!' : '❌ Not quite this time.'}
              </p>
              <p className="leading-relaxed">{q.explanation}</p>
              {selected !== q.correctAnswer && (
                <p className="mt-2 font-medium">Correct answer: <span className="underline">{q.correctAnswer}</span></p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {!confirmed ? (
              <button onClick={handleConfirm} disabled={!selected} className="btn-primary flex-1 disabled:opacity-40">
                Check Answer
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary flex-1">
                {currentIdx < questions.length - 1 ? 'Next Question →' : 'See Results 🎉'}
              </button>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
