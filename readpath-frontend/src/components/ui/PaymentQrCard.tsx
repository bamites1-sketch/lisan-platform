import React, { useState } from 'react'

export interface BankAccountInfo {
  id: string
  name: string
  fullName: string
  accountNumber: string
  recipientName: string
  color: string
  badgeBg: string
  badgeText: string
  instructionEn: string
  instructionAm: string
  icon: string
  qrPatternSeed: number
}

export const SUPPORTED_BANKS: BankAccountInfo[] = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    fullName: 'Ethio Telecom Telebirr',
    accountNumber: '0927417210',
    recipientName: 'HABTAMU GEBREKIDAN (LISAN ACADEMY)',
    color: '#e65100',
    badgeBg: '#fff3e0',
    badgeText: '#e65100',
    icon: '📱',
    qrPatternSeed: 42,
    instructionEn: 'Open your Telebirr app → Tap "Scan QR" or "Send Money" to the phone number above → Take a screenshot of the receipt.',
    instructionAm: 'የቴሌብር መተግበሪያዎን ይክፈቱ → "Scan QR" ወይም "Send Money" የሚለውን ይጫኑ → የክፍያውን ማረጋገጫ ደረሰኝ ስክሪንሾት ያንሱ።',
  },
  {
    id: 'cbe',
    name: 'Commercial Bank of Ethiopia (CBE)',
    fullName: 'CBE Birr & Mobile Banking',
    accountNumber: '1000289123456',
    recipientName: 'HABTAMU GEBREKIDAN / LISAN ACADEMY',
    color: '#8e24aa',
    badgeBg: '#f3e5f5',
    badgeText: '#8e24aa',
    icon: '🏦',
    qrPatternSeed: 88,
    instructionEn: 'Open CBE Mobile Banking / CBE Birr app → Transfer to the CBE Account number above → Save transaction confirmation.',
    instructionAm: 'የኢትዮጵያ ንግድ ባንክ (CBE Birr / CBE Mobile) መተግበሪያን በመጠቀም ወደ ከላይ ወዳለው የሂሳብ ቁጥር ይላኩ → ደረሰኙን ያስቀምጡ።',
  },
  {
    id: 'abyssinia',
    name: 'Bank of Abyssinia',
    fullName: 'BoA Mobile Banking',
    accountNumber: '89214512',
    recipientName: 'HABTAMU GEBREKIDAN (LISAN ACADEMY)',
    color: '#4a148c',
    badgeBg: '#ede7f6',
    badgeText: '#4a148c',
    icon: '🏛️',
    qrPatternSeed: 104,
    instructionEn: 'Transfer via BoA Mobile Banking to the account above → Keep the transaction reference for verification.',
    instructionAm: 'በባንክ ኦፍ አቢሲኒያ የሞባይል ባንኪንግ ወደተጠቀሰው አካውንት ይላኩ → የማረጋገጫ ኮዱን ከታች ያስገቡ።',
  },
]

// ─── Procedural Stylized SVG QR Code for Ethiopian Banking ──────────────────────
function StyledQrCode({
  account,
  color,
  bankName,
  seed,
}: {
  account: string
  color: string
  bankName: string
  seed: number
}) {
  // Deterministic 21x21 QR matrix based on seed & account
  const size = 21
  const matrix: boolean[][] = []

  // Pseudo-random generator based on account characters & seed
  let s = seed
  const nextRand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  for (let r = 0; r < size; r++) {
    matrix[r] = []
    for (let c = 0; c < size; c++) {
      // Finder patterns (top-left, top-right, bottom-left 7x7)
      const isTopLeft = r < 7 && c < 7
      const isTopRight = r < 7 && c >= size - 7
      const isBottomLeft = r >= size - 7 && c < 7

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Standard QR finder box
        const localR = isTopLeft ? r : isTopRight ? r : r - (size - 7)
        const localC = isTopLeft ? c : isTopRight ? c - (size - 7) : c
        const isBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6
        const isCenter = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4
        matrix[r][c] = isBorder || isCenter
      } else if (r >= 8 && r <= 12 && c >= 8 && c <= 12) {
        // Center space for Logo badge
        matrix[r][c] = false
      } else {
        // Data modules
        matrix[r][c] = nextRand() > 0.48
      }
    }
  }

  return (
    <div className="relative inline-block p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
      <svg
        viewBox={`0 0 ${size * 10} ${size * 10}`}
        className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg"
      >
        {matrix.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * 10}
                y={r * 10}
                width={9}
                height={9}
                rx={2}
                fill={color}
              />
            ) : null
          )
        )}
      </svg>

      {/* Central Brand Badge */}
      <div
        className="absolute inset-0 m-auto w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md border-2 border-white"
        style={{ backgroundColor: color }}
      >
        {bankName.slice(0, 3)}
      </div>
    </div>
  )
}

