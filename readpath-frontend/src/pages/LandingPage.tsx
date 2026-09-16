import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  dark:   '#1a3a2a',
  mid:    '#2d6a4f',
  gold:   '#d4a017',
  cream:  '#f5f0e8',
  light:  '#e8f4f0',
} as const

// ─── Smooth-scroll helper ─────────────────────────────────────────
function scrollTo(id: string) {
  if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  const el = document.getElementById(id)
  if (!el) return
  const offset = 72 // navbar height
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

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

// ─── Section label ─────────────────────────────────────────────────
function Label({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: C.mid }}>
      {children}
    </p>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Home',     id: 'top'     },
  { label: 'About',    id: 'about'   },
  { label: 'Features', id: 'features'},
  { label: 'Pricing',  id: 'pricing' },
  { label: 'Contact',  id: 'contact' },
]

function Navbar({ user }: { user: { role: string } | null }) {
  const navigate        = useNavigate()
  const [active, setActive]     = useState('top')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  // Track active section on scroll
  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 10)
      const sections = ['contact', 'pricing', 'features', 'about']
      for (const id of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 100) { setActive(id); return }
      }
      setActive('top')
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLogo = () => {
    if (user) {
      switch (user.role) {
        case 'STUDENT': navigate('/student/dashboard'); break
        case 'PARENT':  navigate('/parent/dashboard');  break
        case 'TEACHER': navigate('/teacher/dashboard'); break
        case 'ADMIN':   navigate('/admin/dashboard');   break
        default:        navigate('/')
      }
    } else {
      scrollTo('top')
    }
  }

  const handleNavClick = (id: string) => {
    setOpen(false)
    scrollTo(id)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-xl' : ''}`}
      style={{ backgroundColor: C.dark }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button onClick={handleLogo} className="flex items-center gap-2.5 flex-shrink-0 focus:outline-none">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20 bg-white/10">
              <img src="/assets/hero-image.png" alt="LISAN"
                className="w-full h-full object-cover object-top"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-white text-lg leading-none tracking-wide">LISAN</p>
              <p className="text-xs font-medium" style={{ color: C.gold }}>Read · Learn · Grow</p>
            </div>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="relative text-sm font-medium transition-colors focus:outline-none"
                style={{ color: active === item.id ? C.gold : 'rgba(255,255,255,0.82)' }}
              >
                {item.label}
                {active === item.id && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: C.gold }} />
                )}
              </button>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard"
                className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.mid }}>
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login"
                  className="text-sm font-medium text-white/85 hover:text-white px-3 py-2 rounded-lg transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: C.mid }}>
                  Get Started →
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 px-4 pb-5 pt-3 space-y-1"
          style={{ backgroundColor: C.dark }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => handleNavClick(item.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                color: active === item.id ? C.gold : 'rgba(255,255,255,0.82)',
                backgroundColor: active === item.id ? 'rgba(255,255,255,0.07)' : 'transparent',
              }}>
              {item.label}
            </button>
          ))}
          <div className="flex gap-2 pt-3 border-t border-white/10">
            <Link to="/login" onClick={() => setOpen(false)}
              className="flex-1 text-center text-sm font-semibold text-white border border-white/25 px-4 py-2.5 rounded-xl transition-colors hover:bg-white/10">
              Login
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="flex-1 text-center text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.mid }}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="top" className="relative pt-16 overflow-hidden" style={{ minHeight: 520 }}>
      {/* Background */}
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${C.light} 0%, #f0f7f4 45%, #c8dfd5 100%)` }} />

      {/* Corner patterns */}
      <EthPattern className="absolute top-20 left-0 w-20 h-20 opacity-25" style={{ color: C.gold }} />
      <EthPattern className="absolute top-20 right-0 w-20 h-20 opacity-25" style={{ color: C.gold }} />

      {/* Photo — right half desktop */}
      <div className="absolute right-0 top-16 bottom-0 w-1/2 hidden lg:block overflow-hidden">
        <img
          src="/assets/hero-image.png"
          alt="Ethiopian girl reading a LISAN book with Axum obelisk in the background"
          className="w-full h-full object-cover"
          style={{ objectPosition: '60% center' }}
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
        />
        {/* Gradient fade left edge */}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${C.light} 0%, rgba(232,244,240,0.55) 28%, transparent 58%)` }} />
      </div>

      {/* Hero copy */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="lg:w-[52%]">
          <Label>WELCOME TO LISAN</Label>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5"
            style={{ color: C.dark }}>
            Better Readers<br />
            Brighter <span style={{ color: C.gold }}>Futures</span>
          </h1>
          <p className="text-base text-gray-600 mb-8 max-w-lg leading-relaxed">
            LISAN is an intelligent reading and literacy platform that helps students
            understand their reading ability, identify areas that need support, practice
            targeted skills, and measure their growth over time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register"
              className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-xl text-white shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.dark }}>
              Get Started Free →
            </Link>
            <button
              onClick={() => scrollTo('about')}
              className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-xl border-2 transition-colors hover:bg-white/50"
              style={{ borderColor: C.dark, color: C.dark }}>
              Learn More
            </button>
          </div>

          {/* Mobile photo */}
          <div className="lg:hidden mt-8 rounded-2xl overflow-hidden shadow-xl">
            <img src="/assets/hero-image.png" alt="Ethiopian girl reading a LISAN book"
              className="w-full object-cover"
              style={{ maxHeight: 260, objectPosition: '50% 18%' }}
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────
const PHILOSOPHY = [
  { step: 'Assess',      icon: '📋', desc: 'Evaluate each student across five core reading skills.' },
  { step: 'Identify',    icon: '🔍', desc: 'Pinpoint exactly where reading breaks down.' },
  { step: 'Personalize', icon: '🎯', desc: 'Build a learning path tailored to each student.' },
  { step: 'Practice',    icon: '✏️', desc: 'Work through targeted lessons and reading exercises.' },
  { step: 'Reassess',    icon: '📈', desc: 'Measure real improvement with a follow-up assessment.' },
  { step: 'Grow',        icon: '🌱', desc: 'Celebrate progress and continue to the next level.' },
]

function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Intro */}
        <div className="max-w-2xl mb-16">
          <Label>ABOUT LISAN</Label>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-5"
            style={{ color: C.dark }}>
            An Intelligent Platform for{' '}
            <span style={{ color: C.mid }}>Real Reading Growth</span>
          </h2>
          <p className="text-gray-600 leading-relaxed text-base">
            LISAN is an intelligent reading and literacy platform designed to help students
            understand their reading ability, identify areas that need support, practice
            targeted skills, and measure their growth over time. Every student learns
            differently — LISAN builds a personalised path for each one.
          </p>
        </div>

        {/* Philosophy flow */}
        <div className="mb-16">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">
            Core Philosophy
          </p>

          {/* Desktop: horizontal flow */}
          <div className="hidden sm:grid grid-cols-3 lg:grid-cols-6 gap-4">
            {PHILOSOPHY.map((p, i) => (
              <div key={p.step} className="flex flex-col items-center text-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0"
                  style={{ backgroundColor: i === 5 ? C.mid : C.light }}>
                  <span>{p.icon}</span>
                  {i < PHILOSOPHY.length - 1 && (
                    <span className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-gray-300 font-bold">›</span>
                  )}
                </div>
                <p className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: i === 5 ? C.mid : C.dark }}>
                  {p.step}
                </p>
                <p className="text-xs text-gray-500 leading-snug">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile: vertical list */}
          <div className="sm:hidden space-y-3">
            {PHILOSOPHY.map((p, i) => (
              <div key={p.step} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: i === 5 ? C.mid : C.light }}>
                  {p.icon}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: C.dark }}>{p.step}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founder card */}
        <div className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left — dark panel */}
            <div className="p-8 sm:p-10 flex flex-col justify-center"
              style={{ backgroundColor: C.dark }}>
              <EthPattern className="w-12 h-12 mb-6 opacity-30" style={{ color: C.gold }} />
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.gold }}>
                Founded by an Educator
              </p>
              <h3 className="text-2xl font-extrabold text-white mb-4 leading-snug">
                Built from the classroom.<br />Designed for the student.
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                LISAN was created by an educator who has spent over a decade in the classroom
                watching students struggle with reading — not because they lack ability, but
                because they lack a clear path. LISAN is that path.
              </p>
            </div>

            {/* Right — founder info */}
            <div className="p-8 sm:p-10 bg-white flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
                style={{ backgroundColor: C.light }}>
                👨‍🏫
              </div>
              <h4 className="text-xl font-extrabold mb-1" style={{ color: C.dark }}>Dr. Habtamu</h4>
              <p className="text-sm font-semibold mb-4" style={{ color: C.mid }}>
                Founder &amp; Educator
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: C.light }}>✓</span>
                  Over 10 years of teaching experience
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: C.light }}>✓</span>
                  Specialised in reading literacy development
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: C.light }}>✓</span>
                  Designed LISAN around real classroom needs
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────
const FEATURES_LIST = [
  {
    icon: '📋',
    title: 'Reading Assessments',
    color: C.light,
    accent: C.mid,
    bullets: [
      'Covers all five core reading skill areas',
      'Phonemic awareness, phonics, fluency, vocabulary, comprehension',
      'Results show strengths and exact gaps',
      'Reassessment tracks improvement over time',
    ],
  },
  {
    icon: '🎯',
    title: 'Personalized Learning',
    color: '#fff8e7',
    accent: C.gold,
    bullets: [
      'Each student gets a unique learning path',
      'Lessons matched to skill level and grade',
      'Week-by-week plan built from assessment results',
      'Adapts as the student improves',
    ],
  },
  {
    icon: '🎤',
    title: 'Voice Reading Practice',
    color: '#f0f4ff',
    accent: '#4f6ef7',
    bullets: [
      'Students read aloud and record themselves',
      'Fluency practice with real passages',
      'Teachers can review and give feedback',
      'Builds reading confidence through speaking',
    ],
  },
  {
    icon: '🤖',
    title: 'AI Learning Support',
    color: '#f8f0ff',
    accent: '#9b59b6',
    bullets: [
      'Ask questions about lessons and passages',
      'Get explanations tailored to your level',
      'Available anytime during practice sessions',
      'Guides thinking rather than giving direct answers',
    ],
  },
  {
    icon: '📈',
    title: 'Progress Tracking',
    color: '#e8f8f0',
    accent: C.mid,
    bullets: [
      'Detailed skill-by-skill progress charts',
      'Before and after assessment comparison',
      'Parents and teachers see the same data',
      'Badges and XP reward consistent effort',
    ],
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Parent & Teacher Dashboard',
    color: '#fff3f0',
    accent: '#e05a2b',
    bullets: [
      'Parents monitor their child\'s progress in real time',
      'Teachers see their whole class at a glance',
      'Flag students who need additional support',
      'Assignment and content management for admins',
    ],
  },
]

function Features() {
  return (
    <section id="features" className="py-20" style={{ backgroundColor: '#f7f9f8' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <Label>FEATURES</Label>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: C.dark }}>
            Everything a Student Needs to{' '}
            <span style={{ color: C.mid }}>Read Better</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            LISAN brings assessment, personalised lessons, voice practice, AI support,
            and progress tracking into one cohesive platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES_LIST.map(f => (
            <div key={f.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              {/* Icon badge */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 flex-shrink-0"
                style={{ backgroundColor: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-base mb-3" style={{ color: C.dark }}>{f.title}</h3>
              <ul className="space-y-1.5">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: f.color, color: f.accent }}>
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-12 text-center">
          <Link to="/register"
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3.5 rounded-xl text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: C.dark }}>
            Start for Free →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────

// ── Assessment service cards ──────────────────────────────────────
const ASSESSMENT_CARDS = [
  {
    name: 'Reading Check',
    price: '500',
    desc: 'A quick picture of your child\'s reading ability.',
    deliverable: '1-page result summary',
    cta: 'Get Started',
    ctaTo: '/register' as string | null,
    highlight: false,
    features: [
      '20–30 minute assessment',
      'Oral reading',
      'Reading accuracy',
      'Fluency',
      'Basic comprehension',
      'Vocabulary check',
      'Brief feedback to parent',
    ],
  },
  {
    name: 'Reading Diagnostic Assessment',
    price: '1,000',
    desc: 'Know exactly where your child is — and what to do next.',
    deliverable: 'Detailed written report + 20–30 min consultation',
    cta: 'Book Assessment',
    ctaTo: '/register' as string | null,
    highlight: true,
    tag: '⭐ Recommended',
    features: [
      '45–60 minute individual assessment',
      'Oral reading assessment',
      'Reading accuracy & fluency / WCPM',
      'Error analysis',
      'Vocabulary & comprehension',
      'Phonological / phonemic awareness',
      'Word recognition & decoding',
      'Short written reading task',
      'Parent / student interview',
      'Systematic error analysis',
      'Strengths and weaknesses',
      'Identified reading difficulties',
      'Recommended intervention plan',
      '20–30 minute feedback consultation',
    ],
  },
  {
    name: 'Reading Intervention Plan',
    price: '1,500',
    desc: 'Turn assessment results into a clear plan for improvement.',
    deliverable: 'Written 4-week intervention plan',
    cta: 'Get Started',
    ctaTo: '/register' as string | null,
    highlight: false,
    features: [
      'Individual reading profile',
      '4-week intervention plan',
      'Specific learning objectives',
      'Recommended activities',
      'Home reading activities',
      'Parent guidance',
      'Progress-monitoring form',
    ],
  },
]

// ── Monthly support packages ──────────────────────────────────────
const MONTHLY_PACKAGES = [
  {
    name: 'Starter',
    sessions: '4 × 45-min sessions',
    price: '2,000',
    highlight: false,
    tag: null as string | null,
    features: [
      '4 individual reading sessions',
      'Personalised lessons',
      'Fluency practice',
      'Home reading activities',
    ],
  },
  {
    name: 'Growth',
    sessions: '8 × 45-min sessions',
    price: '3,800',
    highlight: true,
    tag: '⭐ Recommended',
    features: [
      '8 individual reading sessions',
      'Personalised lessons',
      'Fluency practice',
      'Vocabulary development',
      'Comprehension strategies',
      'Error correction',
      'Home reading activities',
      'Parent update',
      'Monthly progress check',
    ],
  },
  {
    name: 'Intensive',
    sessions: '12 × 45-min sessions',
    price: '5,400',
    highlight: false,
    tag: null as string | null,
    features: [
      '12 individual reading sessions',
      'Personalised lessons',
      'Fluency practice',
      'Vocabulary development',
      'Comprehension strategies',
      'Error correction',
      'Home reading activities',
      'Parent update',
      'Monthly progress check',
    ],
  },
  {
    name: 'Premium',
    sessions: '16 × 45-min sessions',
    price: '7,000',
    highlight: false,
    tag: null as string | null,
    features: [
      '16 individual reading sessions',
      'Full personalised programme',
      'Fluency & accuracy focus',
      'Vocabulary development',
      'Comprehension strategies',
      'Detailed error correction',
      'Home reading activities',
      'Weekly parent update',
      'Monthly progress check',
    ],
  },
]

// ── Shared card sub-components ────────────────────────────────────
function CheckItem({ text, highlight }: { text: string; highlight: boolean }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600">
      <span
        className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{
          backgroundColor: highlight ? `${C.mid}20` : C.light,
          color: highlight ? C.mid : C.dark,
        }}
      >
        ✓
      </span>
      {text}
    </li>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Section header ── */}
        <div className="text-center mb-4">
          <Label>PRICING</Label>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3" style={{ color: C.dark }}>
            Professional assessment, personalised intervention,
            <br className="hidden sm:block" /> and measurable progress.
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed mb-2">
            All prices in Ethiopian Birr (ETB). Payment is confirmed manually — our team will
            contact you to complete your booking.
          </p>
        </div>

        {/* ── Assessment & Service Cards ── */}
        <div className="mb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start pt-6">
            {ASSESSMENT_CARDS.map(card => (
              <div
                key={card.name}
                className={`relative rounded-2xl border flex flex-col transition-shadow hover:shadow-lg ${
                  card.highlight
                    ? 'shadow-xl'
                    : 'shadow-sm border-gray-100 bg-white'
                }`}
                style={card.highlight ? {
                  borderColor: C.mid,
                  background: `linear-gradient(160deg, #ffffff 0%, ${C.light} 100%)`,
                } : undefined}
              >
                {/* Badge */}
                {'tag' in card && card.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-md whitespace-nowrap"
                      style={{ backgroundColor: C.gold }}>
                      {card.tag}
                    </span>
                  </div>
                )}

                {/* Top accent bar for highlighted card */}
                {card.highlight && (
                  <div className="h-1 rounded-t-2xl" style={{ backgroundColor: C.mid }} />
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Name + price */}
                  <div className="mb-4">
                    <p className="font-extrabold text-base mb-1" style={{ color: C.dark }}>{card.name}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xs font-semibold text-gray-400 self-start mt-1">ETB</span>
                      <span className="text-3xl font-extrabold"
                        style={{ color: card.highlight ? C.mid : C.dark }}>
                        {card.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 italic leading-snug">{card.desc}</p>
                  </div>

                  <div className="h-px mb-4" style={{ backgroundColor: card.highlight ? `${C.mid}25` : '#f0f0f0' }} />

                  {/* Features */}
                  <ul className="space-y-2 mb-4 flex-1">
                    {card.features.map(f => (
                      <CheckItem key={f} text={f} highlight={card.highlight} />
                    ))}
                  </ul>

                  {/* Deliverable note */}
                  <div className="mb-4 px-3 py-2 rounded-xl text-xs text-gray-500 leading-snug"
                    style={{ backgroundColor: card.highlight ? `${C.mid}10` : '#f7f9f8' }}>
                    <span className="font-semibold" style={{ color: card.highlight ? C.mid : C.dark }}>
                      Deliverable:{' '}
                    </span>
                    {card.deliverable}
                  </div>

                  {/* CTA */}
                  {card.ctaTo ? (
                    <Link to={card.ctaTo}
                      className="block text-center text-sm font-bold py-3 rounded-xl transition-opacity hover:opacity-90 text-white"
                      style={{ backgroundColor: card.highlight ? C.mid : C.dark }}>
                      {card.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={() => scrollTo('contact')}
                      className="w-full text-center text-sm font-bold py-3 rounded-xl border-2 transition-colors"
                      style={{ borderColor: C.dark, color: C.dark }}>
                      {card.cta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Monthly Reading Support ── */}
        <div className="pt-4">
          {/* Sub-heading */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 flex-shrink-0" style={{ backgroundColor: C.gold }} />
              <EthPattern className="w-8 h-8 opacity-30" style={{ color: C.dark }} />
              <div className="h-px w-12 flex-shrink-0" style={{ backgroundColor: C.gold }} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: C.dark }}>
              Monthly Reading Support
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Ongoing sessions for consistent progress and growth.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {MONTHLY_PACKAGES.map(pkg => (
              <div
                key={pkg.name}
                className={`relative rounded-2xl border flex flex-col transition-shadow hover:shadow-lg ${
                  pkg.highlight ? 'shadow-xl' : 'shadow-sm border-gray-100 bg-white'
                }`}
                style={pkg.highlight ? {
                  borderColor: C.mid,
                  background: `linear-gradient(160deg, #ffffff 0%, ${C.light} 100%)`,
                } : undefined}
              >
                {/* Badge */}
                {pkg.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-md whitespace-nowrap"
                      style={{ backgroundColor: C.gold }}>
                      {pkg.tag}
                    </span>
                  </div>
                )}

                {pkg.highlight && (
                  <div className="h-1 rounded-t-2xl" style={{ backgroundColor: C.mid }} />
                )}

                <div className="p-5 flex flex-col flex-1">
                  <p className="font-extrabold text-base mb-0.5" style={{ color: C.dark }}>{pkg.name}</p>
                  <p className="text-xs text-gray-400 mb-3">{pkg.sessions}</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-xs font-semibold text-gray-400 self-start mt-1">ETB</span>
                    <span className="text-3xl font-extrabold"
                      style={{ color: pkg.highlight ? C.mid : C.dark }}>
                      {pkg.price}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">/ month</span>
                  </div>

                  <div className="h-px mb-4" style={{ backgroundColor: pkg.highlight ? `${C.mid}25` : '#f0f0f0' }} />

                  <ul className="space-y-2 mb-5 flex-1">
                    {pkg.features.map(f => (
                      <CheckItem key={f} text={f} highlight={pkg.highlight} />
                    ))}
                  </ul>

                  <button
                    onClick={() => scrollTo('contact')}
                    className="w-full text-center text-sm font-bold py-3 rounded-xl transition-opacity hover:opacity-90 text-white"
                    style={{ backgroundColor: pkg.highlight ? C.mid : C.dark }}>
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform plans note */}
        <div className="mt-14 pt-10 border-t border-gray-100">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
            Platform Subscriptions
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Free',                 price: '0',      period: 'forever',    cta: 'Get Started', ctaTo: '/register' as string | null, highlight: false },
              { name: 'Student',              price: '1,500',  period: 'per month',  cta: 'Get Started', ctaTo: '/register' as string | null, highlight: true  },
              { name: 'Family',               price: '2,500',  period: 'per month',  cta: 'Get Started', ctaTo: '/register' as string | null, highlight: false },
              { name: 'School / Organization',price: 'Custom', period: 'pricing',    cta: 'Contact Us',  ctaTo: null,                         highlight: false },
            ].map(p => (
              <div key={p.name}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
                  p.highlight ? 'shadow-md' : 'shadow-sm border-gray-100 bg-white'
                }`}
                style={p.highlight ? { borderColor: C.mid, background: `linear-gradient(160deg,#fff 0%,${C.light} 100%)` } : undefined}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: C.mid }}>Recommended</span>
                )}
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>{p.name}</p>
                  <div className="flex items-baseline gap-1">
                    {p.price === 'Custom'
                      ? <span className="text-xl font-extrabold" style={{ color: C.mid }}>Custom</span>
                      : <>
                          <span className="text-xs text-gray-400 self-start mt-0.5">ETB</span>
                          <span className="text-2xl font-extrabold" style={{ color: p.highlight ? C.mid : C.dark }}>{p.price}</span>
                        </>
                    }
                    <span className="text-xs text-gray-400 ml-1">{p.period}</span>
                  </div>
                </div>
                {p.ctaTo
                  ? <Link to={p.ctaTo} className="block text-center text-xs font-bold py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: p.highlight ? C.mid : C.dark }}>{p.cta}</Link>
                  : <button onClick={() => scrollTo('contact')}
                      className="w-full text-center text-xs font-bold py-2.5 rounded-xl border-2 transition-colors"
                      style={{ borderColor: C.dark, color: C.dark }}>{p.cta}</button>
                }
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Contact ──────────────────────────────────────────────────────
type FormState = { name: string; email: string; subject: string; message: string }
type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

function Contact() {
  const [form, setForm]       = useState<FormState>({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors]   = useState<Partial<FormState>>({})
  const [status, setStatus]   = useState<FormStatus>('idle')
  const [serverMsg, setMsg]   = useState('')

  const set = (k: keyof FormState, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: undefined }))
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return

    // Client-side validation
    const errs: Partial<FormState> = {}
    if (!form.name.trim())    errs.name    = 'Your name is required.'
    if (!form.email.trim())   errs.email   = 'Your email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email.'
    if (!form.message.trim()) errs.message = 'Please enter a message.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setStatus('submitting')
    try {
      const res  = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const json = await res.json()

      if (res.ok && json.success) {
        setStatus('success')
        setMsg(json.message)
        setForm({ name: '', email: '', subject: '', message: '' })
      } else if (res.status === 422 && json.errors) {
        setErrors(json.errors)
        setStatus('idle')
      } else {
        setStatus('error')
        setMsg(json.message ?? 'Something went wrong. Please email directly.')
      }
    } catch {
      setStatus('error')
      setMsg('Could not reach the server. Please email HABTAMUGEBREKIDAN@GMAIL.COM directly.')
    }
  }, [form, status])

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-200 focus:ring-brand-400 focus:border-transparent'
    }`

  return (
    <section id="contact" className="py-20" style={{ backgroundColor: '#f7f9f8' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-14">
          <Label>CONTACT</Label>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: C.dark }}>
            Get in <span style={{ color: C.mid }}>Touch</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Have a question about LISAN? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">

          {/* Contact info card */}
          <div className="md:col-span-2 rounded-3xl overflow-hidden shadow-md"
            style={{ backgroundColor: C.dark }}>
            <div className="p-8">
              <EthPattern className="w-10 h-10 mb-6 opacity-25" style={{ color: C.gold }} />

              <h3 className="text-xl font-extrabold text-white mb-1">Dr. Habtamu</h3>
              <p className="text-sm font-medium mb-6" style={{ color: C.gold }}>
                Founder &amp; Educator
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-base">✉️</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-0.5">Email</p>
                    <a href="mailto:HABTAMUGEBREKIDAN@GMAIL.COM"
                      className="text-sm text-white/85 hover:text-white transition-colors break-all">
                      HABTAMUGEBREKIDAN@GMAIL.COM
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-base">📞</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-0.5">Phone</p>
                    <a href="tel:0927417210"
                      className="text-sm text-white/85 hover:text-white transition-colors">
                      0927417210
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-base">🎓</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-0.5">Experience</p>
                    <p className="text-sm text-white/85">Over 10 years of teaching experience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ backgroundColor: C.light }}>
                  ✅
                </div>
                <h4 className="font-bold text-lg" style={{ color: C.dark }}>Message Sent</h4>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{serverMsg}</p>
                <button onClick={() => setStatus('idle')}
                  className="text-sm font-semibold px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: C.mid }}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Full name"
                      className={inputClass('name')}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass('email')}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Subject <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => set('subject', e.target.value)}
                    placeholder="e.g. School subscription inquiry"
                    className={inputClass('subject')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    rows={5}
                    placeholder="Write your message here…"
                    className={`${inputClass('message')} resize-none`}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                {status === 'error' && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                    {serverMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: C.dark }}
                >
                  {status === 'submitting' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────
const FOOTER_QUICK = [
  { label: 'Home',     id: 'top' },
  { label: 'About',    id: 'about' },
  { label: 'Features', id: 'features' },
  { label: 'Pricing',  id: 'pricing' },
  { label: 'Contact',  id: 'contact' },
]

const FOOTER_LEARNERS = [
  { label: 'Student Login', to: '/login' },
  { label: 'Learn',         to: '/student/dashboard' },
  { label: 'Practice',      to: '/student/dashboard' },
  { label: 'Assessments',   to: '/student/assessment' },
]

const FOOTER_EDUCATORS = [
  { label: 'Teacher Login', to: '/login' },
  { label: 'Admin Login',   to: '/login' },
  { label: 'Analytics',     to: '/admin/dashboard' },
  { label: 'Support',       id: 'contact' },
]

function Footer() {
  return (
    <footer style={{ backgroundColor: C.dark }}>
      {/* Ethiopian pattern stripe */}
      <div className="overflow-hidden" style={{ height: 8 }}>
        <div className="flex h-full">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex-1" style={{
              backgroundColor: i % 4 === 0 ? C.gold : i % 4 === 1 ? C.mid : i % 4 === 2 ? '#4f6ef7' : '#9b59b6'
            }} />
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <button onClick={() => scrollTo('top')} className="flex items-center gap-2 mb-4 focus:outline-none">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 flex-shrink-0 bg-white/10">
                <img src="/assets/hero-image.png" alt="LISAN"
                  className="w-full h-full object-cover object-top"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div>
                <p className="font-bold text-white leading-none">LISAN</p>
                <p className="text-xs" style={{ color: C.gold }}>Read · Learn · Grow</p>
              </div>
            </button>
            <p className="text-xs text-white/55 leading-relaxed max-w-[200px]">
              Empowering learners with the skills to read, learn, and build a brighter future.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Quick Links</p>
            <ul className="space-y-2">
              {FOOTER_QUICK.map(l => (
                <li key={l.label}>
                  <button onClick={() => scrollTo(l.id)}
                    className="text-sm text-white/65 hover:text-white transition-colors text-left">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* For Learners */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">For Learners</p>
            <ul className="space-y-2">
              {FOOTER_LEARNERS.map(l => (
                <li key={l.label}>
                  <Link to={l.to}
                    className="text-sm text-white/65 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Educators */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">For Educators</p>
            <ul className="space-y-2">
              {FOOTER_EDUCATORS.map(l => (
                <li key={l.label}>
                  {'to' in l ? (
                    <Link to={l.to as string}
                      className="text-sm text-white/65 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  ) : (
                    <button onClick={() => scrollTo((l as { id: string }).id)}
                      className="text-sm text-white/65 hover:text-white transition-colors text-left">
                      {l.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Contact</p>
            <ul className="space-y-3">
              <li className="text-sm text-white/65 font-medium">Dr. Habtamu</li>
              <li>
                <a href="mailto:HABTAMUGEBREKIDAN@GMAIL.COM"
                  className="text-xs text-white/55 hover:text-white transition-colors break-all leading-relaxed">
                  HABTAMUGEBREKIDAN@GMAIL.COM
                </a>
              </li>
              <li>
                <a href="tel:0927417210"
                  className="text-sm text-white/65 hover:text-white transition-colors">
                  0927417210
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/35">© 2026 LISAN. All rights reserved.</p>
          <div className="flex gap-5">
            {/* These routes don't exist yet — rendered as plain text until pages are built */}
            <span className="text-xs text-white/35 cursor-default">Privacy Policy</span>
            <span className="text-xs text-white/35 cursor-default">Terms of Service</span>
            <button onClick={() => scrollTo('contact')}
              className="text-xs text-white/35 hover:text-white/70 transition-colors">
              Help
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth()
  const hasScrolled = useRef(false)

  useEffect(() => {
    if (!hasScrolled.current) {
      window.scrollTo(0, 0)
      hasScrolled.current = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar user={user} />
      <main>
        <Hero />
        <About />
        <Features />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
