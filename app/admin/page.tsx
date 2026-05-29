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
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

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
      if (user?.role !== 'admin') {
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
                          {member.status === 'approved' && member.role !== 'admin' && (
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
    </>
  )
}
