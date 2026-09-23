'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  DollarSign,
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
  Video,
  FileText,
  Loader2,
  Settings,
  Mail,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

interface HomeSummary {
  role: 'admin' | 'moderator'
  alerts: {
    pendingMembers: number
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

  const isAdmin = summary?.role === 'admin'

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
      if (user?.role !== 'admin' && user?.role !== 'moderator') {
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
        setNotice({
          type: 'success',
          text: `Synced ${data.paymentCount} Square payments · ${data.matchedCount} matched · ${data.unmatchedCount} orphaned.`,
        })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setSyncing(false)
  }

  if (status === 'loading' || loading || !summary) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  const userName = ((session?.user as { name?: string })?.name || 'Admin').split(' ')[0]
  const hasAlerts =
    summary.alerts.pendingMembers > 0 ||
    summary.alerts.orphanPayments > 0 ||
    summary.alerts.unverifiedApproved > 0

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-24 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />
        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>Admin Dashboard</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Welcome, {userName}
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-12">
        <div className="max-w-6xl mx-auto px-8">
          {notice && (
            <div
              className={`mb-6 border rounded-lg px-4 py-3 text-small flex items-start gap-3 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">×</button>
            </div>
          )}

          {/* Alerts */}
          {hasAlerts && (
            <AnimatedSection>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="font-label text-[0.65rem] tracking-widest uppercase text-amber-800">Needs your attention</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {summary.alerts.pendingMembers > 0 && (
                    <Link
                      href="/admin/members?status=pending"
                      className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-4 py-3 hover:border-amber-400 transition-all"
                    >
                      <div>
                        <p className="font-display text-h4 text-brand">{summary.alerts.pendingMembers}</p>
                        <p className="text-[0.7rem] text-mid">Pending members</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-600" />
                    </Link>
                  )}
                  {summary.alerts.orphanPayments > 0 && (
                    <Link
                      href="/admin/finances"
                      className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-4 py-3 hover:border-amber-400 transition-all"
                    >
                      <div>
                        <p className="font-display text-h4 text-brand">{summary.alerts.orphanPayments}</p>
                        <p className="text-[0.7rem] text-mid">Unmatched Square payments</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-600" />
                    </Link>
                  )}
                  {summary.alerts.unverifiedApproved > 0 && (
                    <Link
                      href="/admin/members?status=approved&method=unknown"
                      className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-4 py-3 hover:border-amber-400 transition-all"
                    >
                      <div>
                        <p className="font-display text-h4 text-brand">{summary.alerts.unverifiedApproved}</p>
                        <p className="text-[0.7rem] text-mid">Approved w/ no method</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-600" />
                    </Link>
                  )}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* KPIs */}
          <AnimatedSection delay={1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Link href="/admin/finances" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Revenue YTD</p>
                </div>
                <p className="font-display text-h3 text-brand font-light">{money(summary.kpis.revenueYtd)}</p>
              </Link>
              <Link href="/admin/finances" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-red-600" />
                  <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Expenses YTD</p>
                </div>
                <p className="font-display text-h3 text-brand font-light">{money(summary.kpis.expensesYtd)}</p>
              </Link>
              <Link href="/admin/finances" className={`${summary.kpis.netPosition >= 0 ? 'bg-navy-900 text-white' : 'bg-red-50 border border-red-200'} rounded-xl p-5 hover:opacity-95 transition-all`}>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className={`w-4 h-4 ${summary.kpis.netPosition >= 0 ? 'text-gold-400' : 'text-red-600'}`} />
                  <p className={`font-label text-[0.6rem] tracking-widest uppercase ${summary.kpis.netPosition >= 0 ? 'text-gold-400' : 'text-red-700'}`}>Net Position</p>
                </div>
                <p className={`font-display text-h3 font-light ${summary.kpis.netPosition >= 0 ? 'text-white' : 'text-brand'}`}>{money(summary.kpis.netPosition)}</p>
              </Link>
              <Link href="/admin/members" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-hover transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-accent" />
                  <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Members</p>
                </div>
                <p className="font-display text-h3 text-brand font-light">{summary.kpis.totalMembers}</p>
              </Link>
            </div>
          </AnimatedSection>

          {/* Quick actions */}
          <AnimatedSection delay={2}>
            <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-6">
              <h3 className="font-label text-label tracking-widest uppercase text-brand mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {isAdmin && (
                  <button
                    onClick={handleSyncSquare}
                    disabled={syncing}
                    className="flex items-center justify-center gap-2 bg-navy-900 text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-3 rounded-lg hover:bg-navy-800 transition-all disabled:opacity-50"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-gold-400" />
                        Sync Square
                      </>
                    )}
                  </button>
                )}
                <Link
                  href="/admin/members?openLogPayment=1"
                  className="flex items-center justify-center gap-2 bg-accent text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-3 rounded-lg hover:bg-gold-900 transition-all"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Log Payment
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/finances?openExpense=1"
                    className="flex items-center justify-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-3 rounded-lg hover:border-accent/40 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-red-600" />
                    Add Expense
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/finances?openInvite=1"
                    className="flex items-center justify-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-3 rounded-lg hover:border-accent/40 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-accent" />
                    Send Invitation
                  </Link>
                )}
              </div>
              {summary.lastSync?.finishedAt && (
                <p className="text-[0.7rem] text-hint mt-3">
                  Last Square sync: {new Date(summary.lastSync.finishedAt).toLocaleString()} · {summary.lastSync.status}
                </p>
              )}
            </div>
          </AnimatedSection>

          {/* Navigation cards */}
          <AnimatedSection delay={3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Link href="/admin/members" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-hover transition-all">
                <Users className="w-6 h-6 text-accent mb-3" />
                <p className="font-display text-h5 text-brand">Members</p>
                <p className="text-[0.7rem] text-mid mt-1">Approve, review, log offline payments</p>
              </Link>
              <Link href="/admin/finances" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-hover transition-all">
                <DollarSign className="w-6 h-6 text-accent mb-3" />
                <p className="font-display text-h5 text-brand">Finances</p>
                <p className="text-[0.7rem] text-mid mt-1">Square + offline payments, expenses</p>
              </Link>
              {isAdmin && (
                <Link href="/admin/team" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-hover transition-all">
                  <Settings className="w-6 h-6 text-accent mb-3" />
                  <p className="font-display text-h5 text-brand">Team &amp; Content</p>
                  <p className="text-[0.7rem] text-mid mt-1">Board, videos, team accounts</p>
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/reports" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-hover transition-all">
                  <FileText className="w-6 h-6 text-accent mb-3" />
                  <p className="font-display text-h5 text-brand">Reports</p>
                  <p className="text-[0.7rem] text-mid mt-1">Board meeting PDF, CSV exports</p>
                </Link>
              )}
            </div>
          </AnimatedSection>

          {/* Recent activity */}
          <AnimatedSection delay={4}>
            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <h3 className="font-label text-label tracking-widest uppercase text-brand mb-4">Recent Activity</h3>
              {summary.recentActivity.length === 0 ? (
                <p className="text-small text-hint py-4 text-center">Nothing recent to show.</p>
              ) : (
                <div className="divide-y divide-ivory-200">
                  {summary.recentActivity.map((a) => {
                    const iconClass = 'w-4 h-4'
                    const icon =
                      a.type === 'payment' ? <CheckCircle className={`${iconClass} text-emerald-600`} />
                      : a.type === 'expense' ? <Receipt className={`${iconClass} text-red-600`} />
                      : a.type === 'invitation' ? <Mail className={`${iconClass} text-accent`} />
                      : <UserPlus className={`${iconClass} text-navy-600`} />
                    return (
                      <div key={a.id} className="py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-page-bg flex items-center justify-center flex-shrink-0">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-small text-brand font-medium truncate">{a.title}</p>
                          <p className="text-[0.7rem] text-hint truncate">{a.subtitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {a.amount !== null && (
                            <p className={`font-medium ${a.type === 'expense' ? 'text-red-600' : 'text-brand'}`}>
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
          </AnimatedSection>

          {/* Small footer */}
          <div className="mt-8 flex flex-wrap gap-4 items-center justify-center text-[0.65rem] tracking-widest uppercase text-hint font-label">
            <Link href="/portal" className="hover:text-brand transition-colors">My Portal</Link>
            <span>·</span>
            <Link href="/" className="hover:text-brand transition-colors">Public Site</Link>
            {isAdmin && (
              <>
                <span>·</span>
                <Link href="/admin/videos" className="hover:text-brand transition-colors">
                  <Video className="w-3 h-3 inline mr-1" />
                  Videos
                </Link>
                <span>·</span>
                <Link href="/admin/board-members" className="hover:text-brand transition-colors">
                  <UserPlus className="w-3 h-3 inline mr-1" />
                  Board
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
