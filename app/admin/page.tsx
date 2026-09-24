'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  TrendingUp,
  Receipt,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Send,
  Plus,
  RefreshCw,
  UserPlus,
  Loader2,
  DollarSign,
  Mail,
} from 'lucide-react'
import { useEffectiveRole } from '@/lib/use-effective-role'
import AdminShell from '@/components/admin/AdminShell'

interface HomeSummary {
  role: 'admin' | 'moderator' | 'reviewer'
  alerts: {
    pendingMembers: number
    unpaidMembers: number
    orphanPayments: number
    unverifiedApproved: number
  }
  kpis: {
    revenueYtd: number
    expensesYtd: number
    netPosition: number
    totalMembers: number
  }
  recentActivity: Array<{
    id: string
    type: 'payment' | 'expense' | 'invitation' | 'approval'
    title: string
    subtitle: string
    amount: number | null
    at: string | number
  }>
  lastSync: {
    finishedAt: string | number | null
    status: string
  } | null
}

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function AdminHomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { effectiveRole, realRole } = useEffectiveRole()
  // When the real role isn't admin the effectiveRole matches (preview stays
  // off for non-admins). When admin is previewing, effectiveRole is what
  // the previewed role would see.
  const uiRole = effectiveRole || summary?.role || realRole
  const isReviewer = uiRole === 'reviewer'
  const canSeeFinances = uiRole === 'admin' || uiRole === 'moderator'

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/home-summary')
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const user = session?.user as Record<string, unknown>
      if (user?.role !== 'admin' && user?.role !== 'moderator' && user?.role !== 'reviewer') {
        router.push('/portal')
        return
      }
      fetchSummary()
    }
  }, [status, session, router, fetchSummary])

  async function handleSyncSquare() {
    setSyncing(true)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/square/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Sync failed.' })
      } else {
        await fetchSummary()
        const completed = data.completedCount ?? data.paymentCount
        const skipped = data.nonCompletedCount ?? 0
        const skippedNote = skipped > 0 ? ` · ${skipped} canceled/pending skipped` : ''
        setNotice({
          type: 'success',
          text: `Synced ${completed} completed Square payments · ${data.matchedCount} matched · ${data.unmatchedCount} orphaned${skippedNote}.`,
        })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setSyncing(false)
  }

  if (status === 'loading' || loading || !summary) {
    return (
      <AdminShell title="Overview">
        <div className="animate-pulse text-mid text-sm">Loading…</div>
      </AdminShell>
    )
  }

  const userName = ((session?.user as { name?: string })?.name || 'Admin').split(' ')[0]
  const hasAlerts =
    summary.alerts.pendingMembers > 0 ||
    summary.alerts.unpaidMembers > 0 ||
    summary.alerts.orphanPayments > 0 ||
    summary.alerts.unverifiedApproved > 0

  const headerActions = !isReviewer ? (
    <>
      <button
        type="button"
        onClick={handleSyncSquare}
        disabled={syncing}
        className="inline-flex items-center gap-1.5 bg-navy-900 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-navy-800 disabled:opacity-50"
      >
        {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-gold-400" />}
        <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync Square'}</span>
      </button>
      <Link
        href="/admin/members?openLogPayment=1"
        className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-gold-900"
      >
        <DollarSign className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Log Payment</span>
      </Link>
      <Link
        href="/admin/expenses?openExpense=1"
        className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand text-xs font-medium px-3 py-1.5 rounded hover:border-accent/40"
      >
        <Plus className="w-3.5 h-3.5 text-red-600" />
        <span className="hidden sm:inline">Expense</span>
      </Link>
      <Link
        href="/admin/finances?openInvite=1"
        className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand text-xs font-medium px-3 py-1.5 rounded hover:border-accent/40"
      >
        <Send className="w-3.5 h-3.5 text-accent" />
        <span className="hidden sm:inline">Invite</span>
      </Link>
    </>
  ) : null

  return (
    <AdminShell title={`Welcome back, ${userName}`} actions={headerActions}>
          {notice && (
            <div
              className={`mb-4 border rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="flex-1">{notice.text}</span>
              <button type="button" onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">×</button>
            </div>
          )}

          {/* KPI tiles — compact */}
          <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'} gap-3 mb-6`}>
            <Link href="/admin/members" className="bg-white border border-ivory-200 rounded-lg p-4 hover:border-accent/40 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-accent" />
                <p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Members</p>
              </div>
              <p className="text-2xl font-medium text-brand">{summary.kpis.totalMembers}</p>
            </Link>
            {canSeeFinances && (
              <>
                <Link href="/admin/finances" className="bg-white border border-ivory-200 rounded-lg p-4 hover:border-accent/40 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Revenue YTD</p>
                  </div>
                  <p className="text-2xl font-medium text-brand">{money(summary.kpis.revenueYtd)}</p>
                </Link>
                <Link href="/admin/expenses" className="bg-white border border-ivory-200 rounded-lg p-4 hover:border-accent/40 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="w-3.5 h-3.5 text-red-600" />
                    <p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Expenses YTD</p>
                  </div>
                  <p className="text-2xl font-medium text-brand">{money(summary.kpis.expensesYtd)}</p>
                </Link>
                <Link href="/admin/finances" className={`rounded-lg p-4 transition-all ${summary.kpis.netPosition >= 0 ? 'bg-navy-900 text-white' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className={`w-3.5 h-3.5 ${summary.kpis.netPosition >= 0 ? 'text-gold-400' : 'text-red-600'}`} />
                    <p className={`text-[0.65rem] font-medium uppercase tracking-wide ${summary.kpis.netPosition >= 0 ? 'text-gold-400' : 'text-red-700'}`}>Net Position</p>
                  </div>
                  <p className={`text-2xl font-medium ${summary.kpis.netPosition >= 0 ? 'text-white' : 'text-brand'}`}>{money(summary.kpis.netPosition)}</p>
                </Link>
              </>
            )}
          </div>

          {/* Alerts — compact strip, only when there's actually something */}
          {hasAlerts && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-red-800">Needs your attention</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {summary.alerts.pendingMembers > 0 && (
                  <Link href="/admin/members?status=pending" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400 transition-all">
                    <div>
                      <p className="text-lg font-medium text-brand leading-tight">{summary.alerts.pendingMembers}</p>
                      <p className="text-xs text-mid">Awaiting approval</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-red-600" />
                  </Link>
                )}
                {summary.alerts.unpaidMembers > 0 && (
                  <Link href="/admin/members?status=unpaid" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400 transition-all">
                    <div>
                      <p className="text-lg font-medium text-brand leading-tight">{summary.alerts.unpaidMembers}</p>
                      <p className="text-xs text-mid">Unpaid signups</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-red-600" />
                  </Link>
                )}
                {!isReviewer && summary.alerts.orphanPayments > 0 && (
                  <Link href="/admin/finances" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400 transition-all">
                    <div>
                      <p className="text-lg font-medium text-brand leading-tight">{summary.alerts.orphanPayments}</p>
                      <p className="text-xs text-mid">Orphan Square payments</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-red-600" />
                  </Link>
                )}
                {!isReviewer && summary.alerts.unverifiedApproved > 0 && (
                  <Link href="/admin/members?status=approved&method=unknown" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400 transition-all">
                    <div>
                      <p className="text-lg font-medium text-brand leading-tight">{summary.alerts.unverifiedApproved}</p>
                      <p className="text-xs text-mid">Approved · no method</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-red-600" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="bg-white border border-ivory-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-brand">Recent activity</h3>
              {summary.lastSync?.finishedAt && (
                <p className="text-[0.65rem] text-hint">Last sync: {new Date(summary.lastSync.finishedAt).toLocaleString()}</p>
              )}
            </div>
            {summary.recentActivity.length === 0 ? (
              <p className="text-sm text-hint py-3 text-center">Nothing recent to show.</p>
            ) : (
              <div className="divide-y divide-ivory-200">
                {summary.recentActivity.map((a) => {
                  const icon =
                    a.type === 'payment' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    : a.type === 'expense' ? <Receipt className="w-3.5 h-3.5 text-red-600" />
                    : a.type === 'invitation' ? <Mail className="w-3.5 h-3.5 text-accent" />
                    : <UserPlus className="w-3.5 h-3.5 text-navy-600" />
                  return (
                    <div key={a.id} className="py-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-page-bg flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand font-medium truncate">{a.title}</p>
                        <p className="text-xs text-hint truncate">{a.subtitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {a.amount !== null && (
                          <p className={`text-sm font-medium ${a.type === 'expense' ? 'text-red-600' : 'text-brand'}`}>
                            {a.type === 'expense' ? '−' : ''}{money(Math.abs(a.amount))}
                          </p>
                        )}
                        <p className="text-[0.65rem] text-hint flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(a.at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
    </AdminShell>
  )
}
