'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

// Categorical palette for the Board Referrer donut. Order matters —
// the top referrer gets navy, then gold, then the supporting hues,
// so the largest slice always reads as the brand color.
const REFERRER_PALETTE = ['#1E3A5F', '#D4A830', '#059669', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#B45309']
import {
  Users, TrendingUp, Receipt, Wallet, Send, Plus,
  RefreshCw, Loader2, DollarSign, UserPlus, Award, CreditCard,
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
  prior: { newMembers: number | null; revenue: number | null }
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
        <div className={`mb-4 border rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${
          notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* KPI tiles for the selected period — each links to the relevant tab */}
      {stats && (
        <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'} gap-3 mb-4`}>
          <Link href="/admin/members" className="bg-white border border-ivory-200 rounded-lg p-4 hover:border-accent/40 hover:shadow-hover transition-all">
            <div className="flex items-center gap-2 mb-1"><Users className="w-3.5 h-3.5 text-accent" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">New Members</p></div>
            <p className="text-2xl font-medium text-brand">{stats.kpis.newMembers}</p>
          </Link>
          {canSeeFinances && (
            <>
              <Link href="/admin/finances" className="bg-white border border-ivory-200 rounded-lg p-4 hover:border-accent/40 hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Revenue</p></div>
                <p className="text-2xl font-medium text-brand">{money(stats.kpis.revenue)}</p>
              </Link>
              <Link href="/admin/expenses" className="bg-white border border-ivory-200 rounded-lg p-4 hover:border-accent/40 hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-1"><Receipt className="w-3.5 h-3.5 text-red-600" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Expenses</p></div>
                <p className="text-2xl font-medium text-brand">{money(stats.kpis.expenses)}</p>
              </Link>
              <Link href="/admin/finances" className={`rounded-lg p-4 hover:opacity-95 transition-all ${stats.kpis.net >= 0 ? 'bg-navy-900 text-white' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1"><Wallet className={`w-3.5 h-3.5 ${stats.kpis.net >= 0 ? 'text-gold-400' : 'text-red-600'}`} /><p className={`text-[0.65rem] font-medium uppercase tracking-wide ${stats.kpis.net >= 0 ? 'text-gold-400' : 'text-red-700'}`}>Net</p></div>
                <p className={`text-2xl font-medium ${stats.kpis.net >= 0 ? 'text-white' : 'text-brand'}`}>{money(stats.kpis.net)}</p>
              </Link>
              <Link href="/admin/finances" className="bg-white border border-ivory-200 rounded-lg p-4 hover:border-accent/40 hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-1"><CreditCard className="w-3.5 h-3.5 text-brand" /><p className="text-[0.65rem] font-medium text-mid uppercase tracking-wide">Transactions</p></div>
                <p className="text-2xl font-medium text-brand">{stats.kpis.payments}</p>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Period pill — controls every chart below and the KPI values above */}
      {stats && !isReviewer && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-xs text-hint">
            Showing {PERIODS.find((p) => p.key === period)?.label.toLowerCase() || period} — click a KPI to open the tab.
          </p>
          <div className="inline-flex items-center gap-0.5 bg-white border border-ivory-200 rounded p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`text-xs font-medium px-2.5 py-1 rounded transition-all ${
                  period === p.key ? 'bg-navy-900 text-white' : 'text-mid hover:text-brand'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Charts grid */}
      {stats && !isReviewer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {/* Combined Members card — tier split + status chips + delta */}
          <div className="bg-white border border-ivory-200 rounded-lg p-5 lg:col-span-2">
            <MembersCompactCard stats={stats} router={router} />
          </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Donut — counts and slice colors read from the legend
                      below, so no hover needed to know who brought whom in */}
                  <div className="relative w-full max-w-[280px] mx-auto">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={stats.boardReferrals}
                          dataKey="count"
                          nameKey="boardMemberName"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={104}
                          paddingAngle={2}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                          onClick={(data: unknown) => {
                            const row = (data as { payload?: BoardReferralRow })?.payload
                            if (row?.boardMemberId) {
                              router.push(`/admin/members?referredBy=${encodeURIComponent(row.boardMemberId)}&referredByName=${encodeURIComponent(row.boardMemberName)}`)
                            }
                          }}
                        >
                          {stats.boardReferrals.map((_, i) => (
                            <Cell key={i} fill={REFERRER_PALETTE[i % REFERRER_PALETTE.length]} cursor="pointer" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: unknown) => [`${Number(v)} member${Number(v) === 1 ? '' : 's'}`, 'Brought in'] as [string, string]}
                          labelStyle={{ color: '#1E3A5F' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-3xl font-medium text-brand leading-none">
                        {stats.boardReferrals.reduce((s, r) => s + r.count, 0)}
                      </p>
                      <p className="text-[0.65rem] text-hint uppercase tracking-wide mt-1">Attributed</p>
                    </div>
                  </div>

                  {/* Legend rows — color swatch + name + count, all clickable */}
                  <div>
                    <div className="border-b border-ivory-200 pb-1.5 mb-1 flex items-center justify-between text-[0.65rem] font-medium uppercase tracking-wide text-hint">
                      <span>Board member</span>
                      <span>Brought in</span>
                    </div>
                    <div className="divide-y divide-ivory-200">
                      {stats.boardReferrals.map((r, i) => (
                        <button
                          key={r.boardMemberId}
                          type="button"
                          onClick={() => router.push(`/admin/members?referredBy=${encodeURIComponent(r.boardMemberId)}&referredByName=${encodeURIComponent(r.boardMemberName)}`)}
                          className="w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded hover:bg-page-bg transition-all text-left group"
                        >
                          <span
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ background: REFERRER_PALETTE[i % REFERRER_PALETTE.length] }}
                          />
                          <span className="text-sm text-brand flex-1 group-hover:underline">{r.boardMemberName}</span>
                          <span className="text-sm text-brand font-medium tabular-nums">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[0.65rem] text-hint mt-3">
                  Tap a name or slice to see the members that referrer brought in.
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
                {/* Mobile: leaderboard rows with sent + converted paired */}
                <div className="lg:hidden space-y-3">
                  {(() => {
                    const max = Math.max(...stats.attribution.map((r) => r.sent), 1)
                    return stats.attribution.map((r) => {
                      const rate = r.sent > 0 ? Math.round((r.converted / r.sent) * 100) : 0
                      return (
                        <div key={r.sender} className="space-y-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm text-brand font-medium truncate pr-2">{r.label}</span>
                            <span className="text-[0.65rem] text-hint whitespace-nowrap">
                              <span className="text-brand font-medium">{r.converted}</span>/{r.sent} · {rate}%
                            </span>
                          </div>
                          <div className="relative h-2.5 bg-page-bg rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-ivory-200"
                              style={{ width: `${Math.max(4, (r.sent / max) * 100)}%` }}
                            />
                            <div
                              className="absolute inset-y-0 left-0 bg-emerald-600 rounded-full"
                              style={{ width: `${Math.max(0, (r.converted / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  })()}
                  <div className="flex items-center gap-3 text-[0.65rem] text-hint pt-1">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Converted</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ivory-200" /> Sent</span>
                  </div>
                </div>

                {/* Desktop: recharts grouped bars */}
                <div className="hidden lg:block">
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
                </div>
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

function EmptyChart() {
  return (
    <div className="h-[220px] flex items-center justify-center text-hint text-sm">
      No data in this period yet.
    </div>
  )
}

type Router = ReturnType<typeof import('next/navigation').useRouter>

function MembersCompactCard({ stats, router }: { stats: Stats; router: Router }) {
  const tierTotal = stats.tierBreakdown.reduce((s, x) => s + x.value, 0)
  const individual = stats.tierBreakdown.find((s) => s.name === 'Individual')?.value ?? 0
  const corporate = stats.tierBreakdown.find((s) => s.name === 'Corporate')?.value ?? 0
  const statusTotal = stats.statusBreakdown.reduce((s, x) => s + x.value, 0)

  const priorNew = stats.prior?.newMembers
  const currentNew = stats.kpis.newMembers
  const delta = priorNew !== null && priorNew !== undefined ? currentNew - priorNew : null
  const deltaPct = priorNew && priorNew > 0 ? Math.round(((currentNew - priorNew) / priorNew) * 100) : null

  return (
    <div>
      {/* Header row: title + prior comparison */}
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-medium text-brand">Members</h3>
          <p className="text-[0.7rem] text-hint">Tier split among approved payers · status across everyone</p>
        </div>
        {delta !== null && (
          <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded ${
            delta > 0 ? 'bg-emerald-50 text-emerald-700' : delta < 0 ? 'bg-red-50 text-red-700' : 'bg-page-bg text-hint'
          }`}>
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '·'} {delta > 0 ? '+' : ''}{delta} new{deltaPct !== null ? ` (${deltaPct > 0 ? '+' : ''}${deltaPct}%)` : ''} vs prior period
          </div>
        )}
      </div>

      {/* Big number + tier stacked bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 items-center">
        <div>
          <p className="text-4xl font-medium text-brand leading-none">{tierTotal}</p>
          <p className="text-xs text-mid mt-1">Paying members</p>
        </div>
        <div className="sm:col-span-2">
          {tierTotal === 0 ? (
            <p className="text-xs text-hint italic">No paying members in this period.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => router.push('/admin/members?status=approved')}
                  className="inline-flex items-center gap-1.5 text-brand hover:text-accent"
                >
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#D4A830' }} />
                  <span className="font-medium">{individual}</span> Individual
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/members?status=approved')}
                  className="inline-flex items-center gap-1.5 text-brand hover:text-accent"
                >
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#1E3A5F' }} />
                  <span className="font-medium">{corporate}</span> Corporate
                </button>
              </div>
              <div className="h-3 rounded-full bg-page-bg overflow-hidden flex">
                <div className="h-full" style={{ background: '#D4A830', width: `${(individual / tierTotal) * 100}%` }} title={`${individual} Individual`} />
                <div className="h-full" style={{ background: '#1E3A5F', width: `${(corporate / tierTotal) * 100}%` }} title={`${corporate} Corporate`} />
              </div>
              <p className="text-[0.65rem] text-hint mt-1">
                {tierTotal > 0 ? `${Math.round((individual / tierTotal) * 100)}% Individual · ${Math.round((corporate / tierTotal) * 100)}% Corporate` : ''}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Status chips — one row, clickable filters */}
      <div className="pt-4 border-t border-ivory-200">
        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-2">
          Status <span className="text-hint">· {statusTotal} total · click to filter</span>
        </p>
        {stats.statusBreakdown.length === 0 ? (
          <p className="text-xs text-hint italic">No members yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.statusBreakdown.map((s) => {
              const filterKey = s.name.toLowerCase() // approved / pending / unpaid / rejected / deactivated
              // Pending and Unpaid need attention: red border + text + pulsing
              // ring. Skip the pulse when the count is zero so the chip
              // doesn't scream about nothing.
              const needsAttention = (filterKey === 'pending' || filterKey === 'unpaid') && s.value > 0
              const baseClass = 'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-all'
              const chipClass = needsAttention
                ? `${baseClass} bg-red-50 border border-red-300 text-red-700 ring-2 ring-red-400/40 animate-pulse hover:animate-none hover:ring-red-500`
                : `${baseClass} bg-white border border-ivory-200 hover:border-accent/40`
              const dotColor = needsAttention ? '#DC2626' : s.color
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => router.push(`/admin/members?status=${filterKey}`)}
                  className={chipClass}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
                  <span className={`font-medium ${needsAttention ? 'text-red-700' : 'text-brand'}`}>{s.value}</span>
                  <span className={needsAttention ? 'text-red-700' : 'text-mid'}>{s.name}</span>
                  <span className={needsAttention ? 'text-red-600' : 'text-hint'}>· {statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0}%</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
