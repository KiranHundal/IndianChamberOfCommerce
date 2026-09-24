'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  UserPlus,
  Shield,
  Users,
  X,
  Loader2,
  UserX,
  Mail,
  Video,
  FileText,
  Eye,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  membershipNumber: string | null
  status: string
  createdAt: string | number
  approvedAt: string | number | null
}
interface GrantableBoardMember {
  id: string
  name: string
  role: string
  email: string
  photoUrl: string | null
}
interface TeamResponse {
  team: TeamMember[]
  grantable: GrantableBoardMember[]
}

export default function AdminTeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<TeamResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)
  const [manualError, setManualError] = useState('')

  const currentEmail = ((session?.user as { email?: string })?.email || '').toLowerCase()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/team')
      if (res.ok) setData(await res.json())
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
      if (user?.role !== 'admin') {
        router.push('/admin')
        return
      }
      fetchData()
    }
  }, [status, session, router, fetchData])

  async function handleGrantFromBoard(bm: GrantableBoardMember, role: 'admin' | 'moderator' | 'reviewer') {
    setActionId(`grant-${bm.id}`)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/team/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardMemberId: bm.id, role }),
      })
      const body = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: body.error || 'Failed to grant access.' })
      } else {
        await fetchData()
        const emailNote = body.emailStatus === 'failed'
          ? ' (access email FAILED to send — send them the /register link manually)'
          : ' · access email sent'
        setNotice({
          type: 'success',
          text: `${bm.name} now has ${role} access${emailNote}. They set their password at /register using ${bm.email}.`,
        })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setActionId(null)
  }

  async function handleManualGrant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManualSaving(true)
    setManualError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: (fd.get('name') as string).trim(),
      email: (fd.get('email') as string).trim(),
      role: fd.get('role') as string,
    }
    try {
      const res = await fetch('/api/admin/team/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setManualError(body.error || 'Failed to grant access.')
      } else {
        setShowManual(false)
        await fetchData()
        const emailNote = body.emailStatus === 'failed'
          ? ' (access email FAILED to send — send them the /register link manually)'
          : ' · access email sent'
        setNotice({
          type: 'success',
          text: `${payload.name} now has ${payload.role} access${emailNote}. They set their password at /register using ${payload.email}.`,
        })
      }
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Network error.')
    }
    setManualSaving(false)
  }

  async function handleChangeRole(m: TeamMember, role: 'admin' | 'moderator' | 'reviewer') {
    setActionId(`role-${m.id}`)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/team/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const body = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: body.error || 'Failed to change role.' })
      } else {
        await fetchData()
        setNotice({ type: 'success', text: `${m.name} is now ${role}.` })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setActionId(null)
  }

  async function handleRevoke(m: TeamMember) {
    if (!confirm(`Revoke ${m.role} access for ${m.name}?\nTheir member record stays; they just lose the ${m.role} dashboard.`)) return
    setActionId(`revoke-${m.id}`)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/team/${m.id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: body.error || 'Failed to revoke.' })
      } else {
        await fetchData()
        setNotice({ type: 'success', text: `Revoked ${m.role} access for ${m.name}.` })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
    setActionId(null)
  }

  if (status === 'loading' || loading || !data) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
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
            <SectionLabel dark>Admin</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">Team &amp; Content</SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-16">
        <div className="max-w-5xl mx-auto px-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-mid hover:text-brand font-label text-[0.65rem] tracking-widest uppercase transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Admin
            </Link>
            <button
              onClick={() => { setManualError(''); setShowManual(true) }}
              className="inline-flex items-center gap-2 bg-navy-900 text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-gold-400" />
              Grant Access Manually
            </button>
          </div>

          {notice && (
            <div className={`mb-6 border rounded-lg px-4 py-3 text-small flex items-start gap-3 ${
              notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Current Team Accounts */}
          <AnimatedSection>
            <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-accent" />
                <h3 className="font-label text-label tracking-widest uppercase text-brand">
                  Current Team Accounts ({data.team.length})
                </h3>
              </div>
              {data.team.length === 0 ? (
                <p className="text-small text-hint py-4">No team accounts yet.</p>
              ) : (
                <div className="divide-y divide-ivory-200">
                  {data.team.map((m) => {
                    const isSelf = !!currentEmail && m.email.toLowerCase() === currentEmail
                    return (
                      <div key={m.id} className="py-4 flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-display text-h5 text-brand">{m.name}</p>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6rem] font-label tracking-widest uppercase ${
                              m.role === 'admin' ? 'bg-navy-900 text-gold-400' :
                              m.role === 'reviewer' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-accent/10 text-accent border border-accent/30'
                            }`}>
                              <Shield className="w-3 h-3" />
                              {m.role}
                            </span>
                            {isSelf && (
                              <span className="text-[0.6rem] font-label tracking-widest uppercase text-hint">You</span>
                            )}
                          </div>
                          <p className="text-small text-mid mt-1">{m.email}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {m.role !== 'admin' && (
                            <button
                              onClick={() => handleChangeRole(m, 'admin')}
                              disabled={actionId === `role-${m.id}`}
                              title="Promote to Admin"
                              className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:border-accent/40 disabled:opacity-40"
                            >
                              {actionId === `role-${m.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Make Admin'}
                            </button>
                          )}
                          {m.role !== 'moderator' && (
                            <button
                              onClick={() => handleChangeRole(m, 'moderator')}
                              disabled={actionId === `role-${m.id}` || isSelf}
                              title={isSelf ? "You can't demote yourself." : 'Set to Moderator (finance team)'}
                              className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:border-accent/40 disabled:opacity-40"
                            >
                              {actionId === `role-${m.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Make Moderator'}
                            </button>
                          )}
                          {m.role !== 'reviewer' && (
                            <button
                              onClick={() => handleChangeRole(m, 'reviewer')}
                              disabled={actionId === `role-${m.id}` || isSelf}
                              title={isSelf ? "You can't demote yourself." : 'Set to Reviewer (approves/denies members only)'}
                              className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:border-accent/40 disabled:opacity-40"
                            >
                              {actionId === `role-${m.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Make Reviewer'}
                            </button>
                          )}
                          <button
                            onClick={() => handleRevoke(m)}
                            disabled={actionId === `revoke-${m.id}` || isSelf}
                            title={isSelf ? "You can't revoke your own access." : `Revoke ${m.role} access`}
                            className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-600 font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:bg-red-50 disabled:opacity-40"
                          >
                            {actionId === `revoke-${m.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            Revoke
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Grant from Board Members */}
          <AnimatedSection delay={1}>
            <div className="bg-white border border-ivory-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="w-5 h-5 text-accent" />
                <h3 className="font-label text-label tracking-widest uppercase text-brand">
                  Grant Access from Board ({data.grantable.length})
                </h3>
              </div>
              <p className="text-small text-mid mb-4">
                Board members with an email on file who don&rsquo;t yet have a dashboard account. One click creates their member record and gives them the role you pick.
              </p>
              {data.grantable.length === 0 ? (
                <p className="text-small text-hint py-4">
                  Every board member with an email already has team access. Add board members with an email at <Link href="/admin/board-members" className="text-accent hover:underline">Board Members</Link>.
                </p>
              ) : (
                <div className="divide-y divide-ivory-200">
                  {data.grantable.map((bm) => (
                    <div key={bm.id} className="py-4 flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {bm.photoUrl ? (
                          <Image src={bm.photoUrl} alt={bm.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-page-bg flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-hint" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-display text-h5 text-brand truncate">{bm.name}</p>
                          <p className="text-small text-mid truncate">{bm.role} · {bm.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleGrantFromBoard(bm, 'reviewer')}
                          disabled={actionId === `grant-${bm.id}`}
                          className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:border-accent/40 disabled:opacity-40"
                        >
                          {actionId === `grant-${bm.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Grant Reviewer'}
                        </button>
                        <button
                          onClick={() => handleGrantFromBoard(bm, 'moderator')}
                          disabled={actionId === `grant-${bm.id}`}
                          className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:border-accent/40 disabled:opacity-40"
                        >
                          {actionId === `grant-${bm.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Grant Moderator'}
                        </button>
                        <button
                          onClick={() => handleGrantFromBoard(bm, 'admin')}
                          disabled={actionId === `grant-${bm.id}`}
                          className="inline-flex items-center gap-1.5 bg-navy-900 text-white font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:bg-navy-800 disabled:opacity-50"
                        >
                          {actionId === `grant-${bm.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin text-gold-400" />
                          ) : (
                            <Shield className="w-3 h-3 text-gold-400" />
                          )}
                          Grant Admin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Role explainer */}
          <AnimatedSection delay={2}>
            <div className="bg-navy-50 border border-navy-100 rounded-xl p-5 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-brand" />
                <p className="font-label text-[0.65rem] tracking-widest uppercase text-brand">Roles at a glance</p>
                <p className="text-[0.65rem] text-mid ml-2">Use the View As pills at the very top of the page to preview each role.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-small text-brand">
                <div className="bg-white rounded-lg p-4 border border-ivory-200">
                  <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand mb-1"><Shield className="w-3 h-3 inline mr-1 text-gold-400" /> Admin</p>
                  <p className="text-mid">Full access — approve/deny members, log payments, manage finances, board, videos, reports, and grant access.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-ivory-200">
                  <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand mb-1"><Shield className="w-3 h-3 inline mr-1 text-accent" /> Moderator</p>
                  <p className="text-mid">Finance team — see finances, add expenses, log offline payments, sync Square, send invitations. Cannot approve/deny members.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-ivory-200">
                  <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand mb-1"><Shield className="w-3 h-3 inline mr-1 text-emerald-600" /> Reviewer</p>
                  <p className="text-mid">Member gatekeeper — sees the members list, approves or denies pending signups. No finances, board, or reports.</p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Quick links */}
          <AnimatedSection delay={3}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/admin/board-members" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 transition-all">
                <UserPlus className="w-5 h-5 text-accent mb-2" />
                <p className="font-display text-h5 text-brand">Board Members</p>
                <p className="text-[0.7rem] text-mid mt-1">Add, edit, remove board members.</p>
              </Link>
              <Link href="/admin/videos" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 transition-all">
                <Video className="w-5 h-5 text-accent mb-2" />
                <p className="font-display text-h5 text-brand">Leadership Videos</p>
                <p className="text-[0.7rem] text-mid mt-1">Videos on About / Leadership.</p>
              </Link>
              <Link href="/admin/reports" className="bg-white border border-ivory-200 rounded-xl p-5 hover:border-accent/40 transition-all">
                <FileText className="w-5 h-5 text-accent mb-2" />
                <p className="font-display text-h5 text-brand">Reports</p>
                <p className="text-[0.7rem] text-mid mt-1">Treasurer PDF, CSV exports.</p>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Manual Grant Modal */}
      {showManual && (
        <div
          className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4"
          onClick={() => !manualSaving && setShowManual(false)}
        >
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-h4 text-brand">Grant Access Manually</h3>
              </div>
              <button onClick={() => !manualSaving && setShowManual(false)} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-small text-mid mb-4">
              For someone who isn&rsquo;t a board member. If a member with the same email already exists, they&rsquo;ll be promoted to the role.
            </p>
            <form onSubmit={handleManualGrant} className="grid grid-cols-1 gap-4">
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Name *</label>
                <input name="name" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Email *</label>
                <input name="email" type="email" required className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="font-label text-[0.6rem] tracking-widest uppercase text-brand block mb-1">Role *</label>
                <select name="role" required defaultValue="reviewer" className="w-full border border-ivory-200 rounded-md px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="reviewer">Reviewer (approve/deny members only)</option>
                  <option value="moderator">Moderator (finance team)</option>
                  <option value="admin">Admin (full access)</option>
                </select>
              </div>
              {manualError && (
                <div className="text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{manualError}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowManual(false)} disabled={manualSaving} className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={manualSaving} className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-gold-900 disabled:opacity-50">
                  {manualSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : <><Mail className="w-3.5 h-3.5" />Grant Access</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
