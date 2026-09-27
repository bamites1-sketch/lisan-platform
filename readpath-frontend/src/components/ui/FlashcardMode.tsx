import React, { useState, useEffect } from 'react'

export interface FlashcardItem {
  id: string
  word: string
  pos?: string // part of speech
  definition: string
  amharic?: string
  oromo?: string
  example?: string
  phonetic?: string
  difficulty?: string
}

// ─── Default rich vocabulary deck for Ethiopian literacy ───────────────────────
const DEFAULT_VOCABULARY_DECK: FlashcardItem[] = [
  {
    id: 'v1',
    word: 'Magnificent',
    pos: 'adjective',
    phonetic: '/mæɡˈnɪf.ɪ.sənt/',
    definition: 'Extremely beautiful, elaborate, or impressive; grand in scale.',
    amharic: 'ድንቅ፣ ግሩም፣ እጅግ የሚያምር',
    oromo: 'Baredaa, ajaa\'ibsiisaa',
    example: 'The magnificent peaks of Mount Ras Dashen rose into the clouds.',
    difficulty: 'Grade 4–6',
  },
  {
    id: 'v2',
    word: 'Harvest',
    pos: 'noun / verb',
    phonetic: '/ˈhɑː.vɪst/',
    definition: 'The time of year when crops are cut and collected from the fields.',
    amharic: 'መከር፣ እህል መሰብሰብ',
    oromo: 'Midhaan sassaabuu',
    example: 'Families gather with joy to celebrate the golden wheat harvest.',
    difficulty: 'Grade 3–5',
  },
  {
    id: 'v3',
    word: 'Curiosity',
    pos: 'noun',
    phonetic: '/ˌkjʊə.riˈɒs.ə.ti/',
    definition: 'A strong eagerness to explore, know, and understand new things.',
    amharic: 'የማወቅ ጉጉት፣ ማወቅ መፈለግ',
    oromo: 'Beekuuf fedhii guddaa qabaachuu',
    example: 'Her curiosity led her to read every science book in the library.',
    difficulty: 'Grade 4–7',
  },
  {
    id: 'v4',
    word: 'Perseverance',
    pos: 'noun',
    phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
    definition: 'Continuing to try hard even when something is very difficult.',
    amharic: 'ጽናት፣ አለመታከት፣ ጥረት',
    oromo: 'Cimina, kutannoo',
    example: 'With daily perseverance, Abebe learned to read fluently.',
    difficulty: 'Grade 5–8',
  },
  {
    id: 'v5',
    word: 'Ancient',
    pos: 'adjective',
    phonetic: '/ˈeɪn.ʃənt/',
    definition: 'Belonging to a period of history thousands of years in the past.',
    amharic: 'ጥንታዊ፣ የቀደመ ታሪክ ያለው',
    oromo: 'Durii, kan bara dheeraa duraa',
    example: 'Axum is home to ancient stone obelisks and rich heritage.',
    difficulty: 'Grade 3–6',
  },
  {
    id: 'v6',
    word: 'Fertile',
    pos: 'adjective',
    phonetic: '/ˈfɜː.taɪl/',
    definition: 'Land or soil that produces abundant vegetation and healthy crops.',
    amharic: 'ለም፣ ለምለም (መሬት)',
    oromo: 'Dachee gabbattuu',
    example: 'The fertile soil near Lake Tana produces sweet fruits and teff.',
    difficulty: 'Grade 4–6',
  },
  {
    id: 'v7',
    word: 'Compassion',
    pos: 'noun',
    phonetic: '/kəmˈpæʃ.ən/',
    definition: 'Sympathetic pity and concern for the sufferings or misfortunes of others.',
    amharic: 'ርኅራኄ፣ ቸርነት፣ አሳቢነት',
    oromo: 'Garaa laafina, mararfannaa',
    example: 'Showing compassion to classmates makes the school a happier place.',
    difficulty: 'Grade 4–7',
  },
  {
    id: 'v8',
    word: 'Flourish',
    pos: 'verb',
    phonetic: '/ˈflʌr.ɪʃ/',
    definition: 'To grow or develop in a healthy, energetic, and successful way.',
    amharic: 'መለመን፣ መበልጸግ፣ ማበብ',
    oromo: 'Dagaaguu, biqiluu',
    example: 'With good care and water, the community garden began to flourish.',
    difficulty: 'Grade 5–8',
  },
]

interface FlashcardModeProps {
  customCards?: FlashcardItem[]
  onBackToQuiz?: () => void
  onComplete?: (masteredCount: number) => void
}

