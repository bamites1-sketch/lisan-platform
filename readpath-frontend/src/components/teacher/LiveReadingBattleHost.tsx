import React, { useState, useEffect, useRef } from 'react'

interface BattleQuestion {
  id: number
  question: string
  options: string[]
  correctIndex: number
  timeSec: number
  explanation: string
}

interface StudentCompetitor {
  id: string
  name: string
  avatar: string
  score: number
  streak: number
  lastAnswerCorrect?: boolean
  answeredThisRound?: boolean
}

const BATTLE_PASSAGES = [
  {
    id: 'battle-coffee',
    title: 'Kaldi and the Magic Coffee Beans (የቡናው ተአምር)',
    grade: 'Grade 4-6',
    questions: [
      {
        id: 1,
        question: 'Where did Kaldi first discover the coffee berries?',
        options: ['In the Simien Mountains', 'In the lush hills of Kaffa', 'Near Lake Tana', 'In the Danakil Depression'],
        correctIndex: 1,
        timeSec: 20,
        explanation: 'The ancient legend states coffee was discovered by Kaldi in the lush highlands of Kaffa.',
      },
      {
        id: 2,
        question: 'What made Kaldi realize the berries had special energy?',
        options: ['The birds sang louder', 'His goats started jumping and dancing', 'The water turned green', 'The wind stopped blowing'],
        correctIndex: 1,
        timeSec: 15,
        explanation: 'Kaldi observed his goats jumping and dancing with incredible vitality after eating the berries.',
      },
      {
        id: 3,
        question: 'What is the Amharic translation for "discover"?',
        options: ['መሸጥ (to sell)', 'ማግኘት / ማወቅ (to discover)', 'መተኛት (to sleep)', 'መሮጥ (to run)'],
        correctIndex: 1,
        timeSec: 15,
        explanation: 'In the Lisan bilingual dictionary, "discover" is translated as "ማግኘት ወይም ማወቅ".',
      },
      {
        id: 4,
        question: 'Who boiled the beans into the first fragrant coffee brew?',
        options: ['Soldiers in Gondar', 'The village monks at the monastery', 'Foreign merchants in Harar', 'A palace chef'],
        correctIndex: 1,
        timeSec: 20,
        explanation: 'The wise monks boiled the beans into a dark brew to stay awake during long evening prayers.',
      },
    ],
  },
  {
    id: 'battle-simien',
    title: 'The King of the Simien Peaks (ዋሊያ አይቤክስ)',
    grade: 'Grade 5-7',
    questions: [
      {
        id: 1,
        question: 'Why is the Walia ibex considered a unique Ethiopian national treasure?',
        options: ['It can fly', 'It is found nowhere else on earth', 'It lives underwater', 'It only eats bamboo'],
        correctIndex: 1,
        timeSec: 20,
        explanation: 'The Walia ibex is endemic to Ethiopia, living solely in the high precipitous cliffs of the Simien Mountains.',
      },
      {
        id: 2,
        question: 'Which word means "the strength of mind to face danger without fear"?',
        options: ['Curiosity', 'Courage (ጀግንነት)', 'Harvest', 'Whisper'],
        correctIndex: 1,
        timeSec: 15,
        explanation: 'Courage (ጀግንነት/ድፍረት) is the ability to confront difficulty or danger with mental bravery.',
      },
      {
        id: 3,
        question: 'What protects the Walia population from danger today?',
        options: ['Deep snow', 'Dedicated wildlife park rangers', 'Underground caves', 'Tall eucalyptus forests'],
        correctIndex: 1,
        timeSec: 15,
        explanation: 'Tireless park rangers patrol the Simien ridge daily to protect the species from poachers.',
      },
    ],
  },
]

const INITIAL_STUDENTS: StudentCompetitor[] = [
  { id: 's1', name: 'Bethlehem T.', avatar: '🌸', score: 0, streak: 0 },
  { id: 's2', name: 'Abebe K.', avatar: '⚡', score: 0, streak: 0 },
  { id: 's3', name: 'Dawit M.', avatar: '🦁', score: 0, streak: 0 },
  { id: 's4', name: 'Selam A.', avatar: '⭐', score: 0, streak: 0 },
  { id: 's5', name: 'Yohannes G.', avatar: '🚀', score: 0, streak: 0 },
  { id: 's6', name: 'Tsion W.', avatar: '🌺', score: 0, streak: 0 },
]

