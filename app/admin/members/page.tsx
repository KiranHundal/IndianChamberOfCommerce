'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  CheckCircle,
  XCircle,
  UserX,
  Users,
  RefreshCw,
  Search,
  DollarSign,
  X,
  Loader2,
  Send,
  MailCheck,
} from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { useEffectiveRole } from '@/lib/use-effective-role'
import AdminShell from '@/components/admin/AdminShell'
import ExportCsvButton from '@/components/admin/ExportCsvButton'
import SortableTh from '@/components/admin/SortableTh'
import { useSortable } from '@/lib/use-sortable'

interface Member {
  id: string
  name: string
  email: string
  phone: string | null
  businessName: string | null
  city: string | null
  sector: string | null
  membershipTier: string
  status: string
  role: string
  membershipNumber: string | null
  createdAt: string | number
  approvedAt: string | number | null
  deactivatedAt: string | number | null
  paymentMethod: string | null
  amountPaid: number | null
  paymentReference: string | null
  paymentDate: string | number | null
  paymentLinkSentAt: string | number | null
  referredBy: string | null
}

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  deactivated: { label: 'Deactivated', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { effectiveRole } = useEffectiveRole()
  const uiRole = effectiveRole || (session?.user as Record<string, unknown> | undefined)?.role
  const isAdmin = uiRole === 'admin'
  const canApproveDeny = uiRole === 'admin' || uiRole === 'reviewer'
  const canFinanceActions = uiRole === 'admin' || uiRole === 'moderator'
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [boardOptions, setBoardOptions] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [referredByFilter, setReferredByFilter] = useState<{ id: string; name: string } | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/members')
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch {
      // silently fail
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
      if (user?.role !== 'admin' && user?.role !== 'moderator' && user?.role !== 'reviewer') {
        router.push('/portal')
        return
      }
      // Parse URL params: openLogPayment, status, referredBy
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('openLogPayment') === '1') {
          setPaymentError('')
          setShowPaymentModal(true)
        }
        const s = params.get('status')
        if (s && ['all', 'pending', 'unpaid', 'approved', 'rejected', 'deactivated'].includes(s)) {
          setFilter(s)
        }
        const rb = params.get('referredBy')
        if (rb) setReferredByFilter({ id: rb, name: params.get('referredByName') || rb })
      }
      fetchMembers()
      // Load board options for the Log Offline Payment dropdown.
      fetch('/api/board-members-public')
        .then((r) => (r.ok ? r.json() : { boardMembers: [] }))
        .then((d) => setBoardOptions(d.boardMembers || []))
        .catch(() => {})
    }
  }, [status, session, router, fetchMembers])

  async function handleAction(memberId: string, action: string) {
    setActionLoading(`${memberId}-${action}`)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action }),
      })
      if (res.ok) {
        await fetchMembers()
      }
    } catch {
      // silently fail
    }
    setActionLoading(null)
  }

  async function handleSendPaymentLink(member: Member) {
    setActionLoading(`${member.id}-paylink`)
    try {
      const res = await fetch('/api/admin/members/send-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Failed to send payment link.' })
      } else {
        setNotice({ type: 'success', text: `Payment link sent to ${member.email}.` })
        await fetchMembers()
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setActionLoading(null)
  }

  async function handleSetReferrer(member: Member, referredBy: string) {
    if (!referredBy) return
    setActionLoading(`${member.id}-referrer`)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, action: 'set-referrer', referredBy }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Failed to set referrer.' })
      } else {
        const boardName = boardIdToName.get(referredBy) || referredBy
        setNotice({ type: 'success', text: `${member.name} → referred by ${boardName}.` })
        await fetchMembers()
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setActionLoading(null)
  }

  async function handleResendWelcome(member: Member) {
    setActionLoading(`${member.id}-welcome`)
    try {
      const res = await fetch('/api/admin/members/resend-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Failed to send welcome email.' })
      } else {
        setNotice({ type: 'success', text: `Welcome email sent to ${member.email} (#${member.membershipNumber}).` })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setActionLoading(null)
  }

  async function handleLogPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPaymentSaving(true)
    setPaymentError('')

    const form = e.currentTarget
    const fd = new FormData(form)
    const payload = {
      name: (fd.get('name') as string).trim(),
      email: (fd.get('email') as string).trim(),
      phone: (fd.get('phone') as string).trim() || null,
      businessName: (fd.get('businessName') as string).trim() || null,
      city: (fd.get('city') as string).trim() || null,
      sector: (fd.get('sector') as string).trim() || null,
      membershipTier: fd.get('membershipTier') as string,
      paymentMethod: fd.get('paymentMethod') as string,
      amountPaid: parseInt(fd.get('amountPaid') as string, 10),
      paymentReference: (fd.get('paymentReference') as string).trim() || null,
      paymentDate: fd.get('paymentDate') as string,
      sendEmail: fd.get('sendEmail') === 'on',
      referredBy: (fd.get('referredBy') as string) || null,
    }

    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setPaymentError(data.error || 'Failed to log payment.')
      } else {
        setShowPaymentModal(false)
        await fetchMembers()
        const emailNote =
          data.emailStatus === 'sent'
            ? ' Approval email sent.'
            : data.emailStatus === 'failed'
              ? ' (Email send failed.)'
              : ''
        setNotice({
          type: 'success',
          text: `Payment logged. Membership #${data.membershipNumber} assigned to ${payload.name}.${emailNote}`,
        })
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Network error.')
    }
    setPaymentSaving(false)
  }

  function isUnpaidPending(m: Member): boolean {
    if (m.status !== 'pending') return false
    if (m.role === 'admin' || m.role === 'moderator' || m.role === 'reviewer') return false
    const paid = (m.amountPaid && m.amountPaid > 0) || !!m.paymentMethod
    return !paid
  }

  const filteredMembers = members.filter((m) => {
    if (referredByFilter && m.referredBy !== referredByFilter.id) return false
    if (filter === 'unpaid') {
      if (!isUnpaidPending(m)) return false
    } else if (filter === 'pending') {
      if (m.status !== 'pending' || isUnpaidPending(m)) return false
    } else if (filter !== 'all' && m.status !== filter) {
      return false
    }
    if (search) {
      const q = search.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.businessName?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q) ||
        m.membershipNumber?.includes(q)
      )
    }
    return true
  })

  const boardIdToName = new Map(boardOptions.map((b) => [b.id, b.name]))
  const membersSort = useSortable(filteredMembers, {
    name: (m) => m.name,
    email: (m) => m.email,
    business: (m) => m.businessName || '',
    tier: (m) => m.membershipTier,
    status: (m) => m.status,
    payment: (m) => (m.amountPaid ?? 0) as number,
    joined: (m) => (m.createdAt ? new Date(m.createdAt) : null),
  }, { key: 'joined', dir: 'desc' })
  const sortedMembers = membersSort.sortedRows

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  // Counters exclude admin/moderator staff so they line up with the "Members"
  // KPI on /admin, which is a paying-member count. Staff still show in the
  // list itself for management.
  const nonStaff = members.filter((m) => m.role !== 'admin' && m.role !== 'moderator')
  const staffCount = members.length - nonStaff.length
  const unpaidCount = nonStaff.filter(isUnpaidPending).length
  const counts = {
    all: nonStaff.length,
    pending: nonStaff.filter((m) => m.status === 'pending').length - unpaidCount,
    unpaid: unpaidCount,
    approved: nonStaff.filter((m) => m.status === 'approved').length,
    rejected: nonStaff.filter((m) => m.status === 'rejected').length,
    deactivated: nonStaff.filter((m) => m.status === 'deactivated').length,
  }

  const exportColumns = [
    { header: 'Name', get: (m: Member) => m.name },
    { header: 'Email', get: (m: Member) => m.email },
    { header: 'Phone', get: (m: Member) => m.phone || '' },
    { header: 'Business', get: (m: Member) => m.businessName || '' },
    { header: 'City', get: (m: Member) => m.city || '' },
    { header: 'Sector', get: (m: Member) => m.sector || '' },
    { header: 'Tier', get: (m: Member) => m.membershipTier },
    { header: 'Status', get: (m: Member) => m.status },
    { header: 'Role', get: (m: Member) => m.role },
    { header: 'Membership #', get: (m: Member) => m.membershipNumber || '' },
    { header: 'Payment Method', get: (m: Member) => m.paymentMethod || '' },
    { header: 'Amount Paid', get: (m: Member) => m.amountPaid ?? '' },
    { header: 'Payment Reference', get: (m: Member) => m.paymentReference || '' },
    { header: 'Payment Date', get: (m: Member) => m.paymentDate ? new Date(m.paymentDate).toISOString().slice(0, 10) : '' },
    { header: 'Joined', get: (m: Member) => m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : '' },
  ]
  const exportFilename = `cvicc-members-${filter}-${new Date().toISOString().slice(0, 10)}.csv`

  async function handleSendRenewals() {
    if (!confirm('Send renewal reminder emails to members expiring in the next 30 days (skipping any sent in the last 21 days)?')) return
    setNotice(null)
    try {
      const res = await fetch('/api/admin/renewals/send-reminders', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Failed to send reminders.' })
      } else {
        setNotice({
          type: 'success',
          text: `Sent ${data.sent} reminder${data.sent === 1 ? '' : 's'}. Skipped ${data.skippedCooldown} in cooldown, ${data.skippedOutOfWindow} out of window.${data.errors?.length ? ` ${data.errors.length} failed.` : ''}`,
        })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
  }

  const headerActions = (
    <>
      <ExportCsvButton
        filename={exportFilename}
        rows={filteredMembers}
        columns={exportColumns}
      />
      {canFinanceActions && (
        <>
          <button
            type="button"
            onClick={handleSendRenewals}
            className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand text-xs font-medium px-3 py-1.5 rounded hover:border-accent/40"
            title="Send renewal reminder emails to members expiring in the next 30 days"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-500" />
            <span className="hidden sm:inline">Send Renewals</span>
          </button>
          <button
            type="button"
            onClick={() => { setPaymentError(''); setShowPaymentModal(true) }}
            className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-gold-900"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Offline Payment</span>
          </button>
        </>
      )}
    </>
  )

  return (
    <AdminShell title="Members" actions={headerActions}>
        <div>{/* keep block wrapper for existing layout children */}

          {referredByFilter && (
            <div className="mb-4 bg-navy-50 border border-navy-100 rounded px-4 py-2.5 flex items-center gap-3 text-sm">
              <span className="text-brand">
                Showing members referred by <strong>{referredByFilter.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setReferredByFilter(null)
                  const url = new URL(window.location.href)
                  url.searchParams.delete('referredBy')
                  url.searchParams.delete('referredByName')
                  window.history.replaceState({}, '', url.toString())
                }}
                className="ml-auto text-xs font-medium text-accent hover:text-gold-900 uppercase tracking-wide"
              >
                Clear filter
              </button>
            </div>
          )}

          {notice && (
            <div
              className={`mb-6 border rounded-lg px-4 py-3 text-small flex items-start gap-3 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Row */}
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
              {(['all', 'pending', 'unpaid', 'approved', 'rejected', 'deactivated'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`leadership-card p-4 rounded-xl border text-center transition-all ${
                    filter === key
                      ? 'bg-navy-900 border-navy-800 text-white'
                      : 'bg-white border-ivory-200 text-brand hover:border-accent/40'
                  }`}
                >
                  <p className="font-display text-h3 font-light">{counts[key]}</p>
                  <p className="font-label text-[0.6rem] tracking-widest uppercase mt-1 opacity-60">
                    {key === 'all' ? 'Total' : key === 'pending' ? 'Awaiting Approval' : key}
                  </p>
                </button>
              ))}
            </div>
            {staffCount > 0 && (
              <p className="text-[0.65rem] text-hint mb-10">
                Totals exclude {staffCount} admin/moderator {staffCount === 1 ? 'account' : 'accounts'}, listed below for management.
              </p>
            )}
            {staffCount === 0 && <div className="mb-10" />}
          </AnimatedSection>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, business..."
                className="w-full bg-white border border-ivory-200 rounded pl-10 pr-4 py-2 text-sm text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <select
              value={referredByFilter?.id || ''}
              onChange={(e) => {
                const id = e.target.value
                if (!id) {
                  setReferredByFilter(null)
                  const url = new URL(window.location.href)
                  url.searchParams.delete('referredBy')
                  url.searchParams.delete('referredByName')
                  window.history.replaceState({}, '', url.toString())
                } else {
                  const name = boardIdToName.get(id) || id
                  setReferredByFilter({ id, name })
                }
              }}
              className="bg-white border border-ivory-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">All referrers</option>
              {boardOptions.map((b) => (
                <option key={b.id} value={b.id}>Referred by {b.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchMembers}
              className="ml-auto inline-flex items-center gap-1.5 text-mid text-xs font-medium hover:text-brand"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Result count */}
          {(search || filter !== 'all') && (
            <p className="text-small text-mid mb-4">
              Showing {filteredMembers.length} of {members.length} members
              {search && <> matching &ldquo;{search}&rdquo;</>}
            </p>
          )}

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white border border-ivory-200 rounded-lg p-12 text-center">
              <Users className="w-10 h-10 text-hint mx-auto mb-4" />
              <p className="text-sm text-mid">No members found.</p>
            </div>
          ) : (
            <>
              {/* Mobile: card layout — table cells wrap awkwardly on small
                  screens so we show a card per member instead. Same info,
                  stacked vertically, actions flush to the bottom of each card. */}
              <div className="lg:hidden space-y-3">
                {sortedMembers.map((member) => {
                  const badge = statusBadge[member.status] || statusBadge.pending
                  const isStaff = member.role === 'admin' || member.role === 'moderator' || member.role === 'reviewer'
                  const unpaid = isUnpaidPending(member)
                  const linkSent = !!member.paymentLinkSentAt
                  const explicit = !!(member.amountPaid && member.amountPaid > 0)
                  const isApproved = member.status === 'approved'
                  const paymentAmount = explicit
                    ? member.amountPaid!
                    : member.membershipTier === 'corporate' ? 395 : 95
                  const paymentMethod = member.paymentMethod || (isApproved && !isStaff ? 'square' : null)
                  const showPayment = !isStaff && (explicit || isApproved)
                  return (
                    <div key={member.id} className="bg-white border border-ivory-200 rounded-lg p-4">
                      {/* Header row: name + status */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium text-brand text-base truncate">{member.name}</p>
                            {member.role === 'admin' && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-navy-900 text-gold-400 text-[0.55rem] font-medium uppercase tracking-wide">
                                <Shield className="w-2.5 h-2.5" />A
                              </span>
                            )}
                            {member.role === 'moderator' && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent text-[0.55rem] font-medium uppercase tracking-wide">
                                <Shield className="w-2.5 h-2.5" />M
                              </span>
                            )}
                            {member.role === 'reviewer' && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[0.55rem] font-medium uppercase tracking-wide">
                                <Shield className="w-2.5 h-2.5" />R
                              </span>
                            )}
                          </div>
                          {member.membershipNumber && (
                            <p className="text-[0.65rem] text-hint mt-0.5">#{member.membershipNumber}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[0.65rem] font-medium flex-shrink-0 ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Contact block */}
                      <div className="text-xs text-charcoal mb-2 break-all">{member.email}</div>
                      {member.phone && <div className="text-xs text-hint mb-2">{member.phone}</div>}

                      {/* Business + location */}
                      {(member.businessName || member.city || member.sector) && (
                        <div className="text-xs text-mid mb-3">
                          {member.businessName && <p className="font-medium text-charcoal">{member.businessName}</p>}
                          {(member.city || member.sector) && (
                            <p className="text-hint mt-0.5">{[member.city, member.sector].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                      )}

                      {/* Tier + payment chips */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {isStaff ? (
                          <span className="inline-flex px-2 py-0.5 rounded border text-[0.65rem] font-medium bg-navy-50 border-navy-100 text-brand">
                            Staff
                          </span>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded border text-[0.65rem] font-medium capitalize ${
                            member.membershipTier === 'corporate'
                              ? 'bg-navy-50 border-navy-100 text-brand'
                              : 'bg-ivory-100 border-ivory-200 text-mid'
                          }`}>
                            {member.membershipTier}
                          </span>
                        )}
                        {showPayment && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded px-2 py-0.5 text-[0.65rem] font-medium">
                            ${paymentAmount} · <span className="capitalize">{paymentMethod}</span>{!explicit && ' · est.'}
                          </span>
                        )}
                        {unpaid && (
                          <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 rounded px-2 py-0.5 text-[0.65rem] font-medium">
                            ${member.membershipTier === 'corporate' ? '395' : '95'} due
                          </span>
                        )}
                        {unpaid && linkSent && (
                          <span
                            className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded px-2 py-0.5 text-[0.65rem]"
                            title={`Link sent ${new Date(member.paymentLinkSentAt!).toLocaleString()}`}
                          >
                            <MailCheck className="w-2.5 h-2.5" /> Link sent
                          </span>
                        )}
                        {member.createdAt && (
                          <span className="text-[0.65rem] text-hint ml-auto">
                            {new Date(member.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Referred By */}
                      {!isStaff && (
                        <div className="mb-3 text-xs">
                          <span className="text-hint text-[0.65rem] uppercase tracking-wide mr-2">Referred by</span>
                          {member.referredBy ? (
                            <span className="text-charcoal">{boardIdToName.get(member.referredBy) || 'Unknown'}</span>
                          ) : (
                            <select
                              defaultValue=""
                              disabled={actionLoading === `${member.id}-referrer`}
                              onChange={(e) => { if (e.target.value) handleSetReferrer(member, e.target.value) }}
                              className="bg-white border border-ivory-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand/30"
                            >
                              <option value="">— Not set —</option>
                              {boardOptions.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      {/* Actions flush at the bottom */}
                      <div className="flex gap-2 flex-wrap pt-2 border-t border-ivory-200/60">
                        {member.status === 'pending' && unpaid && canFinanceActions && (
                          <button
                            type="button"
                            onClick={() => handleSendPaymentLink(member)}
                            disabled={actionLoading === `${member.id}-paylink`}
                            className="flex-1 min-w-[6rem] inline-flex items-center justify-center gap-1 bg-navy-900 text-white text-xs font-medium px-3 py-2 rounded hover:bg-navy-800 disabled:opacity-50"
                          >
                            {actionLoading === `${member.id}-paylink`
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Send className="w-3.5 h-3.5 text-gold-400" />}
                            {linkSent ? 'Resend' : 'Send Link'}
                          </button>
                        )}
                        {member.status === 'pending' && canApproveDeny && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAction(member.id, 'approve')}
                              disabled={actionLoading === `${member.id}-approve` || unpaid}
                              title={unpaid ? 'Log a payment before approving' : undefined}
                              className="flex-1 min-w-[6rem] inline-flex items-center justify-center gap-1 bg-emerald-600 text-white text-xs font-medium px-3 py-2 rounded hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {unpaid ? 'Awaiting' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(member.id, 'reject')}
                              disabled={actionLoading === `${member.id}-reject`}
                              className="flex-1 min-w-[6rem] inline-flex items-center justify-center gap-1 bg-white border border-red-200 text-red-600 text-xs font-medium px-3 py-2 rounded hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                        {canFinanceActions && member.status === 'approved' && !isStaff && !!member.membershipNumber && (
                          <button
                            type="button"
                            onClick={() => handleResendWelcome(member)}
                            disabled={actionLoading === `${member.id}-welcome`}
                            className="flex-1 min-w-[6rem] inline-flex items-center justify-center gap-1 bg-accent text-white text-xs font-medium px-3 py-2 rounded hover:bg-gold-900 disabled:opacity-50"
                          >
                            {actionLoading === `${member.id}-welcome`
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Send className="w-3.5 h-3.5" />}
                            Send Invite
                          </button>
                        )}
                        {isAdmin && member.status === 'approved' && member.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleAction(member.id, 'deactivate')}
                            disabled={actionLoading === `${member.id}-deactivate`}
                            className="flex-1 min-w-[6rem] inline-flex items-center justify-center gap-1 bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden lg:block bg-white border border-ivory-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm [&_th]:!px-2 [&_td]:px-2">
                  <thead className="bg-page-bg">
                    <tr className="text-left border-b border-ivory-200">
                      <SortableTh label="Member" sortKey="name" activeKey={membersSort.sortKey} dir={membersSort.sortDir} onToggle={membersSort.toggleSort} />
                      <SortableTh label="Business" sortKey="business" activeKey={membersSort.sortKey} dir={membersSort.sortDir} onToggle={membersSort.toggleSort} />
                      <SortableTh label="Tier" sortKey="tier" activeKey={membersSort.sortKey} dir={membersSort.sortDir} onToggle={membersSort.toggleSort} />
                      <SortableTh label="Status" sortKey="status" activeKey={membersSort.sortKey} dir={membersSort.sortDir} onToggle={membersSort.toggleSort} />
                      <SortableTh label="Payment" sortKey="payment" activeKey={membersSort.sortKey} dir={membersSort.sortDir} onToggle={membersSort.toggleSort} align="right" />
                      <th className="py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid text-right">Actions</th>
                      <th className="py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid">Referred By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMembers.map((member) => {
                      const badge = statusBadge[member.status] || statusBadge.pending
                      const isStaff = member.role === 'admin' || member.role === 'moderator' || member.role === 'reviewer'
                      const unpaid = isUnpaidPending(member)
                      const linkSent = !!member.paymentLinkSentAt
                      const explicit = !!(member.amountPaid && member.amountPaid > 0)
                      const isApproved = member.status === 'approved'
                      const paymentAmount = explicit
                        ? member.amountPaid!
                        : member.membershipTier === 'corporate' ? 395 : 95
                      const paymentMethod = member.paymentMethod || (isApproved && !isStaff ? 'square' : null)
                      const showPayment = !isStaff && (explicit || isApproved)
                      return (
                        <tr key={member.id} className="border-b border-ivory-200/60 hover:bg-page-bg/40 align-top">
                          <td className="py-2 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-medium text-brand truncate max-w-[10rem] text-sm" title={member.name}>{member.name}</p>
                              {member.role === 'admin' && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-navy-900 text-gold-400 text-[0.55rem] font-medium uppercase tracking-wide">
                                  <Shield className="w-2.5 h-2.5" /> A
                                </span>
                              )}
                              {member.role === 'moderator' && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent text-[0.55rem] font-medium uppercase tracking-wide">
                                  <Shield className="w-2.5 h-2.5" /> M
                                </span>
                              )}
                              {member.role === 'reviewer' && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[0.55rem] font-medium uppercase tracking-wide">
                                  <Shield className="w-2.5 h-2.5" /> R
                                </span>
                              )}
                            </div>
                            <p className="text-hint text-[0.65rem] truncate max-w-[12rem]" title={member.email}>{member.email}</p>
                            <div className="text-[0.6rem] text-hint mt-0.5 flex gap-1.5">
                              {member.membershipNumber && <span>#{member.membershipNumber}</span>}
                              {member.phone && <span>· {member.phone}</span>}
                            </div>
                          </td>
                          <td className="py-2 text-xs">
                            {member.businessName ? (
                              <p className="text-charcoal truncate max-w-[10rem]" title={member.businessName}>{member.businessName}</p>
                            ) : (
                              <p className="text-hint italic">—</p>
                            )}
                            <p className="text-hint text-[0.65rem] mt-0.5 truncate max-w-[10rem]">
                              {[member.city, member.sector].filter(Boolean).join(' · ') || ''}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {isStaff ? (
                              <span className="inline-flex px-2 py-0.5 rounded border text-[0.65rem] font-medium bg-navy-50 border-navy-100 text-brand">
                                Staff
                              </span>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded border text-[0.65rem] font-medium capitalize ${
                                member.membershipTier === 'corporate'
                                  ? 'bg-navy-50 border-navy-100 text-brand'
                                  : 'bg-ivory-100 border-ivory-200 text-mid'
                              }`}>
                                {member.membershipTier}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[0.65rem] font-medium ${badge.bg} ${badge.color}`}>
                              {badge.label}
                            </span>
                            {unpaid && (
                              <p className="text-[0.6rem] text-navy-600 font-medium mt-0.5">
                                ${member.membershipTier === 'corporate' ? '395' : '95'} due
                              </p>
                            )}
                            {unpaid && linkSent && (
                              <p
                                className="text-[0.6rem] text-emerald-700 flex items-center gap-1 mt-0.5"
                                title={`Payment link sent ${new Date(member.paymentLinkSentAt!).toLocaleString()}`}
                              >
                                <MailCheck className="w-2.5 h-2.5" /> Link sent
                              </p>
                            )}
                          </td>
                          <td className="py-2 text-right text-xs">
                            {showPayment ? (
                              <>
                                <p className="text-brand font-medium">${paymentAmount}</p>
                                <p className="text-hint text-[0.65rem]">
                                  <span className="capitalize">{paymentMethod}</span>
                                  {!explicit && ' · est.'}
                                </p>
                              </>
                            ) : (
                              <p className="text-hint italic">—</p>
                            )}
                            {member.createdAt && (
                              <p className="text-hint text-[0.6rem] mt-0.5 whitespace-nowrap">
                                {new Date(member.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            <div className="inline-flex gap-1 flex-wrap justify-end">
                              {member.status === 'pending' && unpaid && canFinanceActions && (
                                <button
                                  type="button"
                                  onClick={() => handleSendPaymentLink(member)}
                                  disabled={actionLoading === `${member.id}-paylink`}
                                  title={linkSent ? `Resend Square payment link (last sent ${new Date(member.paymentLinkSentAt!).toLocaleDateString()})` : 'Email member the Square payment link'}
                                  className="inline-flex items-center bg-navy-900 text-white p-1 rounded hover:bg-navy-800 disabled:opacity-50"
                                >
                                  {actionLoading === `${member.id}-paylink` ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5 text-gold-400" />
                                  )}
                                </button>
                              )}
                              {member.status === 'pending' && canApproveDeny && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAction(member.id, 'approve')}
                                    disabled={actionLoading === `${member.id}-approve` || unpaid}
                                    title={unpaid ? 'Log a payment before approving' : 'Approve this member'}
                                    className="inline-flex items-center bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAction(member.id, 'reject')}
                                    disabled={actionLoading === `${member.id}-reject`}
                                    title="Reject this member"
                                    className="inline-flex items-center bg-white border border-red-200 text-red-600 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {canFinanceActions && member.status === 'approved' && !isStaff && !!member.membershipNumber && (
                                <button
                                  type="button"
                                  onClick={() => handleResendWelcome(member)}
                                  disabled={actionLoading === `${member.id}-welcome`}
                                  title={`Resend welcome email w/ #${member.membershipNumber} to ${member.email}`}
                                  className="inline-flex items-center bg-accent text-white p-1 rounded hover:bg-gold-900 disabled:opacity-50"
                                >
                                  {actionLoading === `${member.id}-welcome` ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              {isAdmin && member.status === 'approved' && member.role !== 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleAction(member.id, 'deactivate')}
                                  disabled={actionLoading === `${member.id}-deactivate`}
                                  title="Deactivate this member"
                                  className="inline-flex items-center bg-white border border-gray-200 text-gray-600 p-1 rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isStaff ? (
                              <span className="text-hint italic text-xs">—</span>
                            ) : member.referredBy ? (
                              <p className="text-[0.7rem] text-charcoal truncate max-w-[8rem]" title={boardIdToName.get(member.referredBy) || member.referredBy}>
                                {boardIdToName.get(member.referredBy) || 'Unknown'}
                              </p>
                            ) : (
                              <select
                                defaultValue=""
                                disabled={actionLoading === `${member.id}-referrer`}
                                onChange={(e) => {
                                  if (e.target.value) handleSetReferrer(member, e.target.value)
                                }}
                                className="bg-white border border-ivory-200 rounded px-1 py-0.5 text-[0.7rem] w-full max-w-[8rem] focus:outline-none focus:ring-1 focus:ring-brand/30"
                                title="Set who referred this member"
                              >
                                <option value="">Set…</option>
                                {boardOptions.map((b) => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              </div>
            </>
          )}
        </div>

      {/* Log Manual Payment Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4"
          onClick={() => !paymentSaving && setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-h4 text-brand">Log Offline Payment</h3>
              </div>
              <button onClick={() => !paymentSaving && setShowPaymentModal(false)} className="text-mid hover:text-brand">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-small text-mid mb-6">
              Record a payment made via check, Zelle, cash, or other. The member will be added with status <strong>Approved</strong> and assigned a membership number automatically.
            </p>

            <form onSubmit={handleLogPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Full Name *</label>
                <input name="name" type="text" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Email *</label>
                <input name="email" type="email" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Phone</label>
                <input name="phone" type="tel" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Business Name</label>
                <input name="businessName" type="text" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">City</label>
                <input name="city" type="text" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Industry / Sector</label>
                <input name="sector" type="text" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="e.g. Healthcare" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Membership Tier *</label>
                <select name="membershipTier" required defaultValue="individual" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Payment Method *</label>
                <select name="paymentMethod" required defaultValue="check" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="check">Check</option>
                  <option value="zelle">Zelle</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Amount Paid ($) *</label>
                <input name="amountPaid" type="number" min="1" step="1" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="e.g. 395" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Payment Date</label>
                <input name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Reference (check #, Zelle sender, memo)</label>
                <input name="paymentReference" type="text" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="Check #1234 · Combined check · etc." />
              </div>
              <div className="md:col-span-2">
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Referred By (board member)</label>
                <select name="referredBy" defaultValue="" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="">— None on record —</option>
                  {boardOptions.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <label className="md:col-span-2 flex items-start gap-3 cursor-pointer select-none bg-page-bg border border-ivory-200 rounded-md p-3 mt-1">
                <input type="checkbox" name="sendEmail" defaultChecked className="mt-1 w-4 h-4 accent-accent" />
                <span className="text-small text-charcoal">
                  Send member the approval / membership number email so they can register at /register
                </span>
              </label>

              {paymentError && (
                <div className="md:col-span-2 text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                  {paymentError}
                </div>
              )}

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentSaving}
                  className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-gold-900 transition-all disabled:opacity-50"
                >
                  {paymentSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
