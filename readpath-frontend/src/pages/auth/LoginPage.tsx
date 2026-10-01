import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const C = {
  dark:  '#1a3a2a', // Deep Forest Emerald
  mid:   '#2d6a4f', // Rich Forest Green
  gold:  '#d4a017', // Ethiopian Gold
  light: '#e8f4f0', // Soft Mint
  cream: '#f5f0e8', // Warm Parchment
} as const

// ─── Ethiopian geometric pattern ─────────────────────────────────
function EthPattern({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 80 80" className={className} style={style} fill="none">
      <rect x="4"  y="4"  width="72" height="72" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="12" width="56" height="56" stroke="currentColor" strokeWidth="1"
            fill="none" transform="rotate(45 40 40)" />
      <line x1="40" y1="4"  x2="40" y2="76" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="4"  y1="40" x2="76" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <circle cx="4"  cy="4"  r="2.5" fill="currentColor" />
      <circle cx="76" cy="4"  r="2.5" fill="currentColor" />
      <circle cx="4"  cy="76" r="2.5" fill="currentColor" />
      <circle cx="76" cy="76" r="2.5" fill="currentColor" />
      <circle cx="40" cy="4"  r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="40" cy="76" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="4"  cy="40" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="76" cy="40" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

// ─── Left branding panel (Desktop) ───────────────────────────────
function BrandPanel() {
  const steps = [
    { label: 'Assess',      icon: '📋' },
    { label: 'Identify',    icon: '🔍' },
    { label: 'Personalize', icon: '🎯' },
    { label: 'Practice',    icon: '🎙️' },
    { label: 'Grow',        icon: '🌱' },
  ]

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
      style={{ backgroundColor: C.dark, width: '44%', flexShrink: 0 }}
    >
      {/* Background hero image with rich gradient */}
      <img
        src="/assets/hero-image.png"
        alt="LISAN reading student"
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        style={{ objectPosition: '60% center' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(165deg, rgba(26,58,42,0.96) 0%, rgba(26,58,42,0.88) 55%, rgba(45,106,79,0.85) 100%)`,
        }}
      />

      {/* Cultural motif watermarks */}
      <EthPattern className="absolute top-10 right-6 w-32 h-32 opacity-15 pointer-events-none" style={{ color: C.gold }} />
      <EthPattern className="absolute bottom-16 left-6 w-36 h-36 opacity-10 pointer-events-none" style={{ color: C.mid }} />

      {/* Top Header: Logo */}
      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
          <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-[#d4a017]/40 bg-white/10 shadow-sm transition-transform group-hover:scale-105 flex-shrink-0">
            <img
              src="/assets/hero-image.png"
              alt="LISAN"
              className="w-full h-full object-cover object-top"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-xl tracking-wide">LISAN</span>
              <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded text-[#d4a017] bg-[#d4a017]/15 border border-[#d4a017]/30">
                ልሳን
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-wider" style={{ color: C.gold }}>
              Read · Learn · Grow
            </p>
          </div>
        </Link>
      </div>

      {/* Middle Content */}
      <div className="relative z-10 my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 bg-white/10 backdrop-blur-sm"
          style={{ borderColor: 'rgba(212,160,23,0.35)' }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.gold }} />
          <span className="text-xs font-bold uppercase tracking-wider text-[#d4a017]">
            Diagnostic Reading Platform
          </span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
          Better Readers.<br />
          Brighter <span style={{ color: C.gold }}>Futures.</span>
        </h2>

        <p className="text-white/75 text-sm leading-relaxed max-w-sm mb-8">
          Welcome back! Sign in to access your personalized learning pathway, monitor reading progress, or complete your diagnostic assessments.
        </p>

        {/* Confidence Glass Card */}
        <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-md border border-white/15 max-w-sm shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-[#2d6a4f]/80 text-white flex-shrink-0">
              📖
            </div>
            <div>
              <p className="text-xs font-semibold text-white/95 leading-snug">
                "Reading is the master skill that unlocks every other subject."
              </p>
              <p className="text-[11px] text-[#d4a017] mt-1 font-medium">
                ★ Founded with 20+ Years Classroom Experience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: 5-step Literacy cycle & Back link */}
      <div className="relative z-10 pt-4 border-t border-white/15">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Core Literacy Framework
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, idx) => (
            <span
              key={step.label}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm"
              style={{
                borderColor: idx === 4 ? C.gold : 'rgba(255,255,255,0.2)',
                color: idx === 4 ? C.gold : 'rgba(255,255,255,0.85)',
                backgroundColor: idx === 4 ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <span>{step.icon}</span>
              {step.label}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Login page ───────────────────────────────────────────────────
export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()

  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [showPass,        setShowPass]        = useState(false)
  const [remember,        setRemember]        = useState(true)
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen lg:h-screen flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative"
      style={{
        background: `radial-gradient(ellipse at 80% 20%, rgba(212,160,23,0.08) 0%, rgba(232,244,240,0.4) 40%, #f7faf8 80%)`,
      }}
    >
      {/* Desktop Brand Panel */}
      <BrandPanel />

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 lg:py-8 lg:overflow-y-auto relative">
        
        {/* Mobile Header Branding */}
        <div className="lg:hidden flex flex-col items-center mb-8 text-center">
          <Link to="/" className="flex items-center gap-2.5 mb-2 focus:outline-none">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-[#d4a017]/40 bg-white/20 shadow-md">
              <img
                src="/assets/hero-image.png"
                alt="LISAN"
                className="w-full h-full object-cover object-top"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl leading-none" style={{ color: C.dark }}>LISAN</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded text-[#d4a017] bg-[#d4a017]/15 border border-[#d4a017]/30">
                  ልሳን
                </span>
              </div>
              <p className="text-[11px] font-medium" style={{ color: C.mid }}>Read · Learn · Grow</p>
            </div>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Reading Diagnostic &amp; Learning Platform</p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100/90 p-7 sm:p-9 relative z-10">

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: C.dark }}>
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
              Sign in with your email to access your assessments and lessons.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200/90 flex items-start gap-2.5 animate-fade-in">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Address
              </label>
              <div
                className="relative flex items-center border rounded-xl px-3.5 py-3 bg-gray-50/50 hover:bg-white focus-within:bg-white transition-all shadow-xs"
                style={{ borderColor: '#e2e8f0' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.mid)}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <svg className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color: C.mid }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full ml-3 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold hover:underline focus:outline-none"
                  style={{ color: C.mid }}
                >
                  Forgot password?
                </button>
              </div>

              <div
                className="relative flex items-center border rounded-xl px-3.5 py-3 bg-gray-50/50 hover:bg-white focus-within:bg-white transition-all shadow-xs"
                style={{ borderColor: '#e2e8f0' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.mid)}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <svg className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color: C.mid }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full ml-3 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(r => !r)}
                  className="sr-only"
                />
                <div
                  className="w-4 h-4 rounded-md border flex items-center justify-center transition-all shadow-2xs"
                  style={{
                    borderColor: remember ? C.mid : '#cbd5e1',
                    backgroundColor: remember ? C.mid : '#ffffff',
                  }}
                >
                  {remember && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  Remember me on this device
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: C.dark }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] font-bold text-gray-400 tracking-wider">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Create Account Link */}
          <Link
            to="/register"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all hover:bg-gray-50 text-center"
            style={{ borderColor: C.mid, color: C.mid }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Create a New Account</span>
          </Link>

          {/* Need help card */}
          <div
            className="mt-5 flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-100"
            style={{ backgroundColor: C.light }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-white/80 shadow-xs flex-shrink-0">
              💬
            </div>
            <div className="text-xs">
              <p className="font-bold" style={{ color: C.dark }}>Need assistance?</p>
              <p className="text-gray-600">
                Contact{' '}
                <a href="mailto:HABTAMUGEBREKIDAN@GMAIL.COM" className="font-medium underline hover:text-black">
                  Dr. Habtamu
                </a>{' '}
                or school admin.
              </p>
            </div>
          </div>

        </div>

        {/* Back Link on Mobile/Desktop */}
        <p className="mt-6 text-center text-xs text-gray-500">
          <Link to="/" className="inline-flex items-center gap-1.5 font-medium hover:text-gray-900 transition-colors">
            <span>←</span> Back to Homepage
          </Link>
        </p>

      </div>

      {/* ─── Forgot Password Modal ──────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 text-center relative">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ backgroundColor: C.light }}
            >
              🔒
            </div>

            <h3 className="text-lg font-bold mb-2" style={{ color: C.dark }}>
              Password Reset Support
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              To protect student assessment profiles and reading diagnostics, password resets are verified manually by the lead educator.
            </p>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-left space-y-2 mb-6 text-xs">
              <div>
                <span className="font-bold text-gray-800">Email:</span>{' '}
                <a href="mailto:HABTAMUGEBREKIDAN@GMAIL.COM" className="text-emerald-800 hover:underline">
                  HABTAMUGEBREKIDAN@GMAIL.COM
                </a>
              </div>
              <div>
                <span className="font-bold text-gray-800">Direct Phone:</span>{' '}
                <a href="tel:0927417210" className="text-emerald-800 font-semibold">
                  0927417210
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.dark }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
