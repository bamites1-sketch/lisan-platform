import React, { useState, useEffect } from 'react'
import StudentLayout from '../../components/layout/StudentLayout'
import { useAuth } from '../../contexts/AuthContext'
import type { StudentProfile } from '../../types'

interface Question {
  id: number
  question: string
  options: string[]
  correctIndex: number
  timeSec: number
}

const ARENA_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Where did Kaldi first discover the coffee berries?',
    options: ['In the Simien Mountains', 'In the lush hills of Kaffa', 'Near Lake Tana', 'In the Danakil Depression'],
    correctIndex: 1,
    timeSec: 20,
  },
  {
    id: 2,
    question: 'What is the Amharic translation for "courage"?',
    options: ['ፍርሃት (fear)', 'ጀግንነት / ድፍረት (courage)', 'መተኛት (sleep)', 'ውሃ (water)'],
    correctIndex: 1,
    timeSec: 15,
  },
  {
    id: 3,
    question: 'Why did the monks boil the coffee beans?',
    options: ['To paint pictures', 'To stay alert for evening prayers', 'To feed their horses', 'To make bread'],
    correctIndex: 1,
    timeSec: 18,
  },
]

export default function ReadingBattleArena() {
  const { user } = useAuth()
  const profile = user?.profile as StudentProfile
  const studentName = profile?.firstName ? `${profile.firstName} ${profile.lastName?.[0] || ''}.` : 'Student'

  const [pinInput, setPinInput] = useState('')
  const [inBattle, setInBattle] = useState(false)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [battleFinished, setBattleFinished] = useState(false)

  const activeQ = ARENA_QUESTIONS[currentQIndex]

  // Join battle
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinInput.trim()) return
    setInBattle(true)
    setScore(0)
    setStreak(0)
    setCurrentQIndex(0)
    setBattleFinished(false)
    startRound()
  }

  const startRound = () => {
    setSelectedAnswer(null)
    setIsAnswered(false)
    setTimeLeft(activeQ.timeSec)
  }

  // Timer countdown
  useEffect(() => {
    if (!inBattle || isAnswered || battleFinished) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSelectAnswer(-1) // timed out
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [inBattle, isAnswered, battleFinished, currentQIndex])

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return
    setSelectedAnswer(index)
    setIsAnswered(true)

    const isCorrect = index === activeQ.correctIndex
    if (isCorrect) {
      const timeBonus = Math.round((timeLeft / activeQ.timeSec) * 500)
      const earned = 500 + timeBonus + streak * 100
      setScore((s) => s + earned)
      setStreak((st) => st + 1)
    } else {
      setStreak(0)
    }
  }

  const handleNext = () => {
    if (currentQIndex + 1 < ARENA_QUESTIONS.length) {
      setCurrentQIndex((i) => i + 1)
      startRound()
    } else {
      setBattleFinished(true)
    }
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* ── Banner ── */}
        <div className="bg-gradient-to-r from-[#1a3a2a] via-[#224b37] to-[#12281d] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#d4a017]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#d4a017]/20 border border-[#d4a017]/40 text-[#f3ca52] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                <span>🏆</span> Live Classroom Battle Arena
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Reading Comprehension Showdown
              </h1>
              <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
                Compete against your classmates in fast-paced timed reading challenges. Earn speed bonuses and climb the podium!
              </p>
            </div>

            {inBattle && (
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] text-white/60 uppercase block">Your Score</span>
                <span className="text-2xl font-black text-[#f3ca52] font-mono">{score}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Join View ── */}
        {!inBattle && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-lg mx-auto shadow-md text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
              🎮
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900">
                Join a Live Reading Battle
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-character room PIN displayed on your teacher's screen.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                placeholder="e.g. LISAN-742"
                maxLength={10}
                className="w-full text-center text-2xl font-mono font-black tracking-widest px-4 py-3.5 border-2 border-emerald-800/30 rounded-2xl outline-none focus:border-emerald-600 uppercase"
              />

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-700/20 hover:scale-[1.01] transition-all"
              >
                Enter Battle Arena 🚀
              </button>
            </form>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setPinInput('LISAN-CLASS')
                  setInBattle(true)
                  startRound()
                }}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
              >
                💡 Or try Demo Battle: "Kaldi and the Magic Coffee Beans"
              </button>
            </div>
          </div>
        )}

        {/* ── Live Question Arena ── */}
        {inBattle && !battleFinished && (
          <div className="space-y-6">
            {/* Round Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Question {currentQIndex + 1} of {ARENA_QUESTIONS.length}
                </span>
                {streak > 1 && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold animate-bounce">
                    🔥 {streak}x Streak!
                  </span>
                )}
              </div>

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${
                  timeLeft <= 5
                    ? 'border-red-500 text-red-600 bg-red-50 animate-ping'
                    : 'border-emerald-500 text-emerald-700 bg-emerald-50'
                }`}
              >
                {timeLeft}s
              </div>
            </div>

            {/* Question Text */}
            <div className="p-6 sm:p-8 bg-[#1a3a2a] text-white rounded-3xl shadow-lg text-center">
              <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                {activeQ.question}
              </h2>
            </div>

            {/* Answer Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeQ.options.map((opt, idx) => {
                const colors = [
                  'bg-red-500 hover:bg-red-600 text-white',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'bg-amber-500 hover:bg-amber-600 text-white',
                  'bg-emerald-600 hover:bg-emerald-700 text-white',
                ]
                const shapes = ['▲', '◆', '●', '■']
                const isSelected = selectedAnswer === idx
                const isCorrect = idx === activeQ.correctIndex

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectAnswer(idx)}
                    className={`p-5 rounded-2xl font-bold text-base sm:text-lg flex items-center gap-3 shadow-md transition-all text-left ${
                      colors[idx % 4]
                    } ${
                      isAnswered && isCorrect
                        ? 'ring-4 ring-emerald-300 scale-102 font-black'
                        : isAnswered && isSelected && !isCorrect
                        ? 'opacity-40 grayscale line-through'
                        : isAnswered
                        ? 'opacity-40'
                        : 'hover:scale-[1.02]'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-sm font-black flex-shrink-0">
                      {shapes[idx % 4]}
                    </span>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Feedback & Next Button */}
            {isAnswered && (
              <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in">
                <div className="flex items-center gap-3">
                  <span className="text-3xl flex-shrink-0">
                    {selectedAnswer === activeQ.correctIndex ? '🎉' : '💭'}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                      {selectedAnswer === activeQ.correctIndex
                        ? 'Brilliant! Correct Answer!'
                        : 'Keep going! Learning from mistakes makes you stronger!'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedAnswer === activeQ.correctIndex
                        ? `+${500 + Math.round((timeLeft / activeQ.timeSec) * 500)} points earned for speed!`
                        : `Correct answer was: "${activeQ.options[activeQ.correctIndex]}"`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap active:scale-98 text-center"
                >
                  {currentQIndex + 1 < ARENA_QUESTIONS.length ? 'Next Question →' : 'See Battle Results 🏆'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Results / Podium View ── */}
        {battleFinished && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-lg mx-auto shadow-xl text-center space-y-6 animate-in">
            <div className="text-5xl animate-bounce">🥇</div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Magnificent Reading Battle!
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                You showed incredible comprehension and quick reading recall.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">
                Final Battle Score
              </span>
              <span className="text-4xl font-black text-emerald-950 font-mono">
                {score} pts
              </span>
              <span className="block text-xs text-emerald-700 mt-1 font-semibold">
                🥈 Ranked 2nd in Class Showdown!
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setInBattle(false)
                  setBattleFinished(false)
                  setPinInput('')
                }}
                className="px-6 py-3 bg-[#1a3a2a] hover:bg-[#12281d] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Join Another Battle
              </button>
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  )
}
