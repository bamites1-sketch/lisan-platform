import React, { useState } from 'react'
import StudentLayout from '../../components/layout/StudentLayout'
import {
  BILINGUAL_STORIES,
  type BilingualStory,
  lookupBilingualWord,
  type BilingualWord,
} from '../../lib/bilingualDictionary'

export default function BilingualStoryLibrary() {
  const [selectedStory, setSelectedStory] = useState<BilingualStory>(BILINGUAL_STORIES[0])
  const [showParallelAmharic, setShowParallelAmharic] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activeWordData, setActiveWordData] = useState<BilingualWord | null>(null)
  const [selectedRawWord, setSelectedRawWord] = useState<string | null>(null)
  const [showWordBankModal, setShowWordBankModal] = useState(false)

  // Saved vocabulary in localStorage
  const [savedVocab, setSavedVocab] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('lisan_saved_vocab') || '[]')
    } catch {
      return []
    }
  })

  const toggleSaveWord = (word: string) => {
    const next = savedVocab.includes(word)
      ? savedVocab.filter((w) => w !== word)
      : [...savedVocab, word]
    setSavedVocab(next)
    try {
      localStorage.setItem('lisan_saved_vocab', JSON.stringify(next))
    } catch {}
  }

  // Pronounce English word
  const pronounceWord = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.85
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }

  // Handle word click
  const handleWordClick = (rawWord: string) => {
    const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '')
    if (!clean) return
    setSelectedRawWord(rawWord)
    const info = lookupBilingualWord(clean)
    setActiveWordData(info)
  }

  // Filtered stories
  const filteredStories = BILINGUAL_STORIES.filter((s) => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false
    return true
  })

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* ── Title Hero ── */}
        <div className="bg-gradient-to-r from-[#1a3a2a] via-[#1f4a35] to-[#12281d] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-[#d4a017]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#d4a017]/20 border border-[#d4a017]/40 text-[#f3ca52] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                <span>📖</span> የልሳን ታሪኮች · Bilingual Story Library
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Interactive Bilingual Stories (እንግሊዝኛ & አማርኛ)
              </h1>
              <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl">
                Tap any word in the story to hear its native English pronunciation and see its
                authentic Amharic (አማርኛ) translation, phonetic guide, and cultural context.
              </p>
            </div>

            {/* Word Bank Button */}
            <button
              type="button"
              onClick={() => setShowWordBankModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white shadow-sm transition-all"
            >
              <span>⭐</span>
              <span>My Word Bank ({savedVocab.length})</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {['ALL', 'Folktale', 'Nature', 'History'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#d4a017] text-[#1a3a2a] shadow-md'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {cat === 'ALL' ? 'All Stories (ሁሉም)' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Layout: Story Selector + Story Viewer ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Story Picker Column (Horizontal on mobile, vertical sidebar on desktop) */}
          <div className="lg:col-span-4 space-y-2.5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
              Select Story to Read ({filteredStories.length})
            </h2>

            {/* Mobile Horizontal Carousel */}
            <div className="lg:hidden flex gap-2.5 overflow-x-auto no-scrollbar pb-2 touch-scroll">
              {filteredStories.map((story) => {
                const isSelected = story.id === selectedStory.id
                return (
                  <div
                    key={story.id}
                    onClick={() => {
                      setSelectedStory(story)
                      setActiveWordData(null)
                      setSelectedRawWord(null)
                    }}
                    className={`min-w-[240px] max-w-[260px] flex-shrink-0 p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 active:scale-98 ${
                      isSelected
                        ? 'bg-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-[#d4a017]/40'
                        : 'bg-white border-gray-200 hover:border-emerald-300 text-gray-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isSelected ? 'bg-[#d4a017] text-[#1a3a2a]' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {story.gradeLevel}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-gray-400'}`}>
                        ⏱️ {story.readTimeMin}m
                      </span>
                    </div>
                    <h3 className="font-bold text-xs mt-1.5 line-clamp-1">{story.titleEn}</h3>
                    <p className={`text-[11px] font-serif line-clamp-1 ${isSelected ? 'text-[#f3ca52]' : 'text-emerald-800'}`}>{story.titleAm}</p>
                  </div>
                )
              })}
            </div>

            {/* Desktop Vertical List */}
            <div className="hidden lg:block space-y-2.5">
              {filteredStories.map((story) => {
                const isSelected = story.id === selectedStory.id
                return (
                  <div
                    key={story.id}
                    onClick={() => {
                      setSelectedStory(story)
                      setActiveWordData(null)
                      setSelectedRawWord(null)
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-[#d4a017]/40'
                        : 'bg-white border-gray-200 hover:border-emerald-300 text-gray-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isSelected
                            ? 'bg-[#d4a017] text-[#1a3a2a]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {story.gradeLevel}
                      </span>
                      <span className={`text-[11px] ${isSelected ? 'text-emerald-200' : 'text-gray-400'}`}>
                        ⏱️ {story.readTimeMin} min read
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base mt-2 line-clamp-1">
                      {story.titleEn}
                    </h3>
                    <p className={`text-xs mt-0.5 font-serif ${isSelected ? 'text-[#f3ca52]' : 'text-emerald-800'}`}>
                      {story.titleAm}
                    </p>
                    <p className={`text-xs mt-1.5 line-clamp-2 ${isSelected ? 'text-emerald-100/70' : 'text-gray-500'}`}>
                      {story.summaryEn}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Story Reading Canvas (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
              
              {/* Story Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {selectedStory.category}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {selectedStory.wordCount} words
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                    {selectedStory.titleEn}
                  </h2>
                  <p className="text-sm font-semibold text-emerald-700 font-serif">
                    {selectedStory.titleAm}
                  </p>
                </div>

                {/* Parallel Amharic Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowParallelAmharic(!showParallelAmharic)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      showParallelAmharic
                        ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-inner'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{showParallelAmharic ? '👁️ Hide Amharic' : '🇪🇹 Show Parallel Amharic'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const fullText = selectedStory.sentences.map((s) => s.en).join(' ')
                      pronounceWord(fullText)
                    }}
                    className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-gray-200 text-xs"
                    title="Read aloud full story"
                  >
                    🔊 Listen All
                  </button>
                </div>
              </div>

              {/* Story Sentences */}
              <div className="mt-6 space-y-5">
                {selectedStory.sentences.map((sent, sIdx) => {
                  const words = sent.en.split(/\s+/).filter(Boolean)
                  return (
                    <div
                      key={sIdx}
                      className={`p-3 rounded-2xl transition-all ${
                        showParallelAmharic ? 'bg-gray-50/70 border border-gray-100' : ''
                      }`}
                    >
                      {/* English Interactive Text */}
                      <p className="text-base sm:text-lg leading-relaxed text-gray-900 font-serif">
                        {words.map((w, wIdx) => {
                          const clean = w.toLowerCase().replace(/[^a-z]/g, '')
                          const isVocab = selectedStory.keyVocabulary.includes(clean)
                          const isSelected = selectedRawWord === w

                          return (
                            <span
                              key={wIdx}
                              onClick={() => handleWordClick(w)}
                              className={`inline-block mr-1.5 cursor-pointer px-1 py-0.5 rounded transition-all duration-150 ${
                                isSelected
                                  ? 'bg-emerald-200 text-emerald-950 font-bold ring-2 ring-emerald-500 scale-105'
                                  : isVocab
                                  ? 'bg-amber-100/90 text-amber-900 font-medium underline decoration-amber-400 hover:bg-amber-200'
                                  : 'hover:bg-emerald-50 hover:text-emerald-800'
                              }`}
                              title="Tap to translate to Amharic"
                            >
                              {w}
                            </span>
                          )
                        })}
                      </p>

                      {/* Parallel Amharic Sentence Translation */}
                      {showParallelAmharic && (
                        <p className="mt-2 pt-2 border-t border-gray-200/60 text-sm sm:text-base font-serif text-emerald-900/90 leading-relaxed">
                          {sent.am}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ── Bilingual Word Inspector Popover / Card ── */}
              {selectedRawWord && (
                <div className="mt-6 p-5 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white rounded-2xl border-2 border-emerald-200/80 shadow-md animate-in">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-gray-900 capitalize">
                          {selectedRawWord.replace(/[^a-zA-Z]/g, '')}
                        </span>
                        {activeWordData && (
                          <>
                            <span className="text-xs font-mono text-gray-500">
                              {activeWordData.phonetic}
                            </span>
                            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              {activeWordData.pos}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => pronounceWord(selectedRawWord)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        <span>🔊</span> Listen to English pronunciation
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSaveWord(selectedRawWord.toLowerCase().replace(/[^a-z]/g, ''))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          savedVocab.includes(selectedRawWord.toLowerCase().replace(/[^a-z]/g, ''))
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span>★</span>
                        <span>
                          {savedVocab.includes(selectedRawWord.toLowerCase().replace(/[^a-z]/g, ''))
                            ? 'Saved'
                            : 'Add to Word Bank'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRawWord(null)}
                        className="text-gray-400 hover:text-gray-600 text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {activeWordData ? (
                    <div className="mt-4 space-y-3 text-xs sm:text-sm">
                      {/* Amharic Translation Banner */}
                      <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
                            የአማርኛ ትርጉም (Amharic Translation)
                          </span>
                          <span className="text-xs text-emerald-600 font-mono italic">
                            Phonetic: [{activeWordData.amharicPhonetic}]
                          </span>
                        </div>
                        <p className="text-lg font-bold text-emerald-950 font-serif">
                          {activeWordData.amharic}
                        </p>
                      </div>

                      {/* Definition & Examples */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-white/80 rounded-xl border border-gray-200">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                            English Definition
                          </span>
                          <p className="text-gray-800 leading-snug">{activeWordData.definition}</p>
                        </div>

                        <div className="p-3 bg-white/80 rounded-xl border border-gray-200">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                            Bilingual Sentence Example
                          </span>
                          <p className="text-gray-800 italic">"{activeWordData.exampleEn}"</p>
                          <p className="text-emerald-900 font-serif mt-1">"{activeWordData.exampleAm}"</p>
                        </div>
                      </div>

                      {activeWordData.culturalNote && (
                        <div className="p-2.5 bg-[#d4a017]/15 rounded-xl border border-[#d4a017]/30 text-emerald-950 text-xs">
                          🇪🇹 <strong>Ethiopian Cultural Insight:</strong> {activeWordData.culturalNote}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-white rounded-xl text-xs text-gray-600">
                      Looking for context clues? You can break this word into sounds or click the speaker icon above to hear it read clearly.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Word Bank Modal ── */}
        {showWordBankModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      My Amharic Word Bank (የእኔ ቃላት)
                    </h3>
                    <p className="text-xs text-gray-400">
                      {savedVocab.length} words saved for practice
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWordBankModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {savedVocab.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No words saved yet! Click any word in a story and hit "Add to Word Bank" to save it here.
                  </p>
                ) : (
                  savedVocab.map((word) => {
                    const info = lookupBilingualWord(word)
                    return (
                      <div
                        key={word}
                        className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-2xl border border-gray-200 transition-all flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 capitalize text-sm">{word}</span>
                            <button
                              type="button"
                              onClick={() => pronounceWord(word)}
                              className="text-xs text-emerald-600 hover:text-emerald-800"
                            >
                              🔊
                            </button>
                          </div>
                          {info ? (
                            <div className="mt-1">
                              <p className="text-xs font-bold text-emerald-900">{info.amharic}</p>
                              <p className="text-[11px] text-gray-500">{info.definition}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400">Custom vocabulary word</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSaveWord(word)}
                          className="text-xs text-red-500 hover:text-red-700 p-1"
                          title="Remove from Word Bank"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  )
}