export default function LiveReadingBattleHost() {
  const [battleState, setBattleState] = useState<'SETUP' | 'LOBBY' | 'QUESTION' | 'REVEAL' | 'PODIUM'>('SETUP')
  const [selectedPassage, setSelectedPassage] = useState(BATTLE_PASSAGES[0])
  const [roomPin] = useState(() => `LISAN-${Math.floor(100 + Math.random() * 900)}`)
  const [students, setStudents] = useState<StudentCompetitor[]>(INITIAL_STUDENTS)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [timerLeft, setTimerLeft] = useState(20)
  const timerIntervalRef = useRef<any>(null)

  const activeQuestion: BattleQuestion = selectedPassage.questions[currentQuestionIdx]

  // Add simulated student to room lobby
  const addStudent = () => {
    const names = ['Kalkidan B.', 'Natnael Z.', 'Hanna D.', 'Henok B.', 'Rahel F.', 'Ermias S.']
    const avatars = ['🦊', '🦅', '🎯', '🔥', '💎', '👑']
    const unused = names.find((n) => !students.some((s) => s.name === n)) || `Student ${students.length + 1}`
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]
    setStudents((prev) => [...prev, { id: `s-${Date.now()}`, name: unused, avatar: randomAvatar, score: 0, streak: 0 }])
  }

  // Start question timer
  const startQuestionRound = () => {
    setBattleState('QUESTION')
    const totalTime = activeQuestion.timeSec
    setTimerLeft(totalTime)

    // Reset student answered status
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        answeredThisRound: false,
      }))
    )

    clearInterval(timerIntervalRef.current)
    timerIntervalRef.current = setInterval(() => {
      setTimerLeft((t) => {
        if (t <= 1) {
          clearInterval(timerIntervalRef.current)
          handleRevealAnswers()
          return 0
        }

        // Simulate student answers arriving randomly
        if (Math.random() < 0.6) {
          setStudents((curr) => {
            const pending = curr.filter((s) => !s.answeredThisRound)
            if (pending.length === 0) return curr
            const randomPending = pending[Math.floor(Math.random() * pending.length)]
            const isCorrect = Math.random() < 0.78 // 78% accuracy rate
            const points = isCorrect ? Math.round(500 + (t / totalTime) * 500) : 0

            return curr.map((s) =>
              s.id === randomPending.id
                ? {
                    ...s,
                    answeredThisRound: true,
                    lastAnswerCorrect: isCorrect,
                    streak: isCorrect ? s.streak + 1 : 0,
                    score: s.score + points + (isCorrect && s.streak > 1 ? 150 : 0),
                  }
                : s
            )
          })
        }

        return t - 1
      })
    }, 1000)
  }

  const handleRevealAnswers = () => {
    clearInterval(timerIntervalRef.current)
    // Mark remaining students as answered
    setStudents((prev) =>
      prev.map((s) =>
        s.answeredThisRound
          ? s
          : { ...s, answeredThisRound: true, lastAnswerCorrect: false, streak: 0 }
      )
    )
    setBattleState('REVEAL')
  }

  const handleNextQuestion = () => {
    if (currentQuestionIdx + 1 < selectedPassage.questions.length) {
      setCurrentQuestionIdx((i) => i + 1)
      startQuestionRound()
    } else {
      setBattleState('PODIUM')
    }
  }

  const handleResetBattle = () => {
    clearInterval(timerIntervalRef.current)
    setBattleState('SETUP')
    setCurrentQuestionIdx(0)
    setStudents(INITIAL_STUDENTS.map((s) => ({ ...s, score: 0, streak: 0, answeredThisRound: false })))
  }

  // Sorted leaderboard
  const leaderboard = [...students].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>🏆</span> Classroom Live Battle Mode
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">
            Kahoot-Style Live Reading Showdown
          </h2>
          <p className="text-xs text-gray-500">
            Host live timed reading battles with speed scoring, accuracy streaks, and real-time classroom leaderboards.
          </p>
        </div>

        {battleState !== 'SETUP' && (
          <div className="flex items-center gap-3">
            <div className="bg-[#1a3a2a] text-white px-4 py-2 rounded-2xl border border-[#d4a017]/40 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-[#d4a017] block">Room Battle PIN</span>
              <span className="text-xl font-black tracking-widest">{roomPin}</span>
            </div>
            <button
              type="button"
              onClick={handleResetBattle}
              className="text-xs text-gray-400 hover:text-red-600 px-2 py-1"
            >
              Exit Battle
            </button>
          </div>
        )}
      </div>

      {/* ── State 1: Battle Setup ── */}
      {battleState === 'SETUP' && (
        <div className="py-8 space-y-6 max-w-2xl mx-auto">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
              1. Select Reading Passage for the Battle
            </label>
            <div className="space-y-3">
              {BATTLE_PASSAGES.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPassage(p)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPassage.id === p.id
                      ? 'border-[#1a3a2a] bg-emerald-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{p.title}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {p.grade}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.questions.length} Timed Comprehension & Vocabulary Questions
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              ⚡ Students will join using room code: <strong className="text-emerald-900">{roomPin}</strong>
            </div>

            <button
              type="button"
              onClick={() => setBattleState('LOBBY')}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-700/20 hover:scale-[1.02] transition-all"
            >
              Open Battle Room Lobby →
            </button>
          </div>
        </div>
      )}

      {/* ── State 2: Lobby ── */}
      {battleState === 'LOBBY' && (
        <div className="py-8 space-y-6 text-center">
          <div className="max-w-md mx-auto p-6 bg-gradient-to-b from-[#1a3a2a] to-[#12281d] rounded-3xl text-white shadow-xl">
            <span className="text-xs font-bold text-[#d4a017] uppercase tracking-widest block mb-1">
              Join at lisan-platform.vercel.app/student/reading-battle
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-widest text-[#f3ca52] my-2">
              {roomPin}
            </div>
            <p className="text-xs text-white/70">
              Waiting for students to join the classroom arena…
            </p>
          </div>

          {/* Student Grid */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Connected Students ({students.length})
              </span>
              <button
                type="button"
                onClick={addStudent}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
              >
                + Add Student Avatar
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-2.5 shadow-sm animate-in"
                >
                  <span className="text-2xl">{student.avatar}</span>
                  <span className="text-xs font-bold text-gray-800 truncate">{student.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={startQuestionRound}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-700/30 hover:scale-105 transition-all"
            >
              🚀 Launch Round 1 (Start Battle!)
            </button>
          </div>
        </div>
      )}

      {/* ── State 3: Question Active & State 4: Reveal ── */}
      {(battleState === 'QUESTION' || battleState === 'REVEAL') && (
        <div className="py-6 space-y-6 max-w-4xl mx-auto">
          
          {/* Progress & Timer Bar */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Question {currentQuestionIdx + 1} of {selectedPassage.questions.length}
            </span>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {students.filter((s) => s.answeredThisRound).length} / {students.length} Answered
              </span>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-4 transition-colors ${
                  timerLeft <= 5
                    ? 'border-red-500 text-red-600 bg-red-50 animate-ping'
                    : 'border-emerald-500 text-emerald-700 bg-emerald-50'
                }`}
              >
                {timerLeft}s
              </div>
            </div>
          </div>

          {/* Question Box */}
          <div className="p-6 sm:p-8 bg-[#1a3a2a] text-white rounded-3xl shadow-lg text-center">
            <h3 className="text-xl sm:text-2xl font-bold leading-snug">
              {activeQuestion.question}
            </h3>
          </div>

          {/* 4 Colored Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeQuestion.options.map((opt, oIdx) => {
              const colors = [
                'bg-red-500 hover:bg-red-600 text-white border-red-600',
                'bg-blue-600 hover:bg-blue-700 text-white border-blue-700',
                'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
                'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
              ]
              const shapes = ['▲', '◆', '●', '■']
              const isCorrect = oIdx === activeQuestion.correctIndex
              const isReveal = battleState === 'REVEAL'

              return (
                <div
                  key={oIdx}
                  className={`p-4 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-3 shadow-md transition-all ${
                    colors[oIdx % 4]
                  } ${
                    isReveal && isCorrect
                      ? 'ring-4 ring-emerald-300 scale-102 font-black'
                      : isReveal
                      ? 'opacity-40 grayscale'
                      : ''
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-sm font-black">
                    {shapes[oIdx % 4]}
                  </span>
                  <span>{opt}</span>
                </div>
              )
            })}
          </div>

          {/* Explanation on Reveal */}
          {battleState === 'REVEAL' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">
                  💡 Teacher Insight & Explanation
                </span>
                <p className="text-sm text-emerald-950 font-medium">
                  {activeQuestion.explanation}
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm"
              >
                {currentQuestionIdx + 1 < selectedPassage.questions.length
                  ? 'Next Question →'
                  : 'View Battle Podium 🏆'}
              </button>
            </div>
          )}

          {/* Mini Live Scoreboard */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Live Round Leaderboard
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {leaderboard.slice(0, 6).map((student, rank) => (
                <div
                  key={student.id}
                  className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-gray-400 w-4">#{rank + 1}</span>
                    <span>{student.avatar}</span>
                    <span className="font-semibold text-gray-800 truncate">{student.name}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 ml-2">{student.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── State 5: Podium & Trophy Ceremony ── */}
      {battleState === 'PODIUM' && (
        <div className="py-8 text-center space-y-8 animate-in">
          <div>
            <div className="text-5xl animate-bounce">🏆</div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
              Battle Complete! Class Champions
            </h3>
            <p className="text-xs text-gray-500">
              Outstanding reading speed, comprehension, and vocabulary mastery!
            </p>
          </div>

          {/* 3-Step Podium */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-xl mx-auto pt-6 pb-2">
            
            {/* 2nd Place (Silver) */}
            {leaderboard[1] && (
              <div className="flex-1 flex flex-col items-center">
                <span className="text-3xl mb-1">{leaderboard[1].avatar}</span>
                <span className="font-bold text-xs sm:text-sm text-gray-800 truncate max-w-[100px]">
                  {leaderboard[1].name}
                </span>
                <span className="text-[11px] font-mono text-gray-500">{leaderboard[1].score} pts</span>
                <div className="w-full bg-slate-200 h-28 rounded-t-2xl flex flex-col items-center justify-center shadow-inner mt-2 border-t-4 border-slate-400">
                  <span className="text-2xl font-black text-slate-600">2nd</span>
                  <span className="text-xs font-semibold text-slate-500">🥈 Silver</span>
                </div>
              </div>
            )}

            {/* 1st Place (Gold) */}
            {leaderboard[0] && (
              <div className="flex-1 flex flex-col items-center">
                <span className="text-4xl mb-1">{leaderboard[0].avatar}</span>
                <span className="font-black text-sm sm:text-base text-gray-900 truncate max-w-[120px]">
                  {leaderboard[0].name}
                </span>
                <span className="text-xs font-mono font-bold text-amber-600">{leaderboard[0].score} pts</span>
                <div className="w-full bg-amber-300 h-40 rounded-t-2xl flex flex-col items-center justify-center shadow-lg mt-2 border-t-4 border-amber-500">
                  <span className="text-3xl font-black text-amber-900">1st</span>
                  <span className="text-xs font-bold text-amber-800">🥇 Champion</span>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {leaderboard[2] && (
              <div className="flex-1 flex flex-col items-center">
                <span className="text-3xl mb-1">{leaderboard[2].avatar}</span>
                <span className="font-bold text-xs sm:text-sm text-gray-800 truncate max-w-[100px]">
                  {leaderboard[2].name}
                </span>
                <span className="text-[11px] font-mono text-gray-500">{leaderboard[2].score} pts</span>
                <div className="w-full bg-amber-100 h-20 rounded-t-2xl flex flex-col items-center justify-center shadow-inner mt-2 border-t-4 border-amber-600/40">
                  <span className="text-xl font-black text-amber-800">3rd</span>
                  <span className="text-xs font-semibold text-amber-700">🥉 Bronze</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleResetBattle}
              className="px-6 py-3 bg-[#1a3a2a] hover:bg-[#12281d] text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              🔄 Host Another Battle
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
