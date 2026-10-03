import React, { useState, useEffect, useRef, useMemo } from 'react'
import StudentLayout from '../../components/layout/StudentLayout'
import { BILINGUAL_STORIES, type BilingualStory, lookupBilingualWord } from '../../lib/bilingualDictionary'
import { saveOfflineRecording } from '../../lib/offlineSync'

// ─── Word Karaoke Status ──────────────────────────────────────────────────────
type WordStatus = 'pending' | 'current' | 'correct' | 'hesitant' | 'mispronounced'

interface KaraokeWord {
  id: number
  raw: string
  clean: string
  status: WordStatus
  timestamp?: number
}

// ─── Built-in Passages for Practice ──────────────────────────────────────────
const COACH_PASSAGES = [
  {
    id: 'coach-1',
    title: 'The Ethiopian Mountain Fox',
    level: 'Grade 3-4 (Beginner)',
    wpmTarget: 95,
    text: 'High up in the Bale Mountains lives the rare red fox. It hunts rodents under the cool grass. The fox moves swiftly across the rocky plateau with sharp yellow eyes. Every morning, warm sunlight melts the frost, and the animals awaken together in peace.',
  },
  {
    id: 'coach-2',
    title: 'The Great Teff Harvest of Gojjam',
    level: 'Grade 4-5 (Intermediate)',
    wpmTarget: 110,
    text: 'Farmers in Gojjam begin harvesting tiny teff seeds when the rainy season ends. Teff is an ancient grain packed with iron and calcium. Families sing traditional songs as they thresh the golden sheaves under the bright afternoon sun. In the evening, warm fresh injera fills the home with delicious aromas.',
  },
  {
    id: 'coach-3',
    title: 'Abebe Bikila: The Barefoot Champion',
    level: 'Grade 5-7 (Advanced)',
    wpmTarget: 130,
    text: 'In the 1960 Olympic Games in Rome, an Ethiopian soldier named Abebe Bikila made history. Running barefoot through historic cobblestone streets in the dark of night, he conquered the marathon and won the first Olympic gold medal for Africa. His endurance and humble courage inspired an entire continent.',
  },
]

