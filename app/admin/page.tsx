'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, LineChart, Line,
} from 'recharts'
import {
  Users, TrendingUp, Receipt, Wallet, AlertCircle, ArrowRight, Send, Plus,
  RefreshCw, Loader2, DollarSign, UserPlus, Award,
} from 'lucide-react'
import { useEffectiveRole } from '@/lib/use-effective-role'
import AdminShell from '@/components/admin/AdminShell'

type Period = 'week' | 'month' | 'quarter' | 'ytd' | 'all'

interface Bucket { bucket: string; label: string }
interface RevenueBucket extends Bucket { revenue: number; payments: number }
interface NewMemberBucket extends Bucket { count: number }
interface AttributionRow { sender: string; converted: number; sent: number; label: string }
interface BoardReferralRow { boardMemberId: string; boardMemberName: string; count: number }
interface TierSlice { name: string; value: number; color: string }

interface Stats {
  period: Period
  kpis: { revenue: number; newMembers: number; payments: number; expenses: number; net: number }
  tierBreakdown: TierSlice[]
  statusBreakdown: TierSlice[]
  revenueTrend: RevenueBucket[]
  newMembersTrend: NewMemberBucket[]
  attribution: AttributionRow[]
  boardReferrals: BoardReferralRow[]
  unattributedCount: number
  bucketSize: 'day' | 'month'
}

interface HomeSummary {
  role: 'admin' | 'moderator' | 'reviewer'
  alerts: {
    pendingMembers: number
    unpaidMembers: number
    orphanPayments: number
    unverifiedApproved: number
  }
  lastSync: { finishedAt: string | number | null; status: string } | null
}

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Last 7d' },
  { key: 'month', label: 'Last 30d' },
  { key: 'quarter', label: 'Last 90d' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All time' },
]

