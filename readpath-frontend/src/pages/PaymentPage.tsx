import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { paymentApi, type ApiPaymentSubmission } from '../services/api'

const C = { dark: '#1a3a2a', mid: '#2d6a4f', gold: '#d4a017', light: '#e8f4f0', cream: '#f5f0e8' }

const BANK_ACCOUNTS = [
  { name: 'CBE',       full: 'Commercial Bank of Ethiopia', account: '1000XXXXXXXXXX', color: '#1565c0' },
  { name: 'Telebirr',  full: 'Ethio Telecom Telebirr',      account: '09XXXXXXXX',     color: '#e65100' },
  { name: 'Abyssinia', full: 'Bank of Abyssinia',           account: '0XXXXXXXXX',     color: '#4a148c' },
]

const PACKAGES = [
  { name: 'Reading Check',                   price: 500  },
  { name: 'Reading Diagnostic Assessment',   price: 1000 },
  { name: 'Reading Intervention Plan',       price: 1500 },
  { name: 'Monthly Support – Starter',       price: 2000 },
  { name: 'Monthly Support – Growth',        price: 3800 },
  { name: 'Monthly Support – Intensive',     price: 5400 },
  { name: 'Monthly Support – Premium',       price: 7000 },
  { name: 'Platform – Student',              price: 1500 },
  { name: 'Platform – Family',               price: 2500 },
]

