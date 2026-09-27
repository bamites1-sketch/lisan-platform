import { useEffect, useState } from 'react'
import { adminApi, paymentApi, type ApiAnalytics, type ApiPaymentSubmission } from '../../services/api'
import { useToast } from '../ui/Toast'

function formatGrade(grade: string) {
  return grade.replace('GRADE_', 'Grade ')
}

export function PaymentPlansTab() {
  const plans = [
    { name: 'Basic', price: 'Free', detail: 'Core reading practice and progress tracking', color: 'bg-gray-50' },
    { name: 'Premium', price: 'Paid', detail: 'Full learning plans, tutor support, and resources', color: 'bg-brand-50' },
    { name: 'Diagnostic', price: 'One-time', detail: 'Reading assessment and personalized recommendations', color: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Review the plans available to learners and families.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div key={plan.name} className={`card border-0 ${plan.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{plan.price}</p>
            <h2 className="text-lg font-bold text-gray-900 mt-1">{plan.name}</h2>
            <p className="text-sm text-gray-600 mt-2 min-h-10">{plan.detail}</p>
            <span className="inline-flex mt-5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-600">Available</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="section-title">Plan operations</h2>
        <p className="text-sm text-gray-500 mt-1">Account activation and payment verification are managed from Payment Verifications.</p>
      </div>
    </div>
  )
}

export function TransactionsTab() {
  const [rows, setRows] = useState<ApiPaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    paymentApi.all().then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">A read-only history of submitted payments.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        {loading ? <div className="p-8 text-center text-sm text-gray-500">Loading transactions...</div> : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No payment transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Package</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => <tr key={row.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-800">{row.transactionRef}</td><td className="px-4 py-3 text-gray-600">{row.user?.email ?? '—'}</td><td className="px-4 py-3 text-gray-600">{row.package}</td><td className="px-4 py-3 text-gray-600">{row.amount}</td><td className="px-4 py-3"><span className="text-xs font-semibold">{row.status}</span></td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReportsTab() {
  const toast = useToast()
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { adminApi.analytics().then(setAnalytics).catch(() => setAnalytics(null)).finally(() => setLoading(false)) }, [])

  const downloadReport = () => {
    if (!analytics) return
    const rows = [['Grade', 'Students', 'Average Score'], ...Object.entries(analytics.gradeBreakdown).map(([grade, value]) => [formatGrade(grade), String(value.count), String(value.avgScore)])]
    const csv = rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'readpath-report.csv'; link.click(); URL.revokeObjectURL(url)
    toast.success('Report downloaded', 'The grade summary CSV is ready.')
  }

  return <div className="space-y-5"><div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-sm text-gray-500 mt-1">Export a current assessment summary for your records.</p></div><button onClick={downloadReport} disabled={!analytics} className="btn-primary text-sm">Download CSV</button></div><div className="card">{loading ? <p className="text-sm text-gray-500">Loading report data...</p> : analytics ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><div><p className="text-xs text-gray-500">Assessed</p><p className="text-2xl font-bold text-gray-900">{analytics.totalAssessed}</p></div><div><p className="text-xs text-gray-500">High scores</p><p className="text-2xl font-bold text-green-600">{analytics.distribution.high}</p></div><div><p className="text-xs text-gray-500">Developing</p><p className="text-2xl font-bold text-amber-600">{analytics.distribution.medium}</p></div><div><p className="text-xs text-gray-500">Needs support</p><p className="text-2xl font-bold text-red-600">{analytics.distribution.low}</p></div></div> : <p className="text-sm text-gray-500">Report data is unavailable right now.</p>}</div></div>
}

export { default as SettingsTab } from './SettingsTab'