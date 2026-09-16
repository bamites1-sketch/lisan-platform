import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { ChatMessage, StudentProfile } from '../types'

const QUICK_ACTIONS = [
  { label: '📖 Help with a passage',   msg: "I don't understand this passage. Can you help me break it down?" },
  { label: '🔢 Math help',             msg: "I need help with a math problem." },
  { label: '💡 Give me a hint',        msg: "Give me a hint for this question." },
  { label: '📚 Vocabulary practice',   msg: "Give me a vocabulary practice question." },
  { label: '🌍 Science question',      msg: "I have a science question." },
  { label: '🎤 Reading practice',      msg: "Give me a short passage to practice reading." },
]

// Format message text with markdown-like bold/italic
function formatMessage(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
    return (
      <p
        key={i}
        className={line.startsWith('---') ? 'border-t border-gray-200 my-1' : 'mb-1 last:mb-0'}
        dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
      />
    )
  })
}

export default function AiTutor() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'offline' | null>(null)
  const [hasError, setHasError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const profile = user?.profile as StudentProfile | undefined
  const firstName = profile?.firstName ?? 'there'

  // Load chat history the first time the panel opens
  useEffect(() => {
    if (!open || historyLoaded) return
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/chat/history', {
          headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.data)) {
            setMessages(data.data)
          }
        }
      } catch {
        // non-fatal — start fresh
      } finally {
        setHistoryLoaded(true)
      }
    }
    loadHistory()
  }, [open, historyLoaded])

  // Scroll to bottom on new message or when opening
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim()
    if (!msgText || loading) return
    setInput('')
    setHasError(false)

    const userMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      message: msgText,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lisan_token')}`,
        },
        body: JSON.stringify({ message: msgText }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessages(prev => [...prev, {
          id: data.data.messageId ?? `ai-${Date.now()}`,
          role: 'assistant',
          message: data.data.message,
          createdAt: new Date().toISOString(),
        }])
        setAiProvider(data.data.provider)
      } else {
        throw new Error(data.message || 'Request failed')
      }
    } catch {
      setHasError(true)
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        message: `Sorry ${firstName}, I couldn't connect right now. Please try again in a moment. 😊`,
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (!user || user.role !== 'STUDENT') return null

  const isOffline = aiProvider === 'offline'

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 w-[min(390px,calc(100vw-2rem))] bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 flex flex-col animate-in overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="bg-[#003f3a] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#f2c94c] rounded-xl flex items-center justify-center text-[#003f3a] font-black text-base select-none">
                L
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Lemi</p>
                <p className="text-white/60 text-xs leading-tight">
                  {isOffline ? 'Offline mode' : aiProvider === 'gemini' ? 'Powered by Gemini ✨' : 'AI Tutor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => { setMessages([]); setHistoryLoaded(false); setAiProvider(null) }}
                  title="Clear chat"
                  className="text-white/50 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors mr-1"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Offline / error banners */}
          {isOffline && !hasError && (
            <div className="mx-3 mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex-shrink-0">
              ⚠️ Running in offline mode — answers are rule-based, not Gemini AI.
            </div>
          )}
          {hasError && (
            <div className="mx-3 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex-shrink-0">
              ⚠️ Could not reach the server. Check your connection and try again.
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px]">
            {messages.length === 0 && (
              <div className="text-center py-8 px-2">
                <div className="w-14 h-14 bg-[#e8f5f4] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🤖</div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Hi {firstName}! I'm Lemi 👋</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  I can help you with <strong>anything</strong> — maths, science, English, history, homework, or just a question you're curious about.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-[#003f3a] rounded-full flex items-center justify-center text-[#f2c94c] text-xs font-black flex-shrink-0 mb-0.5">
                    L
                  </div>
                )}
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#003f3a] text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant'
                    ? <div className="prose-sm">{formatMessage(msg.message)}</div>
                    : msg.message
                  }
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-[#f2c94c] rounded-full flex items-center justify-center text-[#003f3a] text-xs font-bold flex-shrink-0 mb-0.5">
                    {firstName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 bg-[#003f3a] rounded-full flex items-center justify-center text-[#f2c94c] text-xs font-black flex-shrink-0 mb-0.5">
                  L
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-3">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
            {QUICK_ACTIONS.map(a => (
              <button
                key={a.label}
                onClick={() => sendMessage(a.msg)}
                disabled={loading}
                className="text-xs px-2.5 py-1.5 bg-[#e8f5f4] text-[#003f3a] border border-[#c5e0de] rounded-full hover:bg-[#c5e0de] transition-colors disabled:opacity-40"
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              disabled={loading}
              className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003f3a]/30 focus:border-[#003f3a] disabled:bg-gray-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-[#003f3a] hover:bg-[#005a53] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Floating toggle button ──────────────────────────────────── */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`fixed bottom-5 right-4 sm:right-6 z-50 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
          open ? 'bg-[#005a53]' : 'bg-[#003f3a] hover:bg-[#005a53]'
        }`}
        aria-label="Toggle AI Tutor"
      >
        <span className="text-base">{open ? '✕' : '💬'}</span>
        <span className="hidden sm:inline">{open ? 'Close' : 'Ask Lemi'}</span>
      </button>
    </>
  )
}
