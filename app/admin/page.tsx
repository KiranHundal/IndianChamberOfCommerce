'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Shield,
  CheckCircle,
  XCircle,
  UserX,
  Users,
  RefreshCw,
  Search,
  Video,
  UserPlus,
  DollarSign,
  X,
  Loader2,
  CreditCard,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

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
  const isAdmin = (session?.user as Record<string, unknown> | undefined)?.role === 'admin'
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      if (user?.role !== 'admin' && user?.role !== 'moderator') {
        router.push('/portal')
        return
      }
      fetchMembers()
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  const filteredMembers = members.filter((m) => {
    if (filter !== 'all' && m.status !== filter) return false
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

  const counts = {
    all: members.length,
    pending: members.filter((m) => m.status === 'pending').length,
    approved: members.filter((m) => m.status === 'approved').length,
    rejected: members.filter((m) => m.status === 'rejected').length,
    deactivated: members.filter((m) => m.status === 'deactivated').length,
  }

  return (
    <>
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30 corner-bracket corner-bracket-tl" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30 corner-bracket corner-bracket-tr" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30 corner-bracket corner-bracket-bl" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30 corner-bracket corner-bracket-br" />

        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>Admin</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Member Management
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-16">
        <div className="max-w-6xl mx-auto px-8">
          {/* Quick Links (admin-only) */}
          {isAdmin && (
            <AnimatedSection>
              <div className="mb-10 flex flex-wrap gap-3">
                <Link
                  href="/admin/videos"
                  className="inline-flex items-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:border-accent/40 hover:shadow-hover transition-all"
                >
                  <Video className="w-3.5 h-3.5 text-accent" />
                  Manage Leadership Videos
                </Link>
                <Link
                  href="/admin/board-members"
                  className="inline-flex items-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:border-accent/40 hover:shadow-hover transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-accent" />
                  Manage Board Members
                </Link>
                <Link
                  href="/admin/finances"
                  className="inline-flex items-center gap-2 bg-navy-900 text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-all"
                >
                  <DollarSign className="w-3.5 h-3.5 text-gold-400" />
                  Executive Dashboard
                </Link>
              </div>
            </AnimatedSection>
          )}

          {/* Log Manual Payment (admin + moderator) */}
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setPaymentError('')
                setShowPaymentModal(true)
              }}
              className="inline-flex items-center gap-2 bg-accent text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-gold-900 transition-all"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Log Offline Payment
            </button>
          </div>

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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {(['all', 'pending', 'approved', 'rejected', 'deactivated'] as const).map((key) => (
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
                    {key === 'all' ? 'Total' : key}
                  </p>
                </button>
              ))}
            </div>
          </AnimatedSection>

          {/* Search & Refresh */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, business..."
                className="w-full bg-white border border-ivory-200 rounded-lg pl-10 pr-4 py-2.5 text-small text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
            </div>
            <button
              onClick={fetchMembers}
              className="flex items-center gap-2 text-mid font-label text-[0.65rem] tracking-widest uppercase hover:text-brand transition-colors"
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

          {/* Members List */}
          {filteredMembers.length === 0 ? (
            <AnimatedSection>
              <div className="bg-white border border-ivory-200 rounded-xl p-12 text-center">
                <Users className="w-10 h-10 text-hint mx-auto mb-4" />
                <p className="text-body text-mid">No members found.</p>
              </div>
            </AnimatedSection>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member, i) => {
                const badge = statusBadge[member.status] || statusBadge.pending
                return (
                  <AnimatedSection key={member.id} delay={i < 10 ? i : 0}>
                    <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-6 relative">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-display text-h4 text-brand">{member.name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[0.6rem] font-label tracking-widest uppercase ${badge.bg} ${badge.color}`}>
                              {badge.label}
                            </span>
                            {member.role === 'admin' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-navy-900 text-gold-400 text-[0.6rem] font-label tracking-widest uppercase">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-small text-mid">
                            <span>{member.email}</span>
                            {member.phone && <span>{member.phone}</span>}
                            {member.businessName && <span>{member.businessName}</span>}
                            {member.city && <span>{member.city}</span>}
                            {member.sector && <span>{member.sector}</span>}
                          </div>
                          <div className="mt-1 text-[0.7rem] text-hint">
                            {member.membershipNumber && (
                              <span className="font-medium text-brand">#{member.membershipNumber}</span>
                            )}
                            {member.membershipNumber && <> &middot; </>}
                            <span className="capitalize">{member.membershipTier}</span> membership
                            {member.createdAt && (
                              <> &middot; Joined {new Date(member.createdAt).toLocaleDateString()}</>
                            )}
                          </div>
                          {(() => {
                            const isStaff = member.role === 'admin' || member.role === 'moderator'
                            if (isStaff) return null
                            const explicit = member.amountPaid && member.amountPaid > 0
                            const isApproved = member.status === 'approved'
                            if (!explicit && !isApproved) return null
                            const amount = explicit
                              ? member.amountPaid!
                              : member.membershipTier === 'corporate' ? 395 : 95
                            const method = member.paymentMethod || 'square'
                            return (
                              <div className="mt-2 inline-flex items-center gap-1.5 text-[0.65rem] px-2 py-0.5 rounded-full bg-navy-50 border border-navy-100 text-brand">
                                <CreditCard className="w-3 h-3" />
                                <span className="font-semibold">${amount}</span>
                                <span>· </span>
                                <span className="capitalize">{method}</span>
                                {!explicit && <span className="text-hint">· est.</span>}
                                {member.paymentReference && <> · {member.paymentReference}</>}
                              </div>
                            )
                          })()}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          {member.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(member.id, 'approve')}
                                disabled={actionLoading === `${member.id}-approve`}
                                className="flex items-center gap-1.5 bg-emerald-600 text-white font-label text-[0.6rem] tracking-widest uppercase px-4 py-2 rounded-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {actionLoading === `${member.id}-approve` ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleAction(member.id, 'reject')}
                                disabled={actionLoading === `${member.id}-reject`}
                                className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 font-label text-[0.6rem] tracking-widest uppercase px-4 py-2 rounded-sm hover:bg-red-50 transition-all disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {actionLoading === `${member.id}-reject` ? '...' : 'Reject'}
                              </button>
                            </>
                          )}
                          {isAdmin && member.status === 'approved' && member.role !== 'admin' && (
                            <button
                              onClick={() => handleAction(member.id, 'deactivate')}
                              disabled={actionLoading === `${member.id}-deactivate`}
                              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 font-label text-[0.6rem] tracking-widest uppercase px-4 py-2 rounded-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              {actionLoading === `${member.id}-deactivate` ? '...' : 'Deactivate'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="gold-accent-line" />
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>
          )}
        </div>
      </section>

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
    </>
  )
}