export default function AdminHomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [period, setPeriod] = useState<Period>('ytd')

  const { effectiveRole, realRole } = useEffectiveRole()
  const uiRole = effectiveRole || summary?.role || realRole
  const isReviewer = uiRole === 'reviewer'
  const canSeeFinances = uiRole === 'admin' || uiRole === 'moderator'

  const fetchAll = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const [sRes, stRes] = await Promise.all([
        fetch('/api/admin/home-summary'),
        fetch(`/api/admin/overview-stats?period=${p}`),
      ])
      if (sRes.ok) setSummary(await sRes.json())
      if (stRes.ok) setStats(await stRes.json())
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
      fetchAll(period)
    }
  }, [status, session, router, fetchAll, period])

  async function handleSyncSquare() {
    setSyncing(true)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/square/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Sync failed.' })
      } else {
        await fetchAll(period)
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

  if (status === 'loading' || (loading && !stats) || !summary) {
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
      {/* Period picker */}
      <div className="inline-flex items-center gap-0.5 bg-white border border-ivory-200 rounded p-0.5">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`text-xs font-medium px-2 py-1 rounded transition-all ${
              period === p.key ? 'bg-navy-900 text-white' : 'text-mid hover:text-brand'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
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
        <div className={`mb-4 border rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${
          notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Alerts strip — same as before, always visible when there are alerts */}
      {hasAlerts && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-red-800">Needs your attention</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {summary.alerts.pendingMembers > 0 && (
              <Link href="/admin/members?status=pending" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400">
                <div><p className="text-lg font-medium text-brand leading-tight">{summary.alerts.pendingMembers}</p><p className="text-xs text-mid">Awaiting approval</p></div>
                <ArrowRight className="w-3.5 h-3.5 text-red-600" />
              </Link>
            )}
            {summary.alerts.unpaidMembers > 0 && (
              <Link href="/admin/members?status=unpaid" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400">
                <div><p className="text-lg font-medium text-brand leading-tight">{summary.alerts.unpaidMembers}</p><p className="text-xs text-mid">Unpaid signups</p></div>
                <ArrowRight className="w-3.5 h-3.5 text-red-600" />
              </Link>
            )}
            {!isReviewer && summary.alerts.orphanPayments > 0 && (
              <Link href="/admin/finances" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400">
                <div><p className="text-lg font-medium text-brand leading-tight">{summary.alerts.orphanPayments}</p><p className="text-xs text-mid">Orphan Square payments</p></div>
                <ArrowRight className="w-3.5 h-3.5 text-red-600" />
              </Link>
            )}
            {!isReviewer && summary.alerts.unverifiedApproved > 0 && (
              <Link href="/admin/members?status=approved&method=unknown" className="flex items-center justify-between bg-white border border-red-200 rounded px-3 py-2 hover:border-red-400">
                <div><p className="text-lg font-medium text-brand leading-tight">{summary.alerts.unverifiedApproved}</p><p className="text-xs text-mid">Approved · no method</p></div>
                <ArrowRight className="w-3.5 h-3.5 text-red-600" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KPI tiles for the selected period */}
      {stats && (
        <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'} gap-3 mb-5`}>
          <div className="bg-white border border-ivory-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1"><Users className="w-3.5 h-3.5 text-accent" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">New Members</p></div>
            <p className="text-2xl font-medium text-brand">{stats.kpis.newMembers}</p>
          </div>
          {canSeeFinances && (
            <>
              <div className="bg-white border border-ivory-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Revenue</p></div>
                <p className="text-2xl font-medium text-brand">{money(stats.kpis.revenue)}</p>
              </div>
              <div className="bg-white border border-ivory-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><Receipt className="w-3.5 h-3.5 text-red-600" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Expenses</p></div>
                <p className="text-2xl font-medium text-brand">{money(stats.kpis.expenses)}</p>
              </div>
              <div className={`rounded-lg p-4 ${stats.kpis.net >= 0 ? 'bg-navy-900 text-white' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1"><Wallet className={`w-3.5 h-3.5 ${stats.kpis.net >= 0 ? 'text-gold-400' : 'text-red-600'}`} /><p className={`text-[0.65rem] font-medium uppercase tracking-wide ${stats.kpis.net >= 0 ? 'text-gold-400' : 'text-red-700'}`}>Net</p></div>
                <p className={`text-2xl font-medium ${stats.kpis.net >= 0 ? 'text-white' : 'text-brand'}`}>{money(stats.kpis.net)}</p>
              </div>
              <div className="bg-white border border-ivory-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><DollarSign className="w-3.5 h-3.5 text-brand" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Payments</p></div>
                <p className="text-2xl font-medium text-brand">{stats.kpis.payments}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Charts grid */}
      {stats && !isReviewer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {/* Membership by Tier */}
          <ChartCard title="Membership by Tier" total={stats.tierBreakdown.reduce((s, x) => s + x.value, 0)}>
            {stats.tierBreakdown.reduce((s, x) => s + x.value, 0) === 0 ? (
              <EmptyChart />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.tierBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {stats.tierBreakdown.map((slice, i) => (
                        <Cell key={i} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [`${Number(v)} members`, ''] as [string, string]} />
                  </PieChart>
                </ResponsiveContainer>
                <LegendList items={stats.tierBreakdown} />
              </>
            )}
          </ChartCard>

          {/* Member Status */}
          <ChartCard title="Member Status" total={stats.statusBreakdown.reduce((s, x) => s + x.value, 0)}>
            {stats.statusBreakdown.reduce((s, x) => s + x.value, 0) === 0 ? (
              <EmptyChart />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {stats.statusBreakdown.map((slice, i) => (
                        <Cell key={i} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [`${Number(v)} members`, ''] as [string, string]} />
                  </PieChart>
                </ResponsiveContainer>
                <LegendList items={stats.statusBreakdown} />
              </>
            )}
          </ChartCard>

          {/* Revenue trend */}
          {canSeeFinances && (
            <ChartCard title={`Revenue by ${stats.bucketSize === 'day' ? 'day' : 'month'}`} total={money(stats.kpis.revenue)}>
              {stats.revenueTrend.every((r) => r.revenue === 0) ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.revenueTrend} margin={{ top: 10, right: 8, left: 8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A6A7A' }} interval={stats.bucketSize === 'day' ? 3 : 0} />
                    <YAxis tick={{ fontSize: 11, fill: '#5A6A7A' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, 'Revenue'] as [string, string]} labelStyle={{ color: '#1E3A5F' }} />
                    <Bar dataKey="revenue" fill="#D4A830" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          {/* New members trend */}
          <ChartCard title={`New Members by ${stats.bucketSize === 'day' ? 'day' : 'month'}`} total={`${stats.kpis.newMembers} total`}>
            {stats.newMembersTrend.every((r) => r.count === 0) ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.newMembersTrend} margin={{ top: 10, right: 8, left: 8, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A6A7A' }} interval={stats.bucketSize === 'day' ? 3 : 0} />
                  <YAxis tick={{ fontSize: 11, fill: '#5A6A7A' }} allowDecimals={false} />
                  <Tooltip formatter={(v: unknown) => [`${Number(v)} member${Number(v) === 1 ? '' : 's'}`, 'New'] as [string, string]} labelStyle={{ color: '#1E3A5F' }} />
                  <Line type="monotone" dataKey="count" stroke="#1E3A5F" strokeWidth={2} dot={{ fill: '#D4A830', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Board Referrals — how many members each board sponsor brought in */}
          <ChartCard
            title="Members by Board Referrer"
            total={`${stats.boardReferrals.reduce((s, r) => s + r.count, 0)} attributed${stats.unattributedCount > 0 ? ` · ${stats.unattributedCount} unattributed` : ''}`}
            className="lg:col-span-2"
          >
            {stats.boardReferrals.length === 0 ? (
              <div className="py-8 text-center text-sm text-hint">
                <Award className="w-8 h-8 text-hint mx-auto mb-2" />
                No members attributed to a board referrer in this period.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={Math.max(180, stats.boardReferrals.length * 42)}>
                  <BarChart data={stats.boardReferrals} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#5A6A7A' }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="boardMemberName"
                      tick={{ fontSize: 11, fill: '#1E3A5F', cursor: 'pointer' }}
                      width={120}
                      onClick={(evt: unknown) => {
                        const e = evt as { value?: string; index?: number }
                        const row = typeof e?.index === 'number' ? stats.boardReferrals[e.index] : null
                        if (row) {
                          router.push(`/admin/members?referredBy=${encodeURIComponent(row.boardMemberId)}&referredByName=${encodeURIComponent(row.boardMemberName)}`)
                        }
                      }}
                    />
                    <Tooltip formatter={(v: unknown) => [`${Number(v)} member${Number(v) === 1 ? '' : 's'}`, 'Brought in'] as [string, string]} labelStyle={{ color: '#1E3A5F' }} />
                    <Bar
                      dataKey="count"
                      fill="#D4A830"
                      radius={[0, 4, 4, 0]}
                      style={{ cursor: 'pointer' }}
                      onClick={(data: unknown) => {
                        const row = data as BoardReferralRow | undefined
                        if (row?.boardMemberId) {
                          router.push(`/admin/members?referredBy=${encodeURIComponent(row.boardMemberId)}&referredByName=${encodeURIComponent(row.boardMemberName)}`)
                        }
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[0.65rem] text-hint mt-2">
                  Click any bar or name to see the members that referrer brought in.
                </p>
              </>
            )}
          </ChartCard>

          {/* Attribution — who brought in members (via invitations table) */}
          <ChartCard title="Invitations & Conversions" total={`${stats.attribution.reduce((s, r) => s + r.converted, 0)} converted`} className="lg:col-span-2">
            {stats.attribution.length === 0 ? (
              <div className="py-8 text-center text-sm text-hint">
                <UserPlus className="w-8 h-8 text-hint mx-auto mb-2" />
                No invitations tracked in this period yet.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={Math.max(180, stats.attribution.length * 40)}>
                  <BarChart data={stats.attribution} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#5A6A7A' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#1E3A5F' }} width={100} />
                    <Tooltip labelStyle={{ color: '#1E3A5F' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="sent" name="Invitations sent" fill="#EDE6D3" />
                    <Bar dataKey="converted" name="Converted to members" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-2 text-[0.65rem] text-hint mt-2">
                  <Award className="w-3 h-3 text-gold-400" />
                  Top referrer: <span className="text-brand font-medium">{stats.attribution[0].label}</span> ({stats.attribution[0].converted} conversions)
                </div>
              </>
            )}
          </ChartCard>
        </div>
      )}

      {/* Sync note */}
      {summary.lastSync?.finishedAt && (
        <p className="text-[0.65rem] text-hint text-right">
          Last Square sync: {new Date(summary.lastSync.finishedAt).toLocaleString()} · {summary.lastSync.status}
        </p>
      )}
    </AdminShell>
  )
}

function ChartCard({ title, total, children, className = '' }: {
  title: string
  total?: string | number
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white border border-ivory-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-brand">{title}</h3>
        {total !== undefined && (
          <p className="text-xs text-hint">Total: <span className="text-brand font-medium">{total}</span></p>
        )}
      </div>
      {children}
    </div>
  )
}

function LegendList({ items }: { items: Array<{ name: string; value: number; color: string }> }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  return (
    <div className="mt-3 space-y-1.5">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
            <span className="text-charcoal">{item.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-hint">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
            <span className="text-brand font-medium tabular-nums">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex items-center justify-center text-hint text-sm">
      No data in this period yet.
    </div>
  )
}
