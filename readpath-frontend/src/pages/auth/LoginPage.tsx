import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const C = { dark: '#1a3a2a', mid: '#2d6a4f', gold: '#d4a017', light: '#e8f4f0', cream: '#f5f0e8' }

// ─── Left branding panel ──────────────────────────────────────────
function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
      style={{ backgroundColor: C.dark, width: '42%', flexShrink: 0 }}
    >
      {/* Background hero image */}
      <img
        src="/assets/hero-image.png"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        style={{ objectPosition: '60% center' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${C.dark}ee 0%, ${C.dark}bb 60%, ${C.mid}88 100%)` }} />

      {/* Content above overlay */}
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-14">
          <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-white/25 flex-shrink-0">
            <img src="/assets/hero-image.png" alt="LISAN"
              className="w-full h-full object-cover object-top"
              onError={e => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                el.parentElement!.style.background = C.mid
                el.parentElement!.innerHTML = '<span style="color:white;font-weight:900;font-size:18px;display:flex;align-items:center;justify-content:center;height:100%">L</span>'
              }} />
          </div>
          <div>
            <p className="font-extrabold text-white text-lg leading-none tracking-wide">LiSAN</p>
            <p className="text-xs font-medium" style={{ color: C.gold }}>Read · Learn · Grow</p>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-snug mb-4">
          Better Readers.<br />
          <span style={{ color: C.gold }}>Brighter Futures.</span>
        </h2>
        <p className="text-white/65 text-sm leading-relaxed max-w-xs">
          An intelligent reading platform that helps students understand their ability,
          identify gaps, and grow with a personalised plan.
        </p>
      </div>

      {/* Bottom philosophy tags */}
      <div className="relative z-10 flex flex-wrap gap-2">
        {['Assess', 'Identify', 'Personalize', 'Practice', 'Grow'].map((step, i) => (
          <span key={step}
            className="text-xs font-bold px-3 py-1.5 rounded-full border"
            style={{
              borderColor: i === 4 ? C.gold : 'rgba(255,255,255,0.18)',
              color: i === 4 ? C.gold : 'rgba(255,255,255,0.7)',
              backgroundColor: i === 4 ? `${C.gold}18` : 'rgba(255,255,255,0.06)',
            }}>
            {step}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Login page ───────────────────────────────────────────────────
export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /*
     * Desktop : h-dvh  — fills exactly one viewport, no scrollbar
     * Mobile  : min-h-dvh — grows with content, scrollable
     * The lg: prefix activates the h-dvh lock only on ≥1024px
     */
    <div className="min-h-dvh lg:h-dvh flex flex-col lg:flex-row overflow-hidden"
      style={{ backgroundColor: C.cream }}>

      <BrandPanel />

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:py-0 lg:overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: `${C.mid}40` }}>
            <img src="/assets/hero-image.png" alt="LISAN"
              className="w-full h-full object-cover object-top"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <p className="font-extrabold text-lg leading-none" style={{ color: C.dark }}>LiSAN</p>
            <p className="text-xs font-medium" style={{ color: C.mid }}>Read · Learn · Grow</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-md px-7 py-8">

          <h1 className="text-2xl font-extrabold mb-1" style={{ color: C.dark }}>
            Login to Your Account
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Access your dashboard and continue your reading journey.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3 border rounded-xl px-4 py-3 bg-white transition-all focus-within:shadow-sm"
              style={{ borderColor: '#e0e0e0' }}
              onFocus={e => (e.currentTarget.style.borderColor = C.mid)}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: C.mid }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email address" autoComplete="email" autoFocus
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
            </div>

            {/* Password */}
            <div className="flex items-center gap-3 border rounded-xl px-4 py-3 bg-white transition-all focus-within:shadow-sm"
              style={{ borderColor: '#e0e0e0' }}
              onFocus={e => (e.currentTarget.style.borderColor = C.mid)}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: C.mid }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password" autoComplete="current-password"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                {showPass ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setRemember(r => !r)}
                  className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                  style={{ borderColor: remember ? C.mid : '#d1d5db', backgroundColor: remember ? C.mid : 'white' }}>
                  {remember && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-xs font-semibold transition-colors focus:outline-none"
                style={{ color: C.mid }}>
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: C.dark }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : (
                <>Log In <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-semibold text-gray-400 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Create account */}
          <Link to="/register"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: C.mid, color: C.mid }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create New Account
          </Link>

          {/* Need help */}
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: C.light }}>
            <svg className="w-7 h-7 flex-shrink-0" style={{ color: C.mid }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                d="M18.364 5.636A9 9 0 0112 3a9 9 0 00-9 9v3a2 2 0 002 2h1a2 2 0 002-2v-2a2 2 0 00-2-2H5v-1a7 7 0 0114 0v1h-1a2 2 0 00-2 2v2a2 2 0 002 2h1a2 2 0 002-2v-3a9 9 0 00-2.636-6.364z" />
            </svg>
            <div>
              <p className="text-xs font-bold" style={{ color: C.dark }}>Need help?</p>
              <p className="text-xs text-gray-500">Contact your admin or support team.</p>
            </div>
          </div>

        </div>
        {/* Bottom link */}
        <p className="mt-5 text-xs text-gray-400">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
