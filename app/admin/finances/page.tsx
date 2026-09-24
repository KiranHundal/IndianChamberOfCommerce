'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import {
  Users,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Send,
  UserPlus,
  Receipt,
} from 'lucide-react'
import { useEffectiveRole } from '@/lib/use-effective-role'
import AdminShell from '@/components/admin/AdminShell'
import ExportCsvButton from '@/components/admin/ExportCsvButton'
import SortableTh from '@/components/admin/SortableTh'
import { useSortable } from '@/lib/use-sortable'

interface MemberRow {
  id: string
  name: string
  email: string
  businessName: string | null
  membershipTier: string
  status: string
  role: string
  membershipNumber: string | null
  paymentMethod: string | null
  amountPaid: number | null
  inferredAmount: number
  isEstimated: boolean
  isStaff: boolean
  hasSquareReceipt: boolean
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
    squareGross: number
    squareTransactionCount: number
    estimatedSquareFees: number
    squareFeesAreReal: boolean
    net: number
    verifiedOffline: number
    verifiedOfflineMemberCount: number
    unverified: number
    unverifiedMemberCount: number
  }
  square: {
    lastSync: {
      id: string
      startedAt: string | number
      finishedAt: string | number | null
      status: string
      paymentCount: number
      newCount: number
      updatedCount: number
      matchedCount: number
      unmatchedCount: number
      errorMessage: string | null
    } | null
    totalPayments: number
    orphanCount: number
    allPayments: Array<{
      id: string
      amountCents: number
      feeCents: number
      refundedCents: number
      buyerEmail: string | null
      buyerName: string | null
      paidAt: string | number
      receiptUrl: string | null
      receiptNumber: string | null
      cardBrand: string | null
      last4: string | null
      matched: boolean
      matchedMemberName: string | null
      matchedMembershipNumber: string | null
      matchedMemberEmail: string | null
    }>
    orphans: Array<{
      id: string
      amountCents: number
      feeCents: number
      buyerEmail: string | null
      buyerName: string | null
      paidAt: string | number
      receiptUrl: string | null
      receiptNumber: string | null
      cardBrand: string | null
      last4: string | null
      suggestedMatch: {
        id: string
        name: string
        email: string
        membershipNumber: string | null
        businessName: string | null
        score: number
      } | null
    }>
  }
  expenses: {
    total: number
    logged: number
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
      createdBy: string | null
      isSynthetic?: boolean
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

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function AdminFinancesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [syncing, setSyncing] = useState(false)
  const [squareFilter, setSquareFilter] = useState<'all' | 'matched' | 'orphan'>('all')
  const [invitingOrphan, setInvitingOrphan] = useState<string | null>(null)
  const [showExpense, setShowExpense] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  // Editable preview of the personal-note invitation text. Regenerated on
  // form-field change if the user hasn't touched the textareas yet; once
  // they edit, we leave their edits alone.
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewBody, setPreviewBody] = useState('')
  const [previewTouched, setPreviewTouched] = useState(false)

  function buildPreview(vals: {
    name?: string
    businessName?: string
    personalNote?: string
    fromName?: string
    fromDesignation?: string
  }) {
    const firstName = vals.name?.split(' ')[0]?.trim()
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
    const senderName = (vals.fromName || 'Kiran Hundal').trim()
    const senderFirst = senderName.split(' ')[0]
    const subject = `Quick note from ${senderFirst}`
    const businessLine = vals.businessName?.trim()
      ? `I thought of ${vals.businessName.trim()} and wanted to reach out.`
      : `I thought of you and wanted to reach out.`
    const body = [
      greeting,
      '',
      `Hope you're doing well. I'm on the board of the Central Valley Indian Chamber of Commerce, and we've been building a group of Indian-American business owners and professionals across the valley — finance, healthcare, real estate, hospitality, and a lot in between.`,
      businessLine,
      vals.personalNote?.trim() ? `\n${vals.personalNote.trim()}\n` : '',
      `Would you have 15 minutes for a coffee or a quick call so I can give you a real sense of what we do? No pressure either way — just wanted to say hello.`,
      '',
      `Warmly,`,
      senderName,
      (vals.fromDesignation || '').trim(),
      'Central Valley Indian Chamber of Commerce',
    ].filter(Boolean).join('\n')
    return { subject, body }
  }

  function regeneratePreviewFromForm(form: HTMLFormElement | null) {
    if (!form) return
    const fd = new FormData(form)
    const { subject, body } = buildPreview({
      name: fd.get('name') as string,
      businessName: fd.get('businessName') as string,
      personalNote: fd.get('personalNote') as string,
      fromName: fd.get('fromName') as string,
      fromDesignation: fd.get('fromDesignation') as string,
    })
    setPreviewSubject(subject)
    setPreviewBody(body)
    setPreviewTouched(false)
  }

  const [fetchError, setFetchError] = useState('')
  const { effectiveRole } = useEffectiveRole()

  // Sort state for both tables. Held at top level so hooks stay above the
  // early return, and applied inside the IIFEs that render each table.
  const squareSort = useSortable(summary?.square?.allPayments || [], {
    name: (p) => p.matchedMemberName || p.buyerName || '',
    email: (p) => p.matchedMemberEmail || p.buyerEmail || '',
    amount: (p) => (p.amountCents - p.refundedCents) / 100,
    fee: (p) => p.feeCents / 100,
    paidAt: (p) => new Date(p.paidAt),
    status: (p) => (p.matched ? 'matched' : 'orphan'),
  }, { key: 'paidAt', dir: 'desc' })
  const memberListSort = useSortable(summary?.memberList || [], {
    name: (m) => m.name,
    business: (m) => m.businessName || '',
    email: (m) => m.email,
    tier: (m) => m.membershipTier,
    status: (m) => m.status,
    amount: (m) => (m.inferredAmount ?? 0) as number,
    paid: (m) => (m.paymentDate ? new Date(m.paymentDate) : m.createdAt ? new Date(m.createdAt) : null),
  }, { key: 'paid', dir: 'desc' })

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
      if (user?.role !== 'admin' && user?.role !== 'moderator') {
        router.push('/portal')
        return
      }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('openExpense') === '1') setShowExpense(true)
        if (params.get('openInvite') === '1') setShowInvite(true)
      }
      fetchSummary()
    }
  }, [status, session, router, fetchSummary])

  async function handleInviteOrphan(paymentId: string, buyerLabel: string) {
    setInvitingOrphan(paymentId)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/square/orphans/${paymentId}/create-member`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Failed to send invite.' })
      } else {
        await fetchSummary()
        const emailNote = data.emailStatus === 'failed' ? ' (email send failed)' : ''
        const verb = data.linkedExisting ? 'Linked to existing member and re-sent invite to' : 'Created member and sent invite to'
        setNotice({
          type: 'success',
          text: `${verb} ${data.email} · Membership #${data.membershipNumber} (${data.tier})${emailNote}. Payment ${buyerLabel} is no longer orphan.`,
        })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setInvitingOrphan(null)
  }

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
        const skippedNote = skipped > 0 ? ` (${skipped} canceled/pending skipped)` : ''
        setNotice({
          type: 'success',
          text: `Synced ${completed} completed Square payments${skippedNote}. ${data.matchedCount} matched to members, ${data.unmatchedCount} orphaned.`,
        })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setSyncing(false)
  }

  async function handleExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setModalSaving(true)
    setModalError('')
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
        setModalError(data.error || 'Failed to log expense.')
      } else {
        setShowExpense(false)
        await fetchSummary()
        setNotice({ type: 'success', text: `Expense of $${payload.amount} logged.` })
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Network error.')
    }
    setModalSaving(false)
  }

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setModalSaving(true)
    setModalError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      email: fd.get('email'),
      name: fd.get('name'),
      businessName: fd.get('businessName'),
      suggestedTier: fd.get('suggestedTier'),
      personalNote: fd.get('personalNote'),
      fromName: fd.get('fromName'),
      fromDesignation: fd.get('fromDesignation'),
      fromEmail: fd.get('fromEmail'),
      fromReplyTo: fd.get('fromReplyTo'),
      textOnly: fd.get('textOnly') === 'on',
      subjectOverride: previewSubject,
      bodyOverride: previewBody,
    }
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setModalError(data.error || 'Failed to send invitation.')
      } else {
        setShowInvite(false)
        await fetchSummary()
        setNotice({ type: 'success', text: `Invitation sent to ${payload.email}.` })
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Network error.')
    }
    setModalSaving(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  // Preview mode: admin previewing as reviewer sees the "not accessible" shim.
  if (effectiveRole === 'reviewer') {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white border border-ivory-200 rounded-xl p-8">
          <AlertCircle className="w-10 h-10 text-mid mx-auto mb-4" />
          <h3 className="font-display text-h4 text-brand mb-2">Reviewer can&rsquo;t see Finances</h3>
          <p className="text-small text-mid mb-4">
            A Reviewer&rsquo;s account only sees the Members list and the approve/deny actions. No revenue, expenses, or Square details.
          </p>
          <Link href="/admin" className="inline-block bg-accent text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-sm hover:bg-gold-900 transition-all">
            Back to Admin Home
          </Link>
        </div>
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

  const headerActions = (
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
      <button
        type="button"
        onClick={() => { setModalError(''); setShowExpense(true) }}
        className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand text-xs font-medium px-3 py-1.5 rounded hover:border-accent/40"
      >
        <Plus className="w-3.5 h-3.5 text-red-600" />
        <span className="hidden sm:inline">Expense</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setModalError('')
          // Seed the preview so the textareas aren't empty on open.
          const { subject, body } = buildPreview({ fromName: 'Kiran Hundal', fromDesignation: 'Treasurer & Chief Financial Officer' })
          setPreviewSubject(subject)
          setPreviewBody(body)
          setPreviewTouched(false)
          setShowInvite(true)
        }}
        className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand text-xs font-medium px-3 py-1.5 rounded hover:border-accent/40"
      >
        <Send className="w-3.5 h-3.5 text-accent" />
        <span className="hidden sm:inline">Invite</span>
      </button>
    </>
  )

  return (
    <AdminShell title="Finances" actions={headerActions}>
        <div className="max-w-full">
          {notice && (
            <div className={`mb-6 border rounded-lg px-4 py-3 text-small flex items-start gap-3 ${
              notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* All Square Payments — one flat table incl. matched + orphans */}
          {summary.square.allPayments.length > 0 && (() => {
            const allPayments = summary.square.allPayments
            // Sort at top level via squareSort, then apply filter here.
            const rows = squareSort.sortedRows.filter((p) => {
              if (squareFilter === 'matched') return p.matched
              if (squareFilter === 'orphan') return !p.matched
              return true
            })
            const grossTotal = rows.reduce((sum, r) => sum + (r.amountCents - r.refundedCents) / 100, 0)
            const feeTotal = rows.reduce((sum, r) => sum + r.feeCents / 100, 0)
            const matchedCount = allPayments.filter((p) => p.matched).length
            const orphanCount = allPayments.length - matchedCount
            return (
              <div className="bg-white border border-emerald-200 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-label text-label tracking-widest uppercase text-brand">
                      Square Payments ({rows.length}{squareFilter !== 'all' && ` of ${allPayments.length}`})
                    </h3>
                    <ExportCsvButton
                      filename={`cvicc-square-payments-${squareFilter}-${new Date().toISOString().slice(0, 10)}.csv`}
                      rows={rows}
                      columns={[
                        { header: 'Paid At', get: (p) => p.paidAt ? new Date(p.paidAt).toISOString() : '' },
                        { header: 'Buyer Name', get: (p) => p.buyerName || '' },
                        { header: 'Buyer Email', get: (p) => p.buyerEmail || '' },
                        { header: 'Amount ($)', get: (p) => ((p.amountCents - p.refundedCents) / 100).toFixed(2) },
                        { header: 'Fee ($)', get: (p) => (p.feeCents / 100).toFixed(2) },
                        { header: 'Refunded ($)', get: (p) => (p.refundedCents / 100).toFixed(2) },
                        { header: 'Card', get: (p) => p.cardBrand ? `${p.cardBrand} ****${p.last4 || ''}` : '' },
                        { header: 'Receipt #', get: (p) => p.receiptNumber || '' },
                        { header: 'Matched Member', get: (p) => p.matchedMemberName || '' },
                        { header: 'Membership #', get: (p) => p.matchedMembershipNumber || '' },
                        { header: 'Matched Email', get: (p) => p.matchedMemberEmail || '' },
                        { header: 'Status', get: (p) => (p.matched ? 'matched' : 'orphan') },
                      ]}
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Gross · Fees</p>
                    <p className="font-display text-h4 text-brand">
                      {money(grossTotal)} <span className="text-amber-700 text-h5">− {money(feeTotal)}</span>
                    </p>
                    <p className="text-[0.7rem] text-hint">Net {money(grossTotal - feeTotal)}</p>
                  </div>
                </div>
                <div className="mb-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSquareFilter('all')}
                    className={`text-[0.65rem] tracking-widest uppercase font-label px-3 py-1.5 rounded-full border transition-all ${
                      squareFilter === 'all'
                        ? 'bg-navy-900 border-navy-900 text-white'
                        : 'bg-white border-ivory-200 text-mid hover:border-brand/30'
                    }`}
                  >
                    All ({allPayments.length})
                  </button>
                  <button
                    onClick={() => setSquareFilter('matched')}
                    className={`text-[0.65rem] tracking-widest uppercase font-label px-3 py-1.5 rounded-full border transition-all ${
                      squareFilter === 'matched'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    Matched ({matchedCount})
                  </button>
                  <button
                    onClick={() => setSquareFilter('orphan')}
                    className={`text-[0.65rem] tracking-widest uppercase font-label px-3 py-1.5 rounded-full border transition-all ${
                      squareFilter === 'orphan'
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    Orphans ({orphanCount})
                  </button>
                </div>
                {squareFilter === 'orphan' && orphanCount === 0 && (
                  <p className="text-small text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4">
                    ✓ No orphans. Every Square payment is linked to a site member.
                  </p>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-small">
                    <thead>
                      <tr className="border-b border-ivory-200 text-left">
                        <SortableTh label="Name / Business" sortKey="name" activeKey={squareSort.sortKey} dir={squareSort.sortDir} onToggle={squareSort.toggleSort} />
                        <SortableTh label="Email" sortKey="email" activeKey={squareSort.sortKey} dir={squareSort.sortDir} onToggle={squareSort.toggleSort} />
                        <SortableTh label="Amount" sortKey="amount" activeKey={squareSort.sortKey} dir={squareSort.sortDir} onToggle={squareSort.toggleSort} align="right" />
                        <SortableTh label="Fee" sortKey="fee" activeKey={squareSort.sortKey} dir={squareSort.sortDir} onToggle={squareSort.toggleSort} align="right" />
                        <SortableTh label="Date" sortKey="paidAt" activeKey={squareSort.sortKey} dir={squareSort.sortDir} onToggle={squareSort.toggleSort} />
                        <SortableTh label="Status" sortKey="status" activeKey={squareSort.sortKey} dir={squareSort.sortDir} onToggle={squareSort.toggleSort} />
                        <th className="px-3 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.id} className="border-b border-ivory-200/60 hover:bg-page-bg/50">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-brand">
                              {p.matchedMemberName || p.buyerName || '(no name)'}
                              {p.matchedMembershipNumber && (
                                <span className="ml-2 text-[0.65rem] font-normal text-hint">#{p.matchedMembershipNumber}</span>
                              )}
                            </p>
                            {p.buyerName && p.matchedMemberName && p.buyerName !== p.matchedMemberName && (
                              <p className="text-[0.65rem] text-hint">Square: {p.buyerName}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-[0.7rem] text-charcoal truncate max-w-[14rem]">
                              {p.matchedMemberEmail || p.buyerEmail || '—'}
                            </p>
                            {p.buyerEmail && p.matchedMemberEmail && p.buyerEmail !== p.matchedMemberEmail && (
                              <p className="text-[0.65rem] text-amber-700 truncate max-w-[14rem]" title="Different email on Square vs site">
                                Square: {p.buyerEmail}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-brand">
                            ${((p.amountCents - p.refundedCents) / 100).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-amber-700">
                            −${(p.feeCents / 100).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-[0.7rem] text-charcoal">
                            {new Date(p.paidAt).toLocaleDateString()}
                            {p.cardBrand && <span className="text-hint"> · {p.cardBrand} ····{p.last4}</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            {p.matched ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[0.6rem] font-medium">
                                <CheckCircle className="w-3 h-3" /> Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[0.6rem] font-medium">
                                <AlertCircle className="w-3 h-3" /> Orphan
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {!p.matched && p.buyerEmail && (
                              <button
                                onClick={() => handleInviteOrphan(p.id, p.buyerName || p.buyerEmail || 'this payment')}
                                disabled={invitingOrphan === p.id}
                                title={`Create a member for ${p.buyerName || p.buyerEmail} and email them the /register link`}
                                className="inline-flex items-center gap-1.5 bg-navy-900 text-white text-[0.6rem] font-label tracking-widest uppercase px-2.5 py-1.5 rounded-sm hover:bg-navy-800 disabled:opacity-50"
                              >
                                {invitingOrphan === p.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserPlus className="w-3 h-3 text-gold-400" />
                                )}
                                {invitingOrphan === p.id ? 'Sending' : 'Send Invite'}
                              </button>
                            )}
                            {!p.matched && !p.buyerEmail && (
                              <span className="text-[0.65rem] text-hint italic">No email on Square</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-brand/20 bg-page-bg">
                        <td colSpan={2} className="px-3 py-3 font-label text-[0.65rem] tracking-widest uppercase text-brand">
                          Totals ({rows.length} payments)
                        </td>
                        <td className="px-3 py-3 text-right font-display text-h5 text-brand">
                          {money(grossTotal)}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-amber-700">
                          −{money(feeTotal)}
                        </td>
                        <td colSpan={3} className="px-3 py-3 text-[0.7rem] text-mid">
                          Net after fees: <strong>{money(grossTotal - feeTotal)}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })()}

          {/* Expenses moved to their own tab — small summary hint */}
          <div className="bg-white border border-ivory-200 rounded-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-brand">Expenses</p>
                <p className="text-xs text-mid">
                  {money(summary.expenses.total)} total · {money(summary.expenses.logged)} logged + {money(Math.max(0, summary.expenses.total - summary.expenses.logged))} Square fees
                </p>
              </div>
            </div>
            <Link
              href="/admin/expenses"
              className="text-xs font-medium text-accent hover:text-gold-900 uppercase tracking-wide"
            >
              Manage expenses →
            </Link>
          </div>

          {/* Members list — full detail with payment info */}
          <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="font-label text-label tracking-widest uppercase text-brand">
                  Members &amp; Payments ({summary.memberList.length})
                </h3>
                <ExportCsvButton
                  filename={`cvicc-members-payments-${new Date().toISOString().slice(0, 10)}.csv`}
                  rows={summary.memberList}
                  columns={[
                    { header: 'Name', get: (m) => m.name },
                    { header: 'Business', get: (m) => m.businessName || '' },
                    { header: 'Email', get: (m) => m.email },
                    { header: 'Membership #', get: (m) => m.membershipNumber || '' },
                    { header: 'Tier', get: (m) => m.membershipTier },
                    { header: 'Status', get: (m) => m.status },
                    { header: 'Role', get: (m) => m.role },
                    { header: 'Payment Method', get: (m) => m.paymentMethod || '' },
                    { header: 'Amount Paid', get: (m) => m.amountPaid ?? '' },
                    { header: 'Inferred Amount', get: (m) => m.inferredAmount ?? '' },
                    { header: 'Estimated?', get: (m) => m.isEstimated ? 'yes' : 'no' },
                    { header: 'Has Square Receipt', get: (m) => m.hasSquareReceipt ? 'yes' : 'no' },
                    { header: 'Payment Reference', get: (m) => m.paymentReference || '' },
                    { header: 'Payment Date', get: (m) => m.paymentDate ? new Date(m.paymentDate).toISOString().slice(0, 10) : '' },
                  ]}
                />
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
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="border border-ivory-200 rounded-md px-3 py-1.5 text-small focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="all">All payment methods</option>
                  <option value="has_square_receipt">Has Square receipt ✓</option>
                  <option value="no_square_receipt">No Square receipt ✗</option>
                  <option value="square">Method: Square</option>
                  <option value="offline">Offline (Check / Zelle / Cash / Other)</option>
                  <option value="check">Check only</option>
                  <option value="zelle">Zelle only</option>
                  <option value="cash">Cash only</option>
                  <option value="other">Other only</option>
                  <option value="unknown">Method not recorded (—)</option>
                </select>
              </div>
            </div>

            {(() => {
              const matchesFilters = (m: MemberRow) => {
                if (memberFilter !== 'all' && m.status !== memberFilter) return false
                if (methodFilter !== 'all') {
                  const method = (m.paymentMethod || '').toLowerCase()
                  if (methodFilter === 'has_square_receipt') {
                    if (!m.hasSquareReceipt) return false
                  } else if (methodFilter === 'no_square_receipt') {
                    if (m.hasSquareReceipt) return false
                  } else if (methodFilter === 'unknown') {
                    if (method !== '') return false
                  } else if (methodFilter === 'offline') {
                    if (!['check', 'zelle', 'cash', 'other'].includes(method)) return false
                  } else if (method !== methodFilter) return false
                }
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
              }
              const visible = summary.memberList.filter(matchesFilters)
              const visibleTotal = visible.reduce((sum, m) => sum + m.inferredAmount, 0)
              const hasEstimated = visible.some((m) => m.isEstimated)
              return (
                <div className="mb-4 flex items-center justify-between bg-page-bg border border-ivory-200 rounded-lg px-4 py-3 gap-3 flex-wrap">
                  <div>
                    <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">
                      Sum of amounts shown
                    </p>
                    <p className="font-display text-h4 text-brand mt-0.5">{money(visibleTotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.7rem] text-mid">
                      {visible.length} {visible.length === 1 ? 'row' : 'rows'} visible
                    </p>
                    {hasEstimated && (
                      <p className="text-[0.65rem] text-hint mt-0.5">
                        Includes tier-default estimates for older records
                      </p>
                    )}
                  </div>
                </div>
              )
            })()}

            {(() => {
              const matchesFilters = (m: MemberRow) => {
                if (memberFilter !== 'all' && m.status !== memberFilter) return false
                if (methodFilter !== 'all') {
                  const method = (m.paymentMethod || '').toLowerCase()
                  if (methodFilter === 'has_square_receipt') {
                    if (!m.hasSquareReceipt) return false
                  } else if (methodFilter === 'no_square_receipt') {
                    if (m.hasSquareReceipt) return false
                  } else if (methodFilter === 'unknown') {
                    if (method !== '') return false
                  } else if (methodFilter === 'offline') {
                    if (!['check', 'zelle', 'cash', 'other'].includes(method)) return false
                  } else if (method !== methodFilter) return false
                }
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
              }
              // Filter then reorder by the current member-list sort.
              const filtered = memberListSort.sortedRows.filter(matchesFilters)

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
                          <SortableTh label="Member" sortKey="name" activeKey={memberListSort.sortKey} dir={memberListSort.sortDir} onToggle={memberListSort.toggleSort} className="px-6" />
                          <SortableTh label="Tier" sortKey="tier" activeKey={memberListSort.sortKey} dir={memberListSort.sortDir} onToggle={memberListSort.toggleSort} className="px-3" />
                          <SortableTh label="Status" sortKey="status" activeKey={memberListSort.sortKey} dir={memberListSort.sortDir} onToggle={memberListSort.toggleSort} className="px-3" />
                          <SortableTh label="Amount" sortKey="amount" activeKey={memberListSort.sortKey} dir={memberListSort.sortDir} onToggle={memberListSort.toggleSort} align="right" className="px-3" />
                          <th className="text-left px-3 py-2 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Method</th>
                          <SortableTh label="Date / Ref" sortKey="paid" activeKey={memberListSort.sortKey} dir={memberListSort.sortDir} onToggle={memberListSort.toggleSort} className="px-6" />
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
                                {m.isStaff ? (
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-navy-50 border border-navy-100 text-[0.6rem] capitalize font-medium text-brand">
                                    Staff
                                  </span>
                                ) : (
                                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${
                                    m.membershipTier === 'corporate' ? 'bg-navy-50 border-navy-100 text-brand' : 'bg-ivory-100 border-ivory-200 text-mid'
                                  }`}>
                                    {m.membershipTier}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${badge}`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                {m.isStaff ? (
                                  <span className="text-hint text-[0.7rem] italic">—</span>
                                ) : (
                                  <p className="font-medium text-brand">
                                    {money(m.inferredAmount)}
                                    {m.isEstimated && <span className="text-hint text-[0.6rem] ml-1">est.</span>}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                {m.isStaff ? (
                                  <span className="text-hint text-[0.7rem] italic">n/a</span>
                                ) : m.paymentMethod ? (
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
                              {m.isStaff ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-navy-50 border border-navy-100 text-[0.6rem] font-medium text-brand">
                                  Staff
                                </span>
                              ) : (
                                <>
                                  <p className="font-display text-h5 text-brand leading-none">
                                    {money(m.inferredAmount)}
                                  </p>
                                  {m.isEstimated && <p className="text-hint text-[0.55rem] mt-0.5">est.</p>}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {m.isStaff ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-navy-50 border border-navy-100 text-[0.6rem] capitalize font-medium text-brand">
                                Staff
                              </span>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${
                                m.membershipTier === 'corporate' ? 'bg-navy-50 border-navy-100 text-brand' : 'bg-ivory-100 border-ivory-200 text-mid'
                              }`}>
                                {m.membershipTier}
                              </span>
                            )}
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[0.6rem] capitalize font-medium ${badge}`}>
                              {m.status}
                            </span>
                            {!m.isStaff && m.paymentMethod && (
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

        </div>

      {/* Expense Modal */}
      {showExpense && (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4" onClick={() => !modalSaving && setShowExpense(false)}>
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-h4 text-brand">Log Expense</h3>
              <button onClick={() => !modalSaving && setShowExpense(false)} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Category *</label>
                <select name="category" required defaultValue="" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="" disabled>Select</option>
                  {['Hosting & Tech','Marketing','Events','Office & Supplies','Legal & Professional','Insurance','Travel','Other'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Vendor *</label>
                <input name="vendor" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="e.g. Vercel" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Amount ($) *</label>
                <input name="amount" type="number" min="1" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Payment Method</label>
                <select name="paymentMethod" defaultValue="card" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Date</label>
                <input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Reference</label>
                <input name="paymentReference" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              {modalError && <div className="md:col-span-2 text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{modalError}</div>}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExpense(false)} disabled={modalSaving} className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={modalSaving} className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-gold-900 disabled:opacity-50">
                  {modalSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4" onClick={() => !modalSaving && setShowInvite(false)}>
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-h4 text-brand">Send Membership Invitation</h3>
              <button onClick={() => !modalSaving && setShowInvite(false)} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Email *</label>
                <input name="email" type="email" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Their Name</label>
                <input
                  name="name"
                  onChange={(e) => { if (!previewTouched) regeneratePreviewFromForm(e.currentTarget.form) }}
                  className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Business Name</label>
                <input
                  name="businessName"
                  onChange={(e) => { if (!previewTouched) regeneratePreviewFromForm(e.currentTarget.form) }}
                  className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Suggested Tier</label>
                <select name="suggestedTier" defaultValue="" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="">No suggestion</option>
                  <option value="individual">Individual ($95/yr)</option>
                  <option value="corporate">Corporate ($395/yr)</option>
                </select>
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Sign As (Name)</label>
                <input
                  name="fromName"
                  defaultValue="Kiran Hundal"
                  placeholder="e.g. Kiran Hundal"
                  onChange={(e) => { if (!previewTouched) regeneratePreviewFromForm(e.currentTarget.form) }}
                  className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Your Designation</label>
                <input
                  name="fromDesignation"
                  defaultValue="Treasurer & Chief Financial Officer"
                  placeholder="e.g. Treasurer & CFO"
                  onChange={(e) => { if (!previewTouched) regeneratePreviewFromForm(e.currentTarget.form) }}
                  className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Send From</label>
                <select
                  name="fromEmail"
                  defaultValue=""
                  onChange={(e) => {
                    // Autofill signature to match the chosen sender so admins
                    // don't have to hand-edit three fields to switch identity.
                    const form = e.currentTarget.form
                    if (!form) return
                    const preset = {
                      '': { name: 'The CVICC Board', role: '' },
                      'sonia@indianchamberofcommerce.org': { name: 'Sonia Heer', role: 'Chairwoman · Founder · Spokeswoman' },
                      'raj@indianchamberofcommerce.org': { name: 'Rajinder Kumar', role: 'Executive Director · Founder' },
                    }[e.currentTarget.value] || { name: 'The CVICC Board', role: '' }
                    const nameEl = form.elements.namedItem('fromName') as HTMLInputElement | null
                    const desigEl = form.elements.namedItem('fromDesignation') as HTMLInputElement | null
                    if (nameEl) nameEl.value = preset.name
                    if (desigEl) desigEl.value = preset.role
                  }}
                  className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">info@indianchamberofcommerce.org (default)</option>
                  <option value="sonia@indianchamberofcommerce.org">sonia@indianchamberofcommerce.org — Sonia Heer</option>
                  <option value="raj@indianchamberofcommerce.org">raj@indianchamberofcommerce.org — Rajinder Kumar</option>
                </select>
                <p className="text-[0.65rem] text-hint mt-1">Picks the sender + auto-fills their signature.</p>
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Reply-To (Optional)</label>
                <input name="fromReplyTo" type="email" placeholder="kiran.farmers@gmail.com" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
                <p className="text-[0.65rem] text-hint mt-1">
                  Any address (Gmail is fine). Where replies land when the recipient hits Reply.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Personal Note</label>
                <textarea
                  name="personalNote"
                  rows={2}
                  onChange={(e) => {
                    // If the user hasn't manually edited the preview yet,
                    // keep it in sync with the note field.
                    if (!previewTouched) regeneratePreviewFromForm(e.currentTarget.form)
                  }}
                  className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30"
                  placeholder="Optional — e.g. 'We met at the Fresno Chamber event last week'"
                />
              </div>

              {/* Preview & edit the actual email body */}
              <div className="md:col-span-2 bg-page-bg border border-ivory-200 rounded-md p-4 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-label text-[0.65rem] tracking-widest uppercase text-brand">Email preview — edit anything</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      const form = (e.currentTarget as HTMLButtonElement).closest('form')
                      regeneratePreviewFromForm(form)
                    }}
                    className="text-[0.65rem] font-medium text-accent hover:text-gold-900 uppercase tracking-widest"
                  >
                    ⟳ Regenerate from fields
                  </button>
                </div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-mid block mb-1">Subject</label>
                <input
                  type="text"
                  value={previewSubject}
                  onChange={(e) => { setPreviewSubject(e.target.value); setPreviewTouched(true) }}
                  className="w-full border border-ivory-200 rounded px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30 mb-3 bg-white"
                />
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-mid block mb-1">Body</label>
                <textarea
                  value={previewBody}
                  onChange={(e) => { setPreviewBody(e.target.value); setPreviewTouched(true) }}
                  rows={14}
                  className="w-full border border-ivory-200 rounded px-3 py-2 text-body font-mono text-[0.85rem] leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"
                />
                <p className="text-[0.65rem] text-hint mt-2">
                  What you type here is exactly what the recipient sees. Regenerate resets it to the auto-filled version.
                </p>
              </div>
              <label className="md:col-span-2 flex items-start gap-3 cursor-pointer select-none bg-gold-50 border border-gold-100 rounded-md p-3 mt-1">
                <input type="checkbox" name="textOnly" defaultChecked className="mt-0.5 w-4 h-4 accent-accent" />
                <span className="text-small text-charcoal">
                  <strong>Send as personal note (lands in Primary inbox)</strong>
                  <br />
                  <span className="text-mid text-[0.75rem]">
                    Uses the editable body above with subtle Georgia-serif formatting and an
                    understated &ldquo;join here&rdquo; link — reads premium but stays out of Promotions.
                    Uncheck to send the full branded template with the CVICC banner + Join button
                    (higher polish, more likely to land in Promotions on a young domain).
                  </span>
                </span>
              </label>
              {modalError && <div className="md:col-span-2 text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{modalError}</div>}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} disabled={modalSaving} className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={modalSaving} className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-gold-900 disabled:opacity-50">
                  {modalSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending...</> : <><Send className="w-3.5 h-3.5" />Send Invitation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