const PAYMENT_METHODS = ['CBE', 'Telebirr', 'Abyssinia', 'Other']

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function PaymentPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [mySubmissions, setMine] = useState<ApiPaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    package:        '',
    amount:         '',
    paymentMethod:  '',
    paymentDate:    '',
    notes:          '',
  })
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [serverMsg, setMsg] = useState('')

  // If already active, redirect to dashboard
  useEffect(() => {
    if (user?.status === 'ACTIVE') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    paymentApi.mine()
      .then(d => setMine(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setErrors(p => ({ ...p, receipt: 'Only JPG, PNG, and PDF files are allowed' }))
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(p => ({ ...p, receipt: 'File size must be less than 5MB' }))
      return
    }

    setReceipt(file)
    setErrors(p => ({ ...p, receipt: '' }))

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setReceiptPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null) // PDF - no preview
    }
  }

  const removeReceipt = () => {
    setReceipt(null)
    setReceiptPreview(null)
    setErrors(p => ({ ...p, receipt: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.package)        errs.package        = 'Required'
    if (!form.amount)         errs.amount         = 'Required'
    if (!form.paymentMethod)  errs.paymentMethod  = 'Required'
    if (!form.paymentDate)    errs.paymentDate    = 'Required'
    if (!receipt)             errs.receipt        = 'Receipt is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setStatus('submitting')
    try {
      const formData = new FormData()
      formData.append('package', form.package)
      formData.append('amount', form.amount)
      formData.append('paymentMethod', form.paymentMethod)
      formData.append('paymentDate', form.paymentDate)
      if (form.notes) formData.append('notes', form.notes)
      formData.append('receipt', receipt!)

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Submission failed')

      setStatus('success')
      setMsg('Your payment has been submitted. An admin will verify it and activate your account shortly.')
      const updated = await paymentApi.mine().catch(() => [])
      setMine(updated)
      setForm({ package: '', amount: '', paymentMethod: '', paymentDate: '', notes: '' })
      removeReceipt()
    } catch (err: unknown) {
      setStatus('error')
      setMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    }
  }

  const latestPending = mySubmissions.find(s => s.status === 'PENDING')
  const lastRejected  = mySubmissions.find(s => s.status === 'REJECTED')
  const approved      = mySubmissions.find(s => s.status === 'APPROVED')

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#2d6a4f]'
    }`

  return (
    <div className="min-h-dvh" style={{ backgroundColor: C.cream }}>
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: C.dark }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20">
            <img src="/assets/hero-image.png" alt="LISAN"
              className="w-full h-full object-cover object-top"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <p className="font-bold text-white leading-none text-sm">LISAN</p>
            <p className="text-xs" style={{ color: C.gold }}>Payment Verification</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }}
          className="text-xs text-white/60 hover:text-white transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Account status banner */}
        {user?.status === 'PAYMENT_PENDING' && !approved ? (
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ backgroundColor: `${C.gold}18`, border: `1px solid ${C.gold}50` }}>
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-bold text-sm" style={{ color: C.dark }}>Payment Under Review</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Your payment has been submitted and is waiting for admin verification.
                You'll receive a notification once it's reviewed.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ backgroundColor: `${C.mid}12`, border: `1px solid ${C.mid}30` }}>
            <span className="text-2xl">👋</span>
            <div>
              <p className="font-bold text-sm" style={{ color: C.dark }}>
                Welcome, {(user?.profile as { firstName?: string })?.firstName ?? 'there'}!
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Your account is registered. To access LISAN, please complete your payment and
                submit your transaction details below.
              </p>
            </div>
          </div>
        )}

        {/* Rejection notice */}
        {lastRejected && (
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3 bg-red-50 border border-red-200">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold text-sm text-red-800">Previous Submission Rejected</p>
              <p className="text-xs text-red-700 mt-0.5">
                Reason: {lastRejected.adminNote ?? 'Payment could not be verified.'}
              </p>
              <p className="text-xs text-red-600 mt-1">Please resubmit with the correct details.</p>
            </div>
          </div>
        )}

        {/* Payment accounts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: C.dark }}>
            <p className="font-bold text-white text-sm">Step 1 — Make Your Payment</p>
            <p className="text-xs text-white/60 mt-0.5">Transfer to one of the accounts below</p>
          </div>
          <div className="divide-y divide-gray-50">
            {BANK_ACCOUNTS.map(b => (
              <div key={b.name} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: b.color }}>
                  {b.name.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.full}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</p>
                  <p className="text-sm font-bold text-gray-700 font-mono">{b.account}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50"
            style={{ backgroundColor: '#fafafa' }}>
            ⚠️ After paying, keep your transaction reference number — you'll need it below.
          </div>
        </div>

        {/* Submission form */}
        {!latestPending ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-sm" style={{ color: C.dark }}>Step 2 — Submit Your Payment</p>
              <p className="text-xs text-gray-500 mt-0.5">Fill in your payment details so an admin can verify it</p>
            </div>
            <div className="p-5">
              {status === 'success' && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-800">
                  <span>✅</span> {serverMsg}
                </div>
              )}
              {status === 'error' && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {serverMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Package */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Payment Package <span className="text-red-400">*</span>
                  </label>
                  <select value={form.package} onChange={e => set('package', e.target.value)}
                    className={inputClass('package')}>
                    <option value="">— Select package —</option>
                    {PACKAGES.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name} — ETB {p.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {errors.package && <p className="text-red-500 text-xs mt-1">{errors.package}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Amount Paid (ETB) <span className="text-red-400">*</span>
                    </label>
                    <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                      placeholder="e.g. 1000" min="1" className={inputClass('amount')} />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Payment Method <span className="text-red-400">*</span>
                    </label>
                    <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}
                      className={inputClass('paymentMethod')}>
                      <option value="">— Select —</option>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Amount Paid (ETB) <span className="text-red-400">*</span>
                    </label>
                    <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                      placeholder="e.g. 1000" min="1" className={inputClass('amount')} />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Payment Method <span className="text-red-400">*</span>
                    </label>
                    <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}
                      className={inputClass('paymentMethod')}>
                      <option value="">— Select —</option>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
                  </div>
                </div>

                {/* Payment date - full width */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Payment Date <span className="text-red-400">*</span>
                  </label>
                  <input type="date" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)}
                    className={inputClass('paymentDate')} />
                  {errors.paymentDate && <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    rows={2} placeholder="Any additional information for the admin…"
                    className={`${inputClass('notes')} resize-none`} />
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Upload Receipt / Screenshot <span className="text-red-400">*</span>
                  </label>
                  {!receipt ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:bg-gray-50"
                      style={{ borderColor: errors.receipt ? '#f87171' : '#d1d5db' }}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF (max 5MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div className="border-2 rounded-xl p-4 space-y-3" style={{ borderColor: '#d1d5db' }}>
                      {receiptPreview ? (
                        <img src={receiptPreview} alt="Receipt preview"
                          className="w-full h-40 object-contain rounded-lg bg-gray-50" />
                      ) : (
                        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-semibold text-gray-700">{receipt.name}</p>
                            <p className="text-xs text-gray-400">PDF · {(receipt.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <label className="flex-1 py-2 rounded-lg text-xs font-semibold text-center border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors">
                          Change File
                          <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={handleFileChange} />
                        </label>
                        <button type="button" onClick={removeReceipt}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold text-red-600 border border-red-300 hover:bg-red-50 transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                  {errors.receipt && <p className="text-red-500 text-xs mt-1">{errors.receipt}</p>}
                </div>

                <button type="submit" disabled={status === 'submitting'}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: C.dark }}>
                  {status === 'submitting' ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                  ) : 'Submit Payment →'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
            <div className="text-4xl">⏳</div>
            <p className="font-bold text-lg" style={{ color: C.dark }}>Payment Under Review</p>
            <p className="text-sm text-gray-500">
              Your submission for <strong>{latestPending.package}</strong> (ETB {latestPending.amount.toLocaleString()}) is
              being reviewed. You'll be notified once it's approved.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: `${C.gold}20`, color: C.dark }}>
              Submitted via {latestPending.paymentMethod} · Ref: {latestPending.transactionRef}
            </div>
          </div>
        )}

        {/* Submission history */}
        {!loading && mySubmissions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 bg-gray-50">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Submission History</p>
            </div>
            <div className="divide-y divide-gray-50">
              {mySubmissions.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.package}</p>
                    <p className="text-xs text-gray-500">
                      ETB {s.amount.toLocaleString()} · {s.paymentMethod} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                    {s.adminNote && <p className="text-xs text-red-600 mt-0.5">Reason: {s.adminNote}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    s.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    s.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
