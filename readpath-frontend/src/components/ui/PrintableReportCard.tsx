import React, { useRef } from 'react'

export interface ReportCardData {
  studentName: string
  grade: string
  readinessScore: number
  targetGrade?: string
  date?: string
  phonemicAwareness: number
  phonicsDecoding: number
  fluency: number
  vocabulary: number
  comprehension: number
  wcpm?: number
  accuracy?: number
  teacherNote?: string
  strengths?: string[]
  growthPoints?: string[]
}

interface PrintableReportCardProps {
  open: boolean
  onClose: () => void
  data: ReportCardData
}

export default function PrintableReportCard({
  open,
  onClose,
  data,
}: PrintableReportCardProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  if (!open) return null

  const handlePrint = () => {
    window.print()
  }

  const certificateId = `LISAN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const formattedDate = data.date || new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const getReadinessLevel = (score: number) => {
    if (score >= 85) return { title: 'Advanced Reading Readiness', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' }
    if (score >= 70) return { title: 'Proficient / On Track', color: 'text-brand-800', bg: 'bg-brand-50 border-brand-300' }
    if (score >= 50) return { title: 'Developing / Building Foundations', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-300' }
    return { title: 'Emerging Reader / Priority Support', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-300' }
  }

  const level = getReadinessLevel(data.readinessScore)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      
      {/* ── Modal Outer Container ── */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Screen Action Bar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <p className="font-bold text-sm leading-tight">Official Diagnostic Progress Certificate</p>
              <p className="text-xs text-gray-400">Print or Save as PDF for school dossiers & parents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>🖨️</span> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-colors text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Certificate Document (Target for Print) ── */}
        <div
          ref={reportRef}
          className="printable-certificate p-6 sm:p-10 bg-[#fdfbf7] text-gray-900 font-serif border-[12px] border-[#1a3a2a] relative overflow-hidden print:border-8 print:p-8"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#d4a017]" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#d4a017]" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#d4a017]" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#d4a017]" />

          {/* Certificate Header */}
          <div className="text-center pb-6 border-b-2 border-[#d4a017]/40 relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#1a3a2a] bg-[#1a3a2a] flex items-center justify-center text-white font-bold text-xl">
                ል
              </div>
              <div className="text-left font-sans">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1a3a2a] tracking-wider leading-none">
                  LISAN ACADEMY
                </h1>
                <p className="text-xs font-semibold text-[#d4a017] tracking-widest uppercase mt-0.5">
                  Reading Diagnostic & Literacy Platform
                </p>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-[#1a3a2a] mt-3">
              Official Reading Diagnostic Report & Certificate
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Verified Evaluation Document · Certificate No: <span className="font-mono font-semibold text-gray-700">{certificateId}</span>
            </p>
          </div>

          {/* Student Banner */}
          <div className="py-6 text-center">
            <p className="text-xs uppercase font-sans tracking-widest text-gray-400 mb-1">This certifies that</p>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-[#1a3a2a] tracking-tight">
              {data.studentName}
            </h3>
            <p className="text-sm font-sans text-gray-600 mt-1">
              Grade: <strong>{data.grade.replace('GRADE_', '')}</strong> · Evaluated on: <strong>{formattedDate}</strong>
            </p>

            {/* Overall Score Badge */}
            <div className="mt-5 inline-flex items-center gap-4 px-6 py-3 rounded-2xl border-2 shadow-xs" style={{ borderColor: '#d4a017', backgroundColor: '#fffdf5' }}>
              <div className="text-left font-sans">
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Overall Readiness Score</span>
                <span className="text-3xl font-black text-[#1a3a2a] leading-none">{data.readinessScore}</span>
                <span className="text-xs text-gray-400"> / 100</span>
              </div>
              <div className="h-10 w-[1px] bg-[#d4a017]/40" />
              <div className="text-left font-sans">
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Classification</span>
                <span className={`text-sm font-bold ${level.color}`}>{level.title}</span>
              </div>
            </div>
          </div>

          {/* 5-Pillar Literacy Breakdown */}
          <div className="my-6 p-5 bg-white rounded-2xl border border-gray-200 font-sans shadow-xs">
            <h4 className="text-xs font-bold text-[#1a3a2a] uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Five Foundational Reading Pillars</span>
              <span className="text-gray-400 font-normal">Individual Skill Scores</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Phonemic Awareness (Sounds & Blends)', score: data.phonemicAwareness, icon: '🔊' },
                { label: 'Phonics & Word Decoding', score: data.phonicsDecoding, icon: '🔤' },
                { label: 'Reading Fluency & Pacing', score: data.fluency, icon: '🎤' },
                { label: 'Vocabulary & Context Meaning', score: data.vocabulary, icon: '📚' },
                { label: 'Reading Comprehension', score: data.comprehension, icon: '🧠' },
              ].map(skill => (
                <div key={skill.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <span>{skill.icon}</span> {skill.label}
                    </span>
                    <span className={`font-bold ${skill.score >= 75 ? 'text-emerald-700' : skill.score >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>
                      {skill.score}/100
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        skill.score >= 75 ? 'bg-emerald-600' : skill.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(skill.score, 100)}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Extra Fluency stats box */}
              <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">WCPM</span>
                  <span className="text-lg font-black text-brand-800">{data.wcpm || '—'}</span>
                  <span className="text-[9px] text-gray-400 block">Words/Min</span>
                </div>
                <div className="h-6 w-[1px] bg-brand-200" />
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Accuracy</span>
                  <span className="text-lg font-black text-brand-800">{data.accuracy ? `${data.accuracy}%` : '—'}</span>
                  <span className="text-[9px] text-gray-400 block">Decoding Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher / Evaluator Comments */}
          {data.teacherNote && (
            <div className="mb-6 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl font-sans text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                Teacher & Diagnostic Notes
              </span>
              <p className="text-gray-800 leading-relaxed italic">
                "{data.teacherNote}"
              </p>
            </div>
          )}

          {/* Signatures & Seal */}
          <div className="pt-6 border-t-2 border-[#d4a017]/30 grid grid-cols-3 items-end text-center font-sans">
            <div>
              <div className="h-10 flex items-center justify-center font-serif text-lg text-gray-700 italic border-b border-gray-400 mx-4">
                Dr. Habtamu G.
              </div>
              <p className="text-[11px] font-bold text-gray-900 mt-1">Dr. Habtamu Gebrekidan</p>
              <p className="text-[9px] text-gray-500">Lead Literacy Specialist & Founder</p>
            </div>

            {/* Gold Verified Seal */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-[#d4a017] bg-[#fffdf5] flex flex-col items-center justify-center text-[#1a3a2a] shadow-md">
                <span className="text-base font-black">★</span>
                <span className="text-[8px] font-extrabold tracking-tighter uppercase">VERIFIED</span>
              </div>
              <span className="text-[9px] text-gray-400 mt-1 font-mono">LiSAN Platform</span>
            </div>

            <div>
              <div className="h-10 flex items-center justify-center font-serif text-lg text-gray-700 italic border-b border-gray-400 mx-4">
                Assigned Instructor
              </div>
              <p className="text-[11px] font-bold text-gray-900 mt-1">Classroom Instructor</p>
              <p className="text-[9px] text-gray-500">Reading Assessment Division</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
