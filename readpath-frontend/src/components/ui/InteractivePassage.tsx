import React, { useState, useEffect, useRef, useMemo } from 'react'
import { lookupBilingualWord, type BilingualWord } from '../../lib/bilingualDictionary'

interface InteractivePassageProps {
  title?: string
  text: string
  wordCount?: number
  allowTts?: boolean
  allowDefine?: boolean
  className?: string
  extraHeaderAction?: React.ReactNode
}

export default function InteractivePassage({
  title,
  text,
  wordCount,
  allowTts = true,
  allowDefine = true,
  className = '',
  extraHeaderAction,
}: InteractivePassageProps) {
  // TTS State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(0.9) // slightly slower for young readers
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number | null>(null)
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null)
  const [ttsSupported, setTtsSupported] = useState(true)

  // Word Definition Popover State
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Split text into sentences and words
  const sentences = useMemo(() => {
    if (!text) return []
    // Split by sentence endings while retaining punctuation
    return text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text]
  }, [text])

  // Flat list of words with sentence mapping for TTS highlighting
  const wordTokens = useMemo(() => {
    if (!text) return []
    return text.split(/\s+/).filter(Boolean)
  }, [text])

  // Check TTS support
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsSupported(false)
    }
  }, [])

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Handle Play / Resume TTS
  const handlePlayTts = () => {
    if (!ttsSupported) return

    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = playbackRate
    utterance.pitch = 1.0
    utterance.lang = 'en-US'

    // Try finding an English natural voice
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')))
      || voices.find(v => v.lang.startsWith('en'))
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex
        // Find which sentence and word this corresponds to
        const textBefore = text.slice(0, charIdx)
        const wordCountBefore = textBefore.trim().split(/\s+/).filter(Boolean).length
        setCurrentWordIdx(wordCountBefore)

        // Find sentence
        let runningLength = 0
        for (let i = 0; i < sentences.length; i++) {
          runningLength += sentences[i].length
          if (charIdx < runningLength) {
            setCurrentSentenceIdx(i)
            break
          }
        }
      }
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentSentenceIdx(null)
      setCurrentWordIdx(null)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentSentenceIdx(null)
      setCurrentWordIdx(null)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
    setIsPaused(false)
  }

  const handlePauseTts = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const handleStopTts = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentSentenceIdx(null)
    setCurrentWordIdx(null)
  }

  // Pronounce a single clicked word
  const pronounceWord = (word: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const clean = word.replace(/[^a-zA-Z]/g, '')
    const u = new SpeechSynthesisUtterance(clean)
    u.rate = 0.85
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }

  // Handle word click for definition
  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>, rawWord: string) => {
    if (!allowDefine) return
    const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '')
    if (!clean) return

    // Position popover
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    const cLeft = containerRect?.left ?? 0
    const cTop = containerRect?.top ?? 0
    const cWidth = containerRect?.width ?? 400
    
    // Relative to container
    setPopoverPos({
      x: Math.min(Math.max(10, rect.left - cLeft - 80), cWidth - 280),
      y: rect.bottom - cTop + 8,
    })
    setSelectedWord(clean)
  }

  // Close popover on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.word-def-popover')) {
        setSelectedWord(null)
      }
    }
    if (selectedWord) {
      window.addEventListener('click', close)
    }
    return () => window.removeEventListener('click', close)
  }, [selectedWord])

  // Word definition lookup
  const wordInfo = selectedWord ? lookupBilingualWord(selectedWord) : null
  const [savedWords, setSavedWords] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('lisan_saved_vocab') || '[]')
    } catch {
      return []
    }
  })

  const toggleSaveWord = (word: string) => {
    const next = savedWords.includes(word)
      ? savedWords.filter(w => w !== word)
      : [...savedWords, word]
    setSavedWords(next)
    try {
      localStorage.setItem('lisan_saved_vocab', JSON.stringify(next))
    } catch {}
  }

  return (
    <div ref={containerRef} className={`relative p-5 bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>
      
      {/* ── Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100">
        <div>
          {title && (
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>📖</span> {title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 font-medium">
              {wordCount || wordTokens.length} words
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              💡 Tap any word to define & pronounce
            </span>
          </div>
        </div>

        {/* Read-Aloud (TTS) Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {allowTts && ttsSupported && (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 p-1 rounded-xl">
              {!isPlaying ? (
                <button
                  type="button"
                  onClick={handlePlayTts}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  title="Listen to entire passage read aloud"
                >
                  <span className="text-sm">🔊</span> Listen
                </button>
              ) : isPaused ? (
                <button
                  type="button"
                  onClick={handlePlayTts}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>▶</span> Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseTts}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>⏸</span> Pause
                </button>
              )}

              {isPlaying && (
                <button
                  type="button"
                  onClick={handleStopTts}
                  className="inline-flex items-center px-2 py-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg text-xs transition-colors"
                  title="Stop reading"
                >
                  ■ Stop
                </button>
              )}

              {/* Speed selector */}
              <select
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value)
                  setPlaybackRate(rate)
                  if (isPlaying) {
                    handleStopTts()
                  }
                }}
                className="text-xs bg-white border border-gray-200 text-gray-700 rounded-lg px-2 py-1 outline-none cursor-pointer"
                title="Reading Speed"
              >
                <option value={0.75}>0.75x (Slower)</option>
                <option value={0.9}>0.9x (Natural)</option>
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.2}>1.2x (Faster)</option>
              </select>
            </div>
          )}

          {extraHeaderAction}
        </div>
      </div>

      {/* ── Active Speech Reading Banner ── */}
      {isPlaying && (
        <div className="mb-4 px-3.5 py-2 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between gap-2 text-xs text-brand-800 animate-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-ping" />
            <span className="font-semibold">Reading aloud in progress…</span>
            <span className="hidden sm:inline text-brand-600">Follow the highlighted text below.</span>
          </div>
          <span className="text-[11px] font-mono text-brand-700 bg-white/80 px-2 py-0.5 rounded border border-brand-200">
            Speed: {playbackRate}x
          </span>
        </div>
      )}

      {/* ── Passage Text with Interactive Words & Sentences ── */}
      <div className="leading-relaxed sm:leading-8 text-base sm:text-[17px] font-serif text-gray-900 select-text">
        {sentences.map((sentence, sIdx) => {
          const isSentenceActive = isPlaying && currentSentenceIdx === sIdx
          const wordsInSentence = sentence.split(/\s+/).filter(Boolean)

          return (
            <span
              key={sIdx}
              className={`transition-colors duration-150 rounded px-0.5 ${
                isSentenceActive ? 'bg-amber-100/80' : ''
              }`}
            >
              {wordsInSentence.map((w, wIdx) => {
                const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '')
                const isWordSelected = selectedWord === cleanWord

                return (
                  <span
                    key={wIdx}
                    onClick={(e) => handleWordClick(e, w)}
                    className={`inline-block cursor-pointer px-0.5 py-0.5 rounded transition-all duration-150 hover:bg-brand-50 hover:text-brand-900 ${
                      isWordSelected ? 'bg-brand-200 text-brand-950 font-medium ring-2 ring-brand-400' : ''
                    }`}
                  >
                    {w}{' '}
                  </span>
                )
              })}
            </span>
          )
        })}
      </div>

      {/* ── Floating Definition Popover ── */}
      {selectedWord && popoverPos && (
        <div
          style={{ top: popoverPos.y, left: popoverPos.x }}
          className="word-def-popover absolute z-40 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 text-left animate-in"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base capitalize">{selectedWord}</span>
                <span className="text-[10px] font-semibold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {wordInfo?.pos || 'word'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => pronounceWord(selectedWord)}
                className="mt-1 text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1 hover:underline"
              >
                <span>🔊</span> Listen to word
              </button>
            </div>
            <button
              onClick={() => setSelectedWord(null)}
              className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Meaning / Translation */}
          <div className="space-y-2 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-700">
            {wordInfo ? (
              <>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">English Definition</span>
                  <p className="leading-snug text-gray-800">{wordInfo.definition}</p>
                </div>

                {wordInfo.amharic && (
                  <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-800">የአማርኛ ትርጉም (Amharic)</span>
                      <span className="text-[10px] text-emerald-600 font-mono italic">{wordInfo.amharicPhonetic}</span>
                    </div>
                    <p className="font-bold text-emerald-950 text-sm">{wordInfo.amharic}</p>
                    {wordInfo.exampleAm && (
                      <p className="text-[11px] text-emerald-800/80 mt-1 italic font-serif">"{wordInfo.exampleAm}"</p>
                    )}
                  </div>
                )}

                {wordInfo.exampleEn && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">English Example</span>
                    <p className="italic text-gray-600">"{wordInfo.exampleEn}"</p>
                  </div>
                )}

                {wordInfo.culturalNote && (
                  <div className="text-[11px] bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                    🇪🇹 <strong>Ethiopian Context:</strong> {wordInfo.culturalNote}
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleSaveWord(selectedWord)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      savedWords.includes(selectedWord)
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{savedWords.includes(selectedWord) ? '★' : '☆'}</span>
                    <span>{savedWords.includes(selectedWord) ? 'Saved in Word Bank' : 'Save to Word Bank'}</span>
                  </button>
                  <span className="text-[11px] text-gray-400">
                    {savedWords.length} saved
                  </span>
                </div>
              </>
            ) : (
              <div className="py-1">
                <p className="text-gray-600 leading-snug">
                  Click the speaker to hear pronunciation. Look for surrounding context clues in the passage to decode this word.
                </p>
                <div className="mt-2 p-2 bg-brand-50 rounded-xl text-brand-800 text-[11px]">
                  💡 <strong>Reading Tip:</strong> Break "{selectedWord}" into syllables or sound chunks.
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveWord(selectedWord)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700"
                  >
                    <span>{savedWords.includes(selectedWord) ? '★ Saved' : '☆ Save Word'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