export default function FlashcardMode({
  customCards,
  onBackToQuiz,
  onComplete,
}: FlashcardModeProps) {
  const [deck, setDeck] = useState<FlashcardItem[]>(() => {
    return customCards && customCards.length > 0 ? customCards : DEFAULT_VOCABULARY_DECK
  })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set())
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set())
  const [isCompleted, setIsCompleted] = useState(false)

  const currentCard = deck[currentIdx]

  // Reset flip when switching cards
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIdx])

  // Pronounce word using Web Speech API
  const pronounce = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.85
      u.lang = 'en-US'
      window.speechSynthesis.speak(u)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        setIsFlipped(f => !f)
      } else if (e.code === 'ArrowRight') {
        handleNext(true)
      } else if (e.code === 'ArrowLeft') {
        handleNext(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIdx, deck, isCompleted])

  const handleNext = (markMastered: boolean) => {
    if (!currentCard) return

    if (markMastered) {
      setMasteredIds(prev => new Set(prev).add(currentCard.id))
      setReviewIds(prev => {
        const next = new Set(prev)
        next.delete(currentCard.id)
        return next
      })
    } else {
      setReviewIds(prev => new Set(prev).add(currentCard.id))
    }

    if (currentIdx < deck.length - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      setIsCompleted(true)
      onComplete?.(masteredIds.size + (markMastered ? 1 : 0))
    }
  }

  const handleRestart = () => {
    setCurrentIdx(0)
    setIsFlipped(false)
    setMasteredIds(new Set())
    setReviewIds(new Set())
    setIsCompleted(false)
  }

  const handleReviewMistakes = () => {
    const mistakes = deck.filter(c => reviewIds.has(c.id))
    if (mistakes.length > 0) {
      setDeck(mistakes)
      setCurrentIdx(0)
      setIsFlipped(false)
      setReviewIds(new Set())
      setIsCompleted(false)
    }
  }

  const progressPct = deck.length > 0 ? Math.round(((currentIdx + 1) / deck.length) * 100) : 0

  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto text-center py-10 animate-in">
        <div className="card p-8 bg-white border border-gray-100 shadow-xl rounded-3xl space-y-5">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner">
            🎉
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deck Completed!</h2>
            <p className="text-gray-500 text-sm mt-1">
              You reviewed all {deck.length} vocabulary flashcards.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-3xl font-black text-emerald-700 block">{masteredIds.size}</span>
              <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Mastered ✓</span>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-3xl font-black text-amber-700 block">{reviewIds.size}</span>
              <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider">Needs Review ↻</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {reviewIds.size > 0 && (
              <button
                type="button"
                onClick={handleReviewMistakes}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <span>↻</span> Review {reviewIds.size} Tricky Words
              </button>
            )}
            <button
              type="button"
              onClick={handleRestart}
              className="btn-secondary"
            >
              Restart Full Deck
            </button>
            {onBackToQuiz && (
              <button
                type="button"
                onClick={onBackToQuiz}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                ← Back to Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in">
      {/* ── Top Bar with Modes & Progress ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBackToQuiz && (
            <button
              type="button"
              onClick={onBackToQuiz}
              className="text-xs font-semibold text-gray-500 hover:text-brand-700 bg-white border border-gray-200 hover:border-brand-300 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <span>←</span> Quiz Mode
            </button>
          )}
          <span className="text-xs font-bold px-2.5 py-1 bg-brand-100 text-brand-800 rounded-lg uppercase tracking-wide">
            🎴 Flashcard Mode
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          <span>Card {currentIdx + 1} of {deck.length}</span>
          <span className="text-gray-300">•</span>
          <span className="text-emerald-600 font-semibold">{masteredIds.size} mastered</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── 3D Flip Card Container ── */}
      <div
        className="w-full h-[360px] sm:h-[390px] cursor-pointer perspective-[1000px] select-none"
        onClick={() => setIsFlipped(f => !f)}
      >
        <div
          className={`relative w-full h-full duration-500 transition-transform transform-gpu ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ── FRONT OF CARD ── */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-gray-50 border-2 border-brand-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow [backface-visibility:hidden]"
          >
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                {currentCard.difficulty || 'Vocabulary'}
              </span>
              <span className="text-brand-600 font-semibold">Tap to flip ↻</span>
            </div>

            <div className="text-center my-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight font-serif">
                {currentCard.word}
              </h2>

              {currentCard.phonetic && (
                <p className="text-sm font-mono text-gray-400">{currentCard.phonetic}</p>
              )}

              {currentCard.pos && (
                <span className="inline-block text-xs uppercase font-bold tracking-wider px-3 py-1 bg-brand-50 text-brand-700 rounded-full">
                  {currentCard.pos}
                </span>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    pronounce(currentCard.word)
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  title="Hear English pronunciation"
                >
                  <span>🔊</span> Pronounce Word
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-3">
              Press <strong>Space</strong> or tap to reveal definition & Amharic
            </div>
          </div>

          {/* ── BACK OF CARD ── */}
          <div
            className="absolute inset-0 w-full h-full bg-white border-2 border-brand-300 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl [transform:rotateY(180deg)] [backface-visibility:hidden]"
          >
            <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{currentCard.word}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    pronounce(currentCard.word)
                  }}
                  className="text-brand-600 hover:text-brand-800 p-1"
                  title="Listen"
                >
                  🔊
                </button>
              </div>
              <span className="text-gray-400 text-xs">Tap to flip back</span>
            </div>

            <div className="my-auto space-y-4 text-left overflow-y-auto pr-1 py-1">
              {/* Definition */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  Definition
                </span>
                <p className="text-sm sm:text-base text-gray-800 font-medium leading-relaxed">
                  {currentCard.definition}
                </p>
              </div>

              {/* Amharic Translation */}
              {currentCard.amharic && (
                <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                    የአማርኛ ትርጉም (Amharic)
                  </span>
                  <p className="text-base sm:text-lg font-bold text-amber-950">
                    {currentCard.amharic}
                  </p>
                </div>
              )}

              {/* Oromo Translation if present */}
              {currentCard.oromo && (
                <div className="text-xs text-gray-600">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Afaan Oromoo</span>
                  <p className="font-medium text-gray-700">{currentCard.oromo}</p>
                </div>
              )}

              {/* Example sentence */}
              {currentCard.example && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Example in a Sentence
                  </span>
                  <p className="text-xs sm:text-sm text-gray-600 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    "{currentCard.example}"
                  </p>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-2">
              Did you know this word? Choose below 👇
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => handleNext(false)}
          className="flex-1 py-3 px-4 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span>↻</span> Still Learning
        </button>

        <button
          type="button"
          onClick={() => handleNext(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span>✓</span> Mastered!
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        💡 Tip: Use Left Arrow (←) for Still Learning, Right Arrow (→) for Mastered.
      </p>
    </div>
  )
}
