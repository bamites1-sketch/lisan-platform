import { useState, useEffect } from 'react'

export interface BankAccountInfo {
  id: string
  name: string
  methodValue: string
  fullName: string
  accountNumber: string
  recipientName: string
  color: string
  badgeBg: string
  badgeText: string
  instructionEn: string
  instructionAm: string
  icon: string
  typeBadge: string
  qrPatternSeed?: number
}

export const SUPPORTED_BANKS: BankAccountInfo[] = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    methodValue: 'Telebirr',
    fullName: 'Ethio Telecom Telebirr',
    accountNumber: '0927417210',
    recipientName: 'HABTAMU GEBREKIDAN (LISAN ACADEMY)',
    color: '#ea580c',
    badgeBg: '#fff7ed',
    badgeText: '#c2410c',
    icon: '📱',
    typeBadge: 'Mobile Money',
    instructionEn: 'Open Telebirr app → Tap "Send Money" → Enter phone number 0927417210 → Confirm transfer & take a screenshot of the receipt.',
    instructionAm: 'የቴሌብር መተግበሪያዎን ይክፈቱ → "Send Money" የሚለውን ይጫኑ → 0927417210 ያስገቡ → ገንዘቡን ልከው የክፍያ ማረጋገጫ ደረሰኝ ስክሪንሾት ያንሱ።',
  },
  {
    id: 'cbe',
    name: 'Commercial Bank of Ethiopia (CBE)',
    methodValue: 'CBE',
    fullName: 'CBE Birr & Mobile Banking',
    accountNumber: '1000021808567',
    recipientName: 'HABTAMU GEBREKIDAN / LISAN ACADEMY',
    color: '#7b1fa2',
    badgeBg: '#f3e8ff',
    badgeText: '#6b21a8',
    icon: '🏦',
    typeBadge: 'Bank & CBE Birr',
    instructionEn: 'Open CBE Mobile Banking / CBE Birr app (or visit CBE branch) → Transfer to account number 1000021808567 → Save transaction confirmation or SMS.',
    instructionAm: 'የኢትዮጵያ ንግድ ባንክ (CBE Birr / CBE Mobile) በመጠቀም ወደ ሂሳብ ቁጥር 1000021808567 ያስተላልፉ → ደረሰኙን ወይም የኤስኤምኤስ ማረጋገጫውን ያስቀምጡ።',
  },
  {
    id: 'abyssinia',
    name: 'Bank of Abyssinia',
    methodValue: 'Abyssinia',
    fullName: 'BoA Mobile Banking (Bank of Abyssinia)',
    accountNumber: '34842965',
    recipientName: 'HABTAMU GEBREKIDAN (LISAN ACADEMY)',
    color: '#4a148c',
    badgeBg: '#ede7f6',
    badgeText: '#4a148c',
    icon: '🏛️',
    typeBadge: 'Mobile Banking',
    instructionEn: 'Open Bank of Abyssinia (BoA) Mobile Banking → Transfer to account number 34842965 → Keep transaction reference & screenshot for verification.',
    instructionAm: 'በባንክ ኦፍ አቢሲኒያ የሞባይል ባንኪንግ መተግበሪያ ወደ ሂሳብ ቁጥር 34842965 ያስተላልፉ → የክፍያ ማረጋገጫ ደረሰኝ ስክሪንሾት ያንሱ።',
  },
]

export interface PaymentQrCardProps {
  onSelectBank?: (bankName: string) => void
  selectedMethod?: string
}