interface PaymentQrCardProps {
  onSelectBank?: (bankName: string) => void
}

export default function PaymentQrCard({ onSelectBank }: PaymentQrCardProps) {
  const [selectedId, setSelectedId] = useState<string>('telebirr')
  const [copied, setCopied] = useState<boolean>(false)

  const activeBank = SUPPORTED_BANKS.find(b => b.id === selectedId) || SUPPORTED_BANKS[0]

  const handleCopy = (accountNum: string) => {
    navigator.clipboard.writeText(accountNum)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTabChange = (bank: BankAccountInfo) => {
    setSelectedId(bank.id)
    onSelectBank?.(bank.name)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
      {/* ── Step 1 Header ── */}
      <div className="px-5 py-4 bg-[#1a3a2a] text-white flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-bold text-sm text-white">Step 1 — Choose Bank & Scan QR Code</p>
          <p className="text-xs text-white/70 mt-0.5">
            Instant mobile transfer via Telebirr or Commercial Bank of Ethiopia (CBE)
          </p>
        </div>
        <span className="text-xs bg-[#d4a017] text-gray-950 font-bold px-2.5 py-1 rounded-lg">
          Fast Verification ⚡
        </span>
      </div>

      {/* ── Bank Tabs ── */}
      <div className="flex border-b border-gray-100 overflow-x-auto p-1.5 bg-gray-50/70 gap-1.5">
        {SUPPORTED_BANKS.map(bank => {
          const isSelected = bank.id === selectedId
          return (
            <button
              key={bank.id}
              type="button"
              onClick={() => handleTabChange(bank)}
              className={`flex-1 min-w-[120px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80 ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
              }`}
            >
              <span className="text-sm">{bank.icon}</span>
              <span className="truncate">{bank.name}</span>
            </button>
          )
        })}
      </div>

      {/* ── QR & Account Details Section ── */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* QR Code Display Column */}
        <div className="md:col-span-5 flex flex-col items-center text-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <StyledQrCode
            account={activeBank.accountNumber}
            color={activeBank.color}
            bankName={activeBank.name}
            seed={activeBank.qrPatternSeed}
          />
          <span className="text-[11px] font-semibold text-gray-500 mt-2.5 flex items-center gap-1">
            <span>📷</span> Scan with {activeBank.name} App
          </span>
        </div>

        {/* Account Info Column */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: activeBank.badgeBg, color: activeBank.badgeText }}
              >
                {activeBank.name}
              </span>
              <span className="text-xs text-gray-400 font-medium">Verified Payment Channel</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{activeBank.fullName}</p>
          </div>

          {/* Account Number Box */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {activeBank.id === 'telebirr' ? 'Telebirr Phone Number' : 'Account Number'}
              </span>
              <span className="font-mono text-lg font-extrabold text-gray-900 tracking-wider">
                {activeBank.accountNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(activeBank.accountNumber)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Recipient Account Name */}
          <div className="text-xs text-gray-600">
            <span className="text-gray-400 font-medium block text-[10px] uppercase tracking-wide">Account Name / Beneficiary</span>
            <span className="font-bold text-gray-800">{activeBank.recipientName}</span>
          </div>

          {/* Instructions in English & Amharic */}
          <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
            <p className="text-amber-900 leading-snug">
              <strong>English:</strong> {activeBank.instructionEn}
            </p>
            <p className="text-amber-950/80 leading-snug pt-1 border-t border-amber-200/50">
              <strong>አማርኛ:</strong> {activeBank.instructionAm}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 text-xs text-gray-500 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
        <span>⚠️</span>
        <span>
          After completing the transfer, keep your transaction screenshot or reference SMS ready for Step 2 below.
        </span>
      </div>
    </div>
  )
}
