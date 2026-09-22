'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Mail,
  Plus,
  X,
  Loader2,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

interface MemberRow {
  id: string
  name: string
  email: string
  businessName: string | null
  membershipTier: string
  status: string
  membershipNumber: string | null
  paymentMethod: string | null
  amountPaid: number | null
  inferredAmount: number
  isEstimated: boolean
  paymentReference: string | null
  paymentDate: string | number | null
  createdAt: string | number
}

interface Summary {
  memberCount: {
    total: number
    approved: number
    pending: number
    individual: number
    corporate: number
  }
  revenue: {
    tracked: number
    byMethod: Record<string, number>
  }
  expenses: {
    total: number
    byCategory: Record<string, number>
    recent: Array<{
      id: string
      category: string
      vendor: string
      description: string | null
      amount: number
      paymentMethod: string | null
      paymentReference: string | null
      expenseDate: string | number
    }>
  }
  invitations: {
    sent: number
    converted: number
    recent: Array<{
      id: string
      email: string
      name: string | null
      businessName: string | null
      suggestedTier: string | null
      sentAt: string | number
      convertedAt: string | number | null
    }>
  }
  memberList: MemberRow[]
  netPosition: number
}

const inputClass =
  'w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'
const labelClass =
  'font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1'

const EXPENSE_CATEGORIES = [
  'Hosting & Tech',
  'Marketing',
  'Events',
  'Office & Supplies',
  'Legal & Professional',
  'Insurance',
  'Travel',
  'Other',
]

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function AdminFinancesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExpense, setShowExpense] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState<string>('all')

  const [fetchError, setFetchError] = useState('')

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/admin/finance-summary')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFetchError(data.error || `Failed to load dashboard (HTTP ${res.status}). If this is the first load, the migration may not have run yet — visit /api/migrate?key=cvicc-migrate-finance-2026`)
      } else {
        const data = await res.json()
        setSummary(data)
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Network error loading dashboard.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const user = session?.user as Record<string, unknown>
      if (user?.role !== 'admin') {
        router.push('/portal')
        return
      }
      fetchSummary()
    }
  }, [status, session, router, fetchSummary])

  async function handleExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      category: fd.get('category'),
      vendor: fd.get('vendor'),
      description: fd.get('description'),
      amount: parseInt(String(fd.get('amount')), 10),
      paymentMethod: fd.get('paymentMethod'),
      paymentReference: fd.get('paymentReference'),
      expenseDate: fd.get('expenseDate'),
    }
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to log expense.')
      } else {
        setShowExpense(false)
        await fetchSummary()
        setNotice({ type: 'success', text: `Expense of ${money(payload.amount)} logged.` })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    }
    setSaving(false)
  }

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      email: fd.get('email'),
      name: fd.get('name'),
      businessName: fd.get('businessName'),
      suggestedTier: fd.get('suggestedTier'),
      personalNote: fd.get('personalNote'),
      fromName: fd.get('fromName'),
    }
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send invitation.')
      } else {
        setShowInvite(false)
        await fetchSummary()
        setNotice({ type: 'success', text: `Invitation sent to ${payload.email}.` })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    }
    setSaving(false)
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    try {
      await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' })
      await fetchSummary()
    } catch {}
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white border border-ivory-200 rounded-xl p-8">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="font-display text-h4 text-brand mb-2">Couldn&rsquo;t load dashboard</h3>
          <p className="text-small text-mid mb-4 whitespace-pre-line">{fetchError || 'Unknown error.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchSummary}
              className="bg-accent text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-sm hover:bg-gold-900 transition-all"
            >
              Retry
            </button>
            <Link
              href="/admin"
              className="bg-white border border-ivory-200 text-mid font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-sm hover:border-brand/30 transition-all"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="bg-navy-900 py-24 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />
        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>Executive Dashboard</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">Finances & Membership</SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-mid hover:text-brand font-label text-[0.65rem] tracking-widest uppercase transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Admin
            </Link>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => { setError(''); setShowInvite(true) }}
                className="inline-flex items-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:border-accent/40 transition-all"
              >
                <Send className="w-3.5 h-3.5 text-accent" />
                Send Invitation
              </button>
              <button
                onClick={() => { setError(''); setShowExpense(true) }}
                className="inline-flex items-center gap-2 bg-accent text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-gold-900 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Expense
              </button>
            </div>
          </div>

          {notice && (
            <div className={`mb-6 border rounded-lg px-4 py-3 text-small flex items-start gap-3 ${
              notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Top KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/70">Total Revenue Tracked</p>
              </div>
              <p className="font-display text-h2 text-brand font-light">{money(summary.revenue.tracked)}</p>
              <p className="text-[0.7rem] text-hint mt-1">Includes Square + manually logged offline payments</p>
            </div>
            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/70">Total Expenses</p>
              </div>
              <p className="font-display text-h2 text-brand font-light">{money(summary.expenses.total)}</p>
              <p className="text-[0.7rem] text-hint mt-1">Across {Object.keys(summary.expenses.byCategory).length} categories</p>
            </div>
            <div className={`rounded-xl p-6 ${summary.netPosition >= 0 ? 'bg-navy-900 text-white' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${summary.netPosition >= 0 ? 'bg-gold-600' : 'bg-red-100'}`}>
                  <Wallet className={`w-5 h-5 ${summary.netPosition >= 0 ? 'text-white' : 'text-red-600'}`} />
                </div>
                <p className={`font-label text-[0.6rem] tracking-widest uppercase ${summary.netPosition >= 0 ? 'text-gold-400' : 'text-red-700'}`}>
                  Net Position
                </p>
              </div>
              <p className={`font-display text-h2 font-light ${summary.netPosition >= 0 ? 'text-white' : 'text-brand'}`}>
                {money(summary.netPosition)}
              </p>
              <p className={`text-[0.7rem] mt-1 ${summary.netPosition >= 0 ? 'text-white/50' : 'text-red-600'}`}>
                Revenue − Expenses
              </p>
            </div>
          </div>

          {/* Member stats */}
          <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="font-label text-label tracking-widest uppercase text-brand">Membership Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total', value: summary.memberCount.total },
                { label: 'Approved', value: summary.memberCount.approved },
                { label: 'Pending', value: summary.memberCount.pending },
                { label: 'Individual', value: summary.memberCount.individual },
                { label: 'Corporate', value: summary.memberCount.corporate },
              ].map((k) => (
                <div key={k.label} className="text-center">
                  <p className="font-display text-h3 font-light text-brand">{k.value}</p>
                  <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60 mt-1">{k.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Members list — full detail with payment info */}
          <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="font-label text-label tracking-widest uppercase text-brand">
                  Members &amp; Payments ({summary.memberList.length})
                </h3>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Search name, email, business..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="border border-ivory-200 rounded-md px-3 py-1.5 text-small focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="border border-ivory-200 rounded-md px-3 py-1.5 text-small focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="all">All statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>

            {(() => {
              const filtered = summary.memberList.filter((m) => {
                if (memberFilter !== 'all' && m.status !== memberFilter) return false
                if (memberSearch) {
                  const q = memberSearch.toLowerCase()
                  return (
                    m.name.toLowerCase().includes(q) ||
                    m.email.toLowerCase().includes(q) ||
                    m.businessName?.toLowerCase().includes(q) ||
                    m.membershipNumber?.includes(q)
                  )
                }
                return true
              })

              if (filtered.length === 0) {
                return <p className="text-small text-hint py-6 text-center">No members match your filter.</p>
              }

              return (
                <>
                  {/* Desktop: table */}
                  <div className="hidden lg:block overflow-x-auto -mx-6">
                    <table className="min-w-full text-small">
                      <thead>
                        <tr className="border-b border-ivory-200">
                          <th className="text-left px-6 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Member</th>
                          <th className="text-left px-3 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Tier</th>
                          <th className="text-left px-3 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Status</th>
                          <th className="text-right px-3 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Amount</th>
                          <th className="text-left px-3 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Method</th>
                          <th className="text-left px-6 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Date / Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((m) => {
                          const badge = m.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : m.status === 'pending'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : m.status === 'rejected'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                          const dateStr = m.paymentDate
                            ? new Date(m.paymentDate).toLocaleDateString()
                            : new Date(m.createdAt).toLocaleDateString()
                          return (
                            <tr key={m.id} className="border-b border-ivory-200/60 hover:bg-page-bg/50">
                              <td className="px-6 py-2.5">
                                <p className="font-medium text-brand">
                                  {m.name}
                                  {m.membershipNumber && <span className="ml-2 text-[0.65rem] font-normal text-hint">#{m.membershipNumber}</span>}
                                </p>
                                {m.businessName && <p className="text-[0.7rem] text-mid">{m.businessName}</p>}
                                <p className="text-[0.65rem] text-hint truncate max-w-xs">{m.email}</p>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${
                                  m.membershipTier === 'corporate' ? 'bg-navy-50 border-navy-100 text-brand' : 'bg-ivory-100 border-ivory-200 text-mid'
                                }`}>
                                  {m.membershipTier}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${badge}`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <p className="font-medium text-brand">
                                  {money(m.inferredAmount)}
                                  {m.isEstimated && <span className="text-hint text-[0.6rem] ml-1">est.</span>}
                                </p>
                              </td>
                              <td className="px-3 py-2.5">
                                {m.paymentMethod ? (
                                  <span className="capitalize text-charcoal">{m.paymentMethod}</span>
                                ) : (
                                  <span className="text-hint text-[0.7rem]">—</span>
                                )}
                              </td>
                              <td className="px-6 py-2.5">
                                <p className="text-[0.7rem] text-charcoal">{dateStr}</p>
                                {m.paymentReference && <p className="text-[0.65rem] text-hint truncate max-w-[10rem]">{m.paymentReference}</p>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile / tablet: stacked cards */}
                  <div className="lg:hidden divide-y divide-ivory-200">
                    {filtered.map((m) => {
                      const badge = m.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : m.status === 'pending'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : m.status === 'rejected'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                      const dateStr = m.paymentDate
                        ? new Date(m.paymentDate).toLocaleDateString()
                        : new Date(m.createdAt).toLocaleDateString()
                      return (
                        <div key={m.id} className="py-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-brand">
                                {m.name}
                                {m.membershipNumber && <span className="ml-2 text-[0.65rem] font-normal text-hint">#{m.membershipNumber}</span>}
                              </p>
                              {m.businessName && <p className="text-[0.7rem] text-mid truncate">{m.businessName}</p>}
                              <p className="text-[0.65rem] text-hint truncate">{m.email}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-display text-h5 text-brand leading-none">
                                {money(m.inferredAmount)}
                              </p>
                              {m.isEstimated && <p className="text-hint text-[0.55rem] mt-0.5">est.</p>}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${
                              m.membershipTier === 'corporate' ? 'bg-navy-50 border-navy-100 text-brand' : 'bg-ivory-100 border-ivory-200 text-mid'
                            }`}>
                              {m.membershipTier}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${badge}`}>
                              {m.status}
                            </span>
                            {m.paymentMethod && (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-gold-50 border border-gold-100 text-[0.6rem] capitalize text-brand font-medium">
                                {m.paymentMethod}
                              </span>
                            )}
                            <span className="text-[0.65rem] text-hint">{dateStr}</span>
                          </div>
                          {m.paymentReference && (
                            <p className="text-[0.65rem] text-hint mt-1 truncate">Ref: {m.paymentReference}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}

            <p className="text-[0.7rem] text-hint mt-4 text-center">
              <em>est.</em> = estimated from tier default (older members without recorded amount). Log via the Offline Payment form on /admin to record the exact amount.
            </p>
          </div>

          {/* Revenue by method + Expenses by category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <h3 className="font-label text-label tracking-widest uppercase text-brand mb-4">Revenue by Payment Method</h3>
              {Object.keys(summary.revenue.byMethod).length === 0 ? (
                <p className="text-small text-hint">No tracked payments yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(summary.revenue.byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                    const pct = (amount / summary.revenue.tracked) * 100
                    return (
                      <div key={method}>
                        <div className="flex justify-between text-small mb-1">
                          <span className="capitalize text-charcoal font-medium">{method}</span>
                          <span className="text-mid">{money(amount)} <span className="text-hint">· {pct.toFixed(1)}%</span></span>
                        </div>
                        <div className="h-2 bg-page-bg rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <h3 className="font-label text-label tracking-widest uppercase text-brand mb-4">Expenses by Category</h3>
              {Object.keys(summary.expenses.byCategory).length === 0 ? (
                <p className="text-small text-hint">No expenses logged yet. Click &ldquo;Add Expense&rdquo; to start tracking.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(summary.expenses.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                    const pct = (amt / summary.expenses.total) * 100
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-small mb-1">
                          <span className="text-charcoal font-medium">{cat}</span>
                          <span className="text-mid">{money(amt)} <span className="text-hint">· {pct.toFixed(1)}%</span></span>
                        </div>
                        <div className="h-2 bg-page-bg rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent expenses */}
          <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-accent" />
                <h3 className="font-label text-label tracking-widest uppercase text-brand">Recent Expenses</h3>
              </div>
              <button onClick={() => setShowExpense(true)} className="text-small text-accent hover:underline">+ Add</button>
            </div>
            {summary.expenses.recent.length === 0 ? (
              <p className="text-small text-hint py-4 text-center">No expenses logged yet.</p>
            ) : (
              <div className="divide-y divide-ivory-200">
                {summary.expenses.recent.map((e) => (
                  <div key={e.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand">{e.vendor}</p>
                      <p className="text-[0.7rem] text-hint">
                        {e.category} · {new Date(e.expenseDate).toLocaleDateString()}
                        {e.paymentMethod && <> · <span className="capitalize">{e.paymentMethod}</span></>}
                        {e.paymentReference && <> · {e.paymentReference}</>}
                      </p>
                      {e.description && <p className="text-small text-mid mt-0.5 truncate">{e.description}</p>}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="font-display text-h5 text-red-600">−{money(e.amount)}</p>
                      <button onClick={() => handleDeleteExpense(e.id)} className="text-hint hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invitations */}
          <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <h3 className="font-label text-label tracking-widest uppercase text-brand">
                  Invitations · {summary.invitations.sent} sent · {summary.invitations.converted} converted
                </h3>
              </div>
              <button onClick={() => setShowInvite(true)} className="text-small text-accent hover:underline">+ Send</button>
            </div>
            {summary.invitations.recent.length === 0 ? (
              <p className="text-small text-hint py-4 text-center">No invitations sent yet.</p>
            ) : (
              <div className="divide-y divide-ivory-200">
                {summary.invitations.recent.map((i) => (
                  <div key={i.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand">{i.name || i.email}</p>
                      <p className="text-[0.7rem] text-hint truncate">
                        {i.email}
                        {i.businessName && <> · {i.businessName}</>}
                        {i.suggestedTier && <> · <span className="capitalize">{i.suggestedTier}</span></>}
                        · Sent {new Date(i.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                    {i.convertedAt ? (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <CheckCircle className="w-3 h-3" />
                        Joined
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Expense modal */}
      {showExpense && (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4" onClick={() => !saving && setShowExpense(false)}>
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-display text-h4 text-brand">Log Expense</h3>
              </div>
              <button onClick={() => !saving && setShowExpense(false)} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Category *</label>
                <select name="category" required className={inputClass} defaultValue="">
                  <option value="" disabled>Select a category</option>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Vendor / Payee *</label>
                <input name="vendor" required className={inputClass} placeholder="e.g. Vercel, Turso, Print Shop" />
              </div>
              <div>
                <label className={labelClass}>Amount ($) *</label>
                <input name="amount" type="number" min="1" step="1" required className={inputClass} placeholder="e.g. 42" />
              </div>
              <div>
                <label className={labelClass}>Payment Method</label>
                <select name="paymentMethod" className={inputClass} defaultValue="card">
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Reference (invoice #, check #, etc.)</label>
                <input name="paymentReference" className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description / Note</label>
                <textarea name="description" rows={2} className={inputClass} />
              </div>
              {error && <div className="md:col-span-2 text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</div>}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExpense(false)} disabled={saving} className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 transition-all disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-gold-900 transition-all disabled:opacity-50">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4" onClick={() => !saving && setShowInvite(false)}>
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-h4 text-brand">Send Membership Invitation</h3>
              </div>
              <button onClick={() => !saving && setShowInvite(false)} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" required className={inputClass} placeholder="prospect@example.com" />
              </div>
              <div>
                <label className={labelClass}>Their Name</label>
                <input name="name" className={inputClass} placeholder="e.g. Jane Kaur" />
              </div>
              <div>
                <label className={labelClass}>Business Name</label>
                <input name="businessName" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Suggested Tier</label>
                <select name="suggestedTier" className={inputClass} defaultValue="">
                  <option value="">No suggestion (show both)</option>
                  <option value="individual">Individual ($95/yr)</option>
                  <option value="corporate">Corporate ($395/yr)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Sign as</label>
                <input name="fromName" className={inputClass} defaultValue="The CVICC Board" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Personal Note (optional)</label>
                <textarea name="personalNote" rows={3} className={inputClass} placeholder="A short personal message that will appear as a highlighted quote in the email." />
              </div>
              {error && <div className="md:col-span-2 text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</div>}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} disabled={saving} className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 transition-all disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-gold-900 transition-all disabled:opacity-50">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending...</> : <><Send className="w-3.5 h-3.5" />Send Invitation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