export default function PaymentQrCard({ onSelectBank, selectedMethod }: PaymentQrCardProps) {
  const [selectedId, setSelectedId] = useState<string>('telebirr')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Sync tab if parent provides selectedMethod
  useEffect(() => {
    if (selectedMethod) {
      const match = SUPPORTED_BANKS.find(
        b => b.methodValue.toLowerCase() === selectedMethod.toLowerCase() ||
             b.name.toLowerCase() === selectedMethod.toLowerCase() ||
             b.id.toLowerCase() === selectedMethod.toLowerCase()
      )
      if (match) {
        setSelectedId(match.id)
      }
    }
  }, [selectedMethod])

  const activeBank = SUPPORTED_BANKS.find(b => b.id === selectedId) || SUPPORTED_BANKS[0]

  const handleCopy = (accountNum: string, bankId: string) => {
    navigator.clipboard.writeText(accountNum)
    setCopiedId(bankId)
    setTimeout(() => {
      setCopiedId(prev => (prev === bankId ? null : prev))
    }, 2200)
  }

  const handleTabChange = (bank: BankAccountInfo) => {
    setSelectedId(bank.id)
    onSelectBank?.(bank.methodValue)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left transition-all">
      {/* ── Step 1 Header ── */}
      <div className="px-5 py-4 bg-[#1a3a2a] text-white flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse"></span>
            <p className="font-bold text-sm text-white">Step 1 — Official Bank & Payment Accounts</p>
          </div>
          <p className="text-xs text-white/70 mt-0.5">
            Choose your preferred payment method, copy the account details, and complete your transfer
          </p>
        </div>
        <span className="text-xs bg-[#d4a017] text-gray-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
          <span>🛡️</span> Verified Accounts
        </span>
      </div>

      {/* ── Bank Tabs Selector ── */}
      <div className="p-2 sm:p-2.5 bg-gray-50/80 border-b border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SUPPORTED_BANKS.map(bank => {
            const isSelected = bank.id === selectedId
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => handleTabChange(bank)}
                className={`relative px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white shadow-sm border-gray-300 ring-2 ring-emerald-700/20'
                    : 'bg-white/60 hover:bg-white text-gray-600 border-gray-200/70 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0 p-1 rounded-lg bg-gray-50 border border-gray-100">
                      {bank.icon}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {bank.methodValue}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium truncate">
                        {bank.typeBadge}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Active Bank Detail Spotlight ── */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Main Bank Account Hero Card */}
        <div className="relative rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white via-gray-50/50 to-white p-5 sm:p-6 shadow-xs overflow-hidden">
          {/* Subtle background glow accent */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: activeBank.color }}
          />

          {/* Top row: Bank branding & verified badge */}
          <div className="flex items-start justify-between flex-wrap gap-2 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-xs border border-white"
                style={{ backgroundColor: activeBank.badgeBg }}
              >
                {activeBank.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                    {activeBank.fullName}
                  </h3>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: activeBank.badgeBg, color: activeBank.badgeText }}
                  >
                    {activeBank.typeBadge}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Official verified account for LISAN Academy
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span>✓</span> Verified Account
            </span>
          </div>

          {/* Account Number Box with One-Click Copy */}
          <div className="mt-5 p-4 sm:p-5 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div
                className="cursor-pointer group select-all"
                onClick={() => handleCopy(activeBank.accountNumber, activeBank.id)}
                title="Click to copy account number"
              >
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                  {activeBank.id === 'telebirr' ? 'Telebirr Phone Number' : 'Bank Account Number'}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xl sm:text-2xl font-black text-gray-900 tracking-wider">
                    {activeBank.accountNumber}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                    📋
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(activeBank.accountNumber, activeBank.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                  copiedId === activeBank.id
                    ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-500/30'
                    : 'bg-[#1a3a2a] hover:bg-[#254f3b] text-white hover:shadow-md'
                }`}
              >
                {copiedId === activeBank.id ? (
                  <>
                    <span className="text-sm">✓</span>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy {activeBank.id === 'telebirr' ? 'Number' : 'Account'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recipient Details & Verification */}
          <div className="mt-4 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-start gap-3">
            <div className="text-base text-gray-500 mt-0.5">👤</div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                Account Holder / Beneficiary Name (የሂሳብ ባለቤት ስም)
              </span>
              <p className="font-extrabold text-xs sm:text-sm text-gray-900 tracking-wide mt-0.5">
                {activeBank.recipientName}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Always confirm this name matches in your mobile banking app before completing the transfer.
              </p>
            </div>
          </div>

          {/* Transfer Instructions in English & Amharic */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1.5 text-[11px] uppercase tracking-wide">
                <span>🇬🇧</span> English Instructions
              </div>
              <p className="text-amber-950/90 leading-relaxed text-xs">
                {activeBank.instructionEn}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1.5 text-[11px] uppercase tracking-wide">
                <span>🇪🇹</span> መመሪያ (አማርኛ)
              </div>
              <p className="text-amber-950/90 leading-relaxed text-xs font-medium">
                {activeBank.instructionAm}
              </p>
            </div>
          </div>
        </div>

        {/* ── Quick Glance: All 3 Accounts at a glance ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Quick Reference — All Payment Channels
            </p>
            <span className="text-[11px] text-gray-400">Click any card to select & copy</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {SUPPORTED_BANKS.map(bank => {
              const isCopied = copiedId === bank.id
              const isSelected = bank.id === selectedId
              return (
                <div
                  key={bank.id}
                  onClick={() => handleTabChange(bank)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-white hover:bg-gray-50/80 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{bank.icon}</span>
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {bank.methodValue}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="font-mono text-sm font-extrabold text-gray-900 tracking-wider block">
                      {bank.accountNumber}
                    </span>
                    <span className="text-[10px] text-gray-500 truncate block mt-0.5">
                      {bank.recipientName.split('(')[0].trim()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(bank.accountNumber, bank.id)
                      handleTabChange(bank)
                    }}
                    className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{isCopied ? '✓ Copied' : '📋 Copy'}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Footer Guidance ── */}
      <div className="px-5 py-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
        <span className="text-sm">📌</span>
        <span>
          After completing your transfer, take a screenshot of your payment receipt or save the transaction SMS reference for Step 2 below.
        </span>
      </div>
    </div>
  )
}
