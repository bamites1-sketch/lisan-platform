import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { gradeOptions } from '../../lib/utils'

const C = { dark: '#1a3a2a', mid: '#2d6a4f', gold: '#d4a017', light: '#e8f4f0', cream: '#f5f0e8' }

// ─── Left branding panel ─────────────────────────────────────────
function BrandPanel() {
  const steps = [
    { icon: '📋', label: 'Assess',      desc: 'Discover your reading skills' },
    { icon: '🔍', label: 'Identify',    desc: 'Pinpoint exact gaps'           },
    { icon: '🎯', label: 'Personalize', desc: 'Get a plan built for you'      },
    { icon: '✏️', label: 'Practice',    desc: 'Work through targeted lessons' },
    { icon: '📈', label: 'Grow',        desc: 'Measure real progress'         },
  ]

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 xl:p-12 relative overflow-hidden"
      style={{ backgroundColor: C.dark, width: '42%', flexShrink: 0 }}
    >
      <img src="/assets/hero-image.png" alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        style={{ objectPosition: '60% center' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${C.dark}ee 0%, ${C.dark}bb 60%, ${C.mid}88 100%)` }} />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
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

        <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-snug mb-3">
          Your Reading Journey<br />
          <span style={{ color: C.gold }}>Starts Here.</span>
        </h2>
        <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-xs">
          Create your account and get a personalised reading assessment in minutes.
        </p>

        {/* Philosophy steps */}
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                style={{ backgroundColor: i === 4 ? `${C.gold}30` : 'rgba(255,255,255,0.1)' }}>
                {s.icon}
              </div>
              <div>
                <span className="text-xs font-bold" style={{ color: i === 4 ? C.gold : 'rgba(255,255,255,0.85)' }}>
                  {s.label}
                </span>
                <span className="text-xs text-white/45 ml-2">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xs text-white/35">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:text-white/70 transition-colors"
            style={{ color: C.gold }}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}

// ── Shared input wrapper (OUTSIDE component to prevent re-creation) ──
function InputRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border rounded-xl px-3.5 py-2.5 bg-white transition-all focus-within:shadow-sm"
      style={{ borderColor: '#e0e0e0' }}
      onFocus={e => (e.currentTarget.style.borderColor = C.mid)}
      onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}>
      {children}
    </div>
  )
}

function FieldIcon({ path }: { path: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" style={{ color: C.mid }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  )
}

// ─── Register page ────────────────────────────────────────────────
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [role, setRole] = useState<'STUDENT' | 'PARENT' | 'TEACHER'>('STUDENT')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', grade: 'GRADE_6',
  })
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  // ── All original validation + auth logic unchanged ───────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.firstName || !form.lastName || !form.email || !form.password)
      return setError('Please fill in all required fields.')
    if (form.password !== form.confirmPassword)
      return setError('Passwords do not match.')
    if (form.password.length < 8)
      return setError('Password must be at least 8 characters.')
    if (!/[A-Z]/.test(form.password))
      return setError('Password must contain at least one uppercase letter.')
    if (!/[a-z]/.test(form.password))
      return setError('Password must contain at least one lowercase letter.')
    if (!/[0-9]/.test(form.password))
      return setError('Password must contain at least one number.')
    setLoading(true)
    try {
      await register({ ...form, role, ...(role === 'STUDENT' ? { grade: form.grade } : {}) })
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh lg:h-dvh flex flex-col lg:flex-row overflow-hidden"
      style={{ backgroundColor: C.cream }}>

      <BrandPanel />

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-6 py-8 lg:overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-6 self-start">
          <div className="w-9 h-9 rounded-xl overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: `${C.mid}40` }}>
            <img src="/assets/hero-image.png" alt="LISAN"
              className="w-full h-full object-cover object-top"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <p className="font-extrabold text-base leading-none" style={{ color: C.dark }}>LiSAN</p>
            <p className="text-xs font-medium" style={{ color: C.mid }}>Read · Learn · Grow</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-md px-7 py-7">

          <h1 className="text-xl font-extrabold mb-0.5" style={{ color: C.dark }}>Create Your Account</h1>
          <p className="text-xs text-gray-500 mb-5">Start your personalised reading journey.</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {([
              { v: 'STUDENT', label: 'Student', emoji: '📖' },
              { v: 'PARENT',  label: 'Parent',  emoji: '👨‍👩‍👧' },
              { v: 'TEACHER', label: 'Teacher', emoji: '🧑‍🏫' },
            ] as const).map(r => (
              <button key={r.v} type="button" onClick={() => setRole(r.v)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all"
                style={{
                  borderColor: role === r.v ? C.mid : '#e5e7eb',
                  backgroundColor: role === r.v ? `${C.mid}12` : 'white',
                  color: role === r.v ? C.mid : '#6b7280',
                }}>
                <span className="text-lg">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-3 px-3 py-2.5 rounded-xl text-xs text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-2.5">
              <InputRow>
                <FieldIcon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <input value={form.firstName} onChange={set('firstName')}
                  placeholder="First name" autoFocus
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
              </InputRow>
              <InputRow>
                <input value={form.lastName} onChange={set('lastName')}
                  placeholder="Last name"
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
              </InputRow>
            </div>

            {/* Email */}
            <InputRow>
              <FieldIcon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="Email address" autoComplete="email"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
            </InputRow>

            {/* Grade (students only) */}
            {role === 'STUDENT' && (
              <div className="flex items-center gap-2.5 border rounded-xl px-3.5 py-2.5 bg-white"
                style={{ borderColor: '#e0e0e0' }}>
                <FieldIcon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                <select value={form.grade} onChange={set('grade')}
                  className="flex-1 text-sm text-gray-900 outline-none bg-transparent">
                  {gradeOptions().map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <InputRow>
              <FieldIcon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="Password (min 8 chars)" autoComplete="new-password"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPass(p => !p); }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d={showPass
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    } />
                </svg>
              </button>
            </InputRow>

            {/* Confirm password */}
            <InputRow>
              <FieldIcon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                onChange={set('confirmPassword')} placeholder="Confirm password" autoComplete="new-password"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(p => !p); }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d={showConfirm
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    } />
                </svg>
              </button>
            </InputRow>

            {/* Student hint */}
            {role === 'STUDENT' && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
                style={{ backgroundColor: `${C.mid}12`, border: `1px solid ${C.mid}30` }}>
                <span className="text-base flex-shrink-0">📋</span>
                <p style={{ color: C.dark }}>
                  <strong>What happens next?</strong> After registration you'll take a short reading
                  assessment — this builds your personalised learning plan.
                </p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-1"
              style={{ backgroundColor: C.dark }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
              ) : 'Create Account →'}
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold transition-colors hover:opacity-80"
              style={{ color: C.mid }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
