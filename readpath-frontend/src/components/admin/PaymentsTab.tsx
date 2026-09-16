import { useState, useEffect } from 'react'
import { paymentApi, type ApiPaymentSubmission } from '../../services/api'
import { useToast } from '../ui/Toast'

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  APPROVED: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  REJECTED: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
}

const METHOD_COLORS: Record<string, string> = {
  CBE:       'bg-brand-100 text-brand-700',
  Telebirr:  'bg-orange-100 text-orange-700',
  Abyssinia: 'bg-purple-100 text-purple-700',
  Other:     'bg-gray-100 text-gray-700',
}

function getName(sub: ApiPaymentSubmission) {
  const p = sub.user
  if (!p) return sub.user?.email ?? '—'
  if (p.student) return `${p.student.firstName} ${p.student.lastName}`
  if (p.parent)  return `${p.parent.firstName} ${p.parent.lastName}`
  return p.email
}

function getParentName(sub: ApiPaymentSubmission) {
  const p = sub.user
  if (!p || !p.parent) return '—'
  return `${p.parent.firstName} ${p.parent.lastName}`
}

function getGrade(sub: ApiPaymentSubmission) {
  return sub.user?.student?.grade?.replace('GRADE_', 'Grade ') ?? '—'
}

function getInitials(name: string) {
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
  'bg-lime-100 text-lime-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
]

function getAvatarColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export default function PaymentsTab() {
  const toast = useToast()

  const [rows,       setRows]       = useState<ApiPaymentSubmission[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')

  const [viewTarget,    setViewTarget]    = useState<ApiPaymentSubmission | null>(null)
  const [rejectTarget,  setRejectTarget]  = useState<ApiPaymentSubmission | null>(null)
  const [rejectReason,  setRejectReason]  = useState('')
  const [approveTarget, setApproveTarget] = useState<ApiPaymentSubmission | null>(null)
  const [acting, setActing] = useState(false)

  const refresh = () => {
    setLoading(true)
    paymentApi.all()
      .then(d => setRows(d))
      .catch(() => toast.error('Failed', 'Could not load payment submissions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async () => {
    if (!approveTarget) return
    setActing(true)
    try {
      await paymentApi.approve(approveTarget.id)
      toast.success('Approved', `${getName(approveTarget)}'s account is now active.`)
      refresh()
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Could not approve')
    }
    setActing(false)
    setApproveTarget(null)
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setActing(true)
    try {
      await paymentApi.reject(rejectTarget.id, rejectReason)
      toast.success('Rejected', 'User has been notified.')
      refresh()
    } catch (e: unknown) {
      toast.error('Failed', e instanceof Error ? e.message : 'Could not reject')
    }
    setActing(false)
    setRejectTarget(null)
    setRejectReason('')
  }

  // Filters
  const filtered = rows.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
    if (methodFilter !== 'ALL' && r.paymentMethod !== methodFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = getName(r).toLowerCase()
      const email = r.user?.email?.toLowerCase() ?? ''
      const ref = r.transactionRef.toLowerCase()
      if (!name.includes(q) && !email.includes(q) && !ref.includes(q)) return false
    }
    return true
  })

  const totalCount = rows.length
  const approvedCount = rows.filter(r => r.status === 'APPROVED').length
  const pendingCount = rows.filter(r => r.status === 'PENDING').length
  const rejectedCount = rows.filter(r => r.status === 'REJECTED').length

  const approvedPct = totalCount ? ((approvedCount / totalCount) * 100).toFixed(1) : '0.0'
  const pendingPct = totalCount ? ((pendingCount / totalCount) * 100).toFixed(1) : '0.0'
  const rejectedPct = totalCount ? ((rejectedCount / totalCount) * 100).toFixed(1) : '0.0'

  const methods = ['ALL', ...Array.from(new Set(rows.map(r => r.paymentMethod)))]

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage student payments. Verify receipts and approve accounts.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Total Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{approvedCount}</p>
              <p className="text-xs text-gray-400 mt-1">{approvedPct}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</p>
              <p className="text-xs text-gray-400 mt-1">{pendingPct}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{rejectedCount}</p>
              <p className="text-xs text-gray-400 mt-1">{rejectedPct}%</p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, parent name, receipt ID..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white">
            {methods.map(m => (
              <option key={m} value={m}>{m === 'ALL' ? 'All Payment Methods' : m}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted At</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <p className="text-sm text-gray-400">No payments found</p>
                </td></tr>
              ) : (
                filtered.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(sub.userId)}`}>
                          {getInitials(getName(sub))}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{getName(sub)}</p>
                          <p className="text-xs text-gray-400">{getGrade(sub)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{getParentName(sub)}</p>
                      {sub.user?.parent && (
                        <p className="text-xs text-gray-400">{sub.user.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">ETB {sub.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${METHOD_COLORS[sub.paymentMethod] || METHOD_COLORS.Other}`}>
                        {sub.paymentMethod === 'CBE' && '🏦'}
                        {sub.paymentMethod === 'Telebirr' && '📱'}
                        {sub.paymentMethod === 'Abyssinia' && '🏛️'}
                        {sub.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setViewTarget(sub)}
                        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {sub.transactionRef}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{new Date(sub.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[sub.status]?.bg} ${STATUS_COLORS[sub.status]?.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[sub.status]?.dot}`} />
                        {sub.status === 'PENDING' && 'Pending'}
                        {sub.status === 'APPROVED' && 'Approved'}
                        {sub.status === 'REJECTED' && 'Rejected'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewTarget(sub)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="View details">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => { setViewTarget(sub); setApproveTarget(sub) }}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Approve">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => { setRejectTarget(sub); setRejectReason('') }}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Reject">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setViewTarget(sub)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                          title="View details">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {filtered.length} of {totalCount} payments</p>
        </div>
      </div>

      {/* View Details Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => setViewTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                <p className="text-sm text-gray-500 mt-0.5">Review submission information</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Student</p>
                <p className="text-sm font-semibold text-gray-900">{getName(viewTarget)}</p>
                <p className="text-xs text-gray-500">{getGrade(viewTarget)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Parent</p>
                <p className="text-sm font-semibold text-gray-900">{getParentName(viewTarget)}</p>
                <p className="text-xs text-gray-500">{viewTarget.user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Package</p>
                <p className="text-sm font-semibold text-gray-900">{viewTarget.package}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Amount</p>
                <p className="text-sm font-bold text-gray-900">ETB {viewTarget.amount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Payment Method</p>
                <p className="text-sm font-semibold text-gray-900">{viewTarget.paymentMethod}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Payment Date</p>
                <p className="text-sm font-semibold text-gray-900">{viewTarget.paymentDate}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Transaction Reference</p>
                <p className="text-sm font-mono font-semibold text-gray-900">{viewTarget.transactionRef}</p>
              </div>
              {viewTarget.receiptUrl && (
                <div className="space-y-2 col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Receipt / Screenshot</p>
                  {viewTarget.receiptUrl.match(/\.(jpg|jpeg|png)$/i) ? (
                    <div className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50">
                      <img 
                        src={viewTarget.receiptUrl} 
                        alt="Payment Receipt" 
                        className="w-full max-h-[500px] object-contain rounded-lg"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const parent = img.parentElement!;
                          parent.innerHTML = '<p class="text-sm text-red-600 py-8 text-center">⚠️ Receipt image failed to load</p>';
                        }}
                      />
                      <a 
                        href={viewTarget.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-center text-xs text-brand-600 hover:text-brand-700 mt-2 font-medium">
                        Open in new tab →
                      </a>
                    </div>
                  ) : (
                    <a href={viewTarget.receiptUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors">
                      <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">📄 PDF Receipt</p>
                        <p className="text-xs text-gray-500 mt-0.5">Click to view or download the receipt</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
              {viewTarget.notes && (
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
                  <p className="text-sm text-gray-700">{viewTarget.notes}</p>
                </div>
              )}
              {viewTarget.adminNote && (
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-semibold text-red-500 uppercase">Rejection Reason</p>
                  <p className="text-sm text-red-700">{viewTarget.adminNote}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[viewTarget.status]?.bg} ${STATUS_COLORS[viewTarget.status]?.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[viewTarget.status]?.dot}`} />
                  {viewTarget.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Submitted</p>
                <p className="text-sm text-gray-700">
                  {new Date(viewTarget.createdAt).toLocaleDateString()} {new Date(viewTarget.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {viewTarget.status === 'PENDING' && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setApproveTarget(viewTarget)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors">
                  ✅ Approve & Activate
                </button>
                <button
                  onClick={() => { setRejectTarget(viewTarget); setRejectReason(''); setViewTarget(null) }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Confirm */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Approve Payment?</h3>
            <p className="text-sm text-gray-600">
              Approve <strong>{getName(approveTarget)}</strong>'s payment for <strong>{approveTarget.package}</strong>?
              Their account will become ACTIVE immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setApproveTarget(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={acting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60">
                {acting ? 'Approving…' : 'Approve & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Reject Payment</h3>
            <p className="text-sm text-gray-600">
              Rejecting <strong>{getName(rejectTarget)}</strong>'s submission for <strong>{rejectTarget.package}</strong>.
              The user will be notified with your reason.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Reason for rejection <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Transaction reference not found, amount does not match…"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={acting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60">
                {acting ? 'Rejecting…' : 'Reject & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