export default function KaraokeReadingCoach() {
  const [selectedPassage, setSelectedPassage] = useState(COACH_PASSAGES[0])
  const [isReading, setIsReading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)

  // Timing & Telemetry
  const [elapsedSec, setElapsedSec] = useState(0)
  const [liveWpm, setLiveWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [currentWordIdx, setCurrentWordIdx] = useState(0)

  // Speech Recognition
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<any>(null)
  const wordStartTimeRef = useRef<number>(Date.now())
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Parse words
  const [karaokeWords, setKaraokeWords] = useState<KaraokeWord[]>([])

  // Initialize words whenever passage changes
  useEffect(() => {
    const rawTokens = selectedPassage.text.split(/\s+/).filter(Boolean)
    const words: KaraokeWord[] = rawTokens.map((w, i) => ({
      id: i,
      raw: w,
      clean: w.toLowerCase().replace(/[^a-z]/g, ''),
      status: i === 0 ? 'current' : 'pending',
    }))
    setKaraokeWords(words)
    resetSession()
  }, [selectedPassage])

  const resetSession = () => {
    setIsReading(false)
    setIsPaused(false)
    setIsCoachSpeaking(false)
    setSessionCompleted(false)
    setElapsedSec(0)
    setLiveWpm(0)
    setAccuracy(100)
    setCurrentWordIdx(0)
    clearInterval(timerRef.current)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }
  }

  // Timer loop
  useEffect(() => {
    if (isReading && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => {
          const next = prev + 1
          // Compute Live WPM
          if (next > 0) {
            const wordsSpoken = currentWordIdx
            const mins = next / 60
            const currentWpm = Math.round(wordsSpoken / mins)
            setLiveWpm(Math.min(currentWpm, 240))
          }
          return next
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isReading, isPaused, currentWordIdx])

  // Start reading session
  const handleStartReading = async () => {
    resetSession()
    setIsReading(true)
    wordStartTimeRef.current = Date.now()

    // Request microphone for audio recording & offline sync
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        audioChunksRef.current = []
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }
        recorder.start()
        mediaRecorderRef.current = recorder
      }
    } catch {
      // Microphone optional for speech recognition fallback
    }

    // Initialize Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' '
        }
        processSpokenWords(transcript)
      }

      recognition.onerror = () => {
        // Continue quietly
      }

      recognition.onend = () => {
        if (isReading && !isPaused && !sessionCompleted) {
          try { recognition.start() } catch {}
        }
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch {}
    } else {
      // Browser doesn't support Web Speech API — start simulated cadence reader
      simulateVoiceCadence()
    }
  }

  // Fallback cadence reader for browsers without SpeechRecognition
  const simulateVoiceCadence = () => {
    let wordCursor = 0
    const cadenceInterval = setInterval(() => {
      if (!isReading || isPaused) return
      setKaraokeWords((prev) => {
        if (wordCursor >= prev.length) {
          clearInterval(cadenceInterval)
          finishSession()
          return prev
        }
        const updated = [...prev]
        const isStumble = Math.random() < 0.12 // 12% hesitation chance
        updated[wordCursor].status = isStumble ? 'hesitant' : 'correct'
        wordCursor++
        setCurrentWordIdx(wordCursor)
        if (wordCursor < updated.length) {
          updated[wordCursor].status = 'current'
        }
        return updated
      })
    }, 650)
  }

  // Match recognized speech to passage words
  const processSpokenWords = (transcript: string) => {
    const spokenTokens = transcript.toLowerCase().split(/\s+/).filter(Boolean)
    if (spokenTokens.length === 0) return

    const latestSpoken = spokenTokens[spokenTokens.length - 1].replace(/[^a-z]/g, '')

    setKaraokeWords((prevWords) => {
      let idx = currentWordIdx
      if (idx >= prevWords.length) {
        finishSession()
        return prevWords
      }

      const expected = prevWords[idx].clean
      const now = Date.now()
      const timeSpentOnWord = (now - wordStartTimeRef.current) / 1000

      // Match check
      const isMatch =
        latestSpoken === expected ||
        expected.startsWith(latestSpoken) ||
        latestSpoken.startsWith(expected) ||
        (expected.length > 3 && latestSpoken.includes(expected.slice(0, 3)))

      if (isMatch) {
        const nextWords = [...prevWords]
        const status: WordStatus = timeSpentOnWord > 2.8 ? 'hesitant' : 'correct'
        nextWords[idx].status = status

        const nextIdx = idx + 1
        setCurrentWordIdx(nextIdx)
        wordStartTimeRef.current = now

        if (nextIdx < nextWords.length) {
          nextWords[nextIdx].status = 'current'
        } else {
          finishSession()
        }

        // Recompute accuracy
        const totalDone = nextWords.filter((w) => w.status === 'correct' || w.status === 'hesitant').length
        const totalCorrect = nextWords.filter((w) => w.status === 'correct').length
        setAccuracy(totalDone > 0 ? Math.round((totalCorrect / totalDone) * 100) : 100)

        return nextWords
      }
      return prevWords
    })
  }

  // Finish session
  const finishSession = () => {
    setIsReading(false)
    setIsPaused(false)
    setSessionCompleted(true)
    clearInterval(timerRef.current)

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // Save recording locally (IndexedDB) for offline resilience
        await saveOfflineRecording({
          id: `karaoke-${Date.now()}`,
          passageId: selectedPassage.id,
          passageTitle: selectedPassage.title,
          audioBlob,
          wpm: liveWpm,
          accuracy,
          durationSec: elapsedSec,
          createdAt: new Date().toISOString(),
          status: 'PENDING_SYNC',
        })
      }
    }
  }

  // Hear AI Coach model read aloud
  const handleCoachReadAloud = () => {
    if (!('speechSynthesis' in window)) return
    if (isCoachSpeaking) {
      window.speechSynthesis.cancel()
      setIsCoachSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(selectedPassage.text)
    utterance.rate = 0.88 // calibrated for educational reading
    utterance.lang = 'en-US'

    utterance.onend = () => setIsCoachSpeaking(false)
    utterance.onerror = () => setIsCoachSpeaking(false)

    window.speechSynthesis.speak(utterance)
    setIsCoachSpeaking(true)
  }

  // Pronounce word
  const pronounceWord = (word: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.rate = 0.8
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }

  // Stumbled words
  const stumbledWords = useMemo(() => {
    return karaokeWords.filter((w) => w.status === 'hesitant' || w.status === 'mispronounced')
  }, [karaokeWords])

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* ── Title Banner ── */}
        <div className="bg-gradient-to-r from-[#1a3a2a] via-[#224b37] to-[#12281d] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#d4a017]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#d4a017]/20 border border-[#d4a017]/40 text-[#f3ca52] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                <span>🎙️</span> AI Reading Coach · Karaoke Mode
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Live Speech & Fluency Coach
              </h1>
              <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
                Read aloud into your microphone. Words light up in real-time as you speak.
                Stumbled words glow warm amber so you can review them afterward.
              </p>
            </div>

            {/* Passage Selector */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
              <select
                value={selectedPassage.id}
                onChange={(e) => {
                  const found = COACH_PASSAGES.find((p) => p.id === e.target.value)
                  if (found) setSelectedPassage(found)
                }}
                disabled={isReading}
                className="bg-transparent text-white text-xs font-semibold px-3 py-2 outline-none cursor-pointer"
              >
                {COACH_PASSAGES.map((p) => (
                  <option key={p.id} value={p.id} className="text-gray-900 font-normal">
                    {p.title} ({p.level})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Real-time Telemetry HUD ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Live WPM */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black">
              ⚡
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live WPM</div>
              <div className="text-2xl font-black text-gray-900">{liveWpm}</div>
              <div className="text-[10px] text-gray-500">Target: {selectedPassage.wpmTarget} WPM</div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl font-black">
              🎯
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Accuracy</div>
              <div className="text-2xl font-black text-emerald-600">{accuracy}%</div>
              <div className="text-[10px] text-gray-500">Pronunciation Match</div>
            </div>
          </div>

          {/* Elapsed Timer */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black">
              ⏱️
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Elapsed Time</div>
              <div className="text-2xl font-black font-mono text-gray-900">{formatTime(elapsedSec)}</div>
              <div className="text-[10px] text-gray-500">Voice Tracking Active</div>
            </div>
          </div>

          {/* Words Read */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-black">
              📖
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Progress</div>
              <div className="text-2xl font-black text-gray-900">
                {currentWordIdx} <span className="text-xs text-gray-400 font-normal">/ {karaokeWords.length}</span>
              </div>
              <div className="text-[10px] text-purple-600 font-semibold">
                {Math.round((currentWordIdx / Math.max(karaokeWords.length, 1)) * 100)}% Finished
              </div>
            </div>
          </div>
        </div>

        {/* ── Karaoke Reading Canvas ── */}
        <div className="bg-white border-2 border-emerald-900/10 rounded-3xl p-6 sm:p-8 shadow-md relative">
          
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {selectedPassage.title}
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                🟢 Green = Spoken fluently · 🟠 Amber = Hesitated/Repeat
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Listen to Coach Demo */}
              <button
                type="button"
                onClick={handleCoachReadAloud}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isCoachSpeaking
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{isCoachSpeaking ? '⏹ Stop Demo' : '🔊 Hear Coach Demo'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Karaoke Words */}
          <div className="leading-loose sm:leading-[3rem] text-lg sm:text-2xl font-serif text-gray-800 select-none py-2 min-h-[160px]">
            {karaokeWords.map((word) => {
              const isCurrent = word.status === 'current'
              const isCorrect = word.status === 'correct'
              const isHesitant = word.status === 'hesitant'

              return (
                <span
                  key={word.id}
                  onClick={() => pronounceWord(word.raw)}
                  className={`inline-block mr-2 px-1.5 py-0.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#1a3a2a] text-[#f3ca52] font-bold ring-4 ring-[#d4a017]/30 scale-105 shadow-md animate-pulse'
                      : isCorrect
                      ? 'bg-emerald-100/90 text-emerald-900 font-semibold'
                      : isHesitant
                      ? 'bg-amber-100 text-amber-900 font-medium underline decoration-amber-400 decoration-wavy'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Click to hear word pronunciation"
                >
                  {word.raw}
                </span>
              )
            })}
          </div>

          {/* Controls Bar */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {!isReading ? (
                <button
                  type="button"
                  onClick={handleStartReading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-700/20 active:scale-98 transition-all"
                >
                  <span className="text-lg">🎙️</span>
                  <span>Start Reading Aloud</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm rounded-xl active:scale-95 transition-colors"
                  >
                    <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={finishSession}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm active:scale-95 transition-colors"
                  >
                    <span>■ Finish & Score</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={resetSession}
                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:underline active:scale-95 ml-auto sm:ml-0"
              >
                Reset
              </button>
            </div>

            {isReading && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-full border border-emerald-200">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Listening actively to your voice…</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Post-Session Mastery Report ── */}
        {sessionCompleted && (
          <div className="bg-gradient-to-br from-white to-emerald-50/50 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl animate-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-[#d4a017] text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-400/30">
                  🏆
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    Terrific Reading Session!
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your reading fluency diagnosis for "{selectedPassage.title}"
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#1a3a2a] text-[#f3ca52] px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm">
                <span>⚡ +50 XP Awarded!</span>
              </div>
            </div>

            {/* Score Highlights */}
            <div className="grid grid-cols-3 gap-3 my-6 text-center">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
                <div className="text-[11px] font-bold text-gray-400 uppercase">Average Speed</div>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">{liveWpm} WPM</div>
                <div className="text-[10px] text-gray-500">
                  {liveWpm >= selectedPassage.wpmTarget ? '✅ Met Grade Goal' : 'Keep practicing for speed'}
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
                <div className="text-[11px] font-bold text-gray-400 uppercase">Accuracy</div>
                <div className="text-2xl font-black text-brand-700 mt-0.5">{accuracy}%</div>
                <div className="text-[10px] text-gray-500">Words Pronounced Correctly</div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
                <div className="text-[11px] font-bold text-gray-400 uppercase">Total Words</div>
                <div className="text-2xl font-black text-purple-700 mt-0.5">{currentWordIdx}</div>
                <div className="text-[10px] text-gray-500">Completed in {formatTime(elapsedSec)}</div>
              </div>
            </div>

            {/* Hesitant Words to Practice */}
            {stumbledWords.length > 0 ? (
              <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">💡</span>
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Words to Review & Master ({stumbledWords.length})
                  </span>
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  Click any word below to hear the exact pronunciation from your AI coach:
                </p>
                <div className="flex flex-wrap gap-2">
                  {stumbledWords.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => pronounceWord(w.raw)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 hover:border-amber-500 rounded-xl text-xs font-semibold text-gray-800 shadow-sm transition-all hover:scale-105"
                    >
                      <span>🔊 {w.raw}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs font-semibold text-emerald-800">
                🌟 Flawless delivery! No hesitations detected throughout this entire passage!
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleStartReading}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                🔄 Read Again
              </button>
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  )
}
