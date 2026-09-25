'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Search, ArrowLeft, RotateCcw, User, Users } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'

interface RsvpRow {
  id: string
  name: string
  email: string
  guests: number
  paidAt: string | number | null
  paidAmount: number | null
  attendedAt: string | number | null
  payMode: string | null
}

interface EventRow {
  id: string
  title: string
  startAt: string | number
  location: string | null
  capacity: number | null
}

export default function EventCheckinPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const eventId = params.id
  const scannedCode = searchParams.get('code')

  const [event, setEvent] = useState<EventRow | null>(null)
  const [rsvps, setRsvps] = useState<RsvpRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`)
      const data = await res.json()
      if (res.ok) {
        setEvent(data.event || null)
        setRsvps(data.rsvps || [])
      }
    } catch {}
    setLoading(false)
  }, [eventId])

  const checkIn = useCallback(async (rsvpId: string) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/checkin/${rsvpId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        setFlash({ type: 'error', text: data.error || 'Check-in failed.' })
        return
      }
      if (data.alreadyCheckedIn) {
        setFlash({ type: 'info', text: `${data.name} was already checked in.` })
      } else {
        setFlash({ type: 'success', text: `${data.name} checked in.` })
      }
      setRsvps((prev) => prev.map((r) => r.id === rsvpId ? { ...r, attendedAt: data.attendedAt } : r))
    } catch (e) {
      setFlash({ type: 'error', text: e instanceof Error ? e.message : 'Network error.' })
    }
  }, [eventId])

  async function undoCheckIn(rsvpId: string) {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/checkin/${rsvpId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ undo: true }),
      })
      if (res.ok) {
        setRsvps((prev) => prev.map((r) => r.id === rsvpId ? { ...r, attendedAt: null } : r))
        setFlash({ type: 'info', text: 'Check-in reversed.' })
      }
    } catch {}
  }

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
      load()
    }
  }, [status, session, router, load])

  // If we arrived via a QR scan (?code=...), check in immediately.
  useEffect(() => {
    if (scannedCode && !loading) {
      checkIn(scannedCode).then(() => {
        // Strip the code from the URL so a refresh doesn't re-check-in.
        router.replace(`/admin/events/${eventId}/checkin`)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedCode, loading])

  const filtered = rsvps.filter((r) => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
  })

  const attendedCount = rsvps.filter((r) => r.attendedAt).length
  const totalSeats = rsvps.reduce((s, r) => s + 1 + r.guests, 0)
  const attendedSeats = rsvps.filter((r) => r.attendedAt).reduce((s, r) => s + 1 + r.guests, 0)

  if (loading || status !== 'authenticated') {
    return <AdminShell title="Check-in"><div className="animate-pulse text-mid text-sm">Loading…</div></AdminShell>
  }

  const headerActions = (
    <Link
      href="/admin/events"
      className="inline-flex items-center gap-1.5 text-brand border border-ivory-200 rounded px-3 py-1.5 text-xs hover:border-accent/40"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All events
    </Link>
  )

  return (
    <AdminShell title={event ? `Check-in · ${event.title}` : 'Check-in'} actions={headerActions}>
      {flash && (
        <div className={`mb-4 border rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${
          flash.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : flash.type === 'error' ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-navy-50 border-ivory-200 text-brand'
        }`}>
          <span className="flex-1">{flash.text}</span>
          <button type="button" onClick={() => setFlash(null)} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-ivory-200 rounded-lg p-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-1">Checked in</p>
          <p className="text-2xl font-medium text-brand">{attendedSeats}<span className="text-hint text-sm font-normal"> / {totalSeats}</span></p>
        </div>
        <div className="bg-white border border-ivory-200 rounded-lg p-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-1">RSVPs</p>
          <p className="text-2xl font-medium text-brand">{attendedCount}<span className="text-hint text-sm font-normal"> / {rsvps.length}</span></p>
        </div>
        <div className="bg-white border border-ivory-200 rounded-lg p-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-1">To go</p>
          <p className="text-2xl font-medium text-brand">{Math.max(0, totalSeats - attendedSeats)}</p>
        </div>
      </div>

      <div className="bg-white border border-ivory-200 rounded-lg p-4 mb-4">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-page-bg border border-ivory-200 rounded-md pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            autoFocus
          />
        </label>
        <p className="text-[0.65rem] text-hint mt-2">
          Tip: scan an attendee&apos;s QR code with your phone camera to check them in with one tap. This page is where those scans land.
        </p>
      </div>

      {rsvps.length === 0 ? (
        <div className="bg-white border border-ivory-200 rounded-lg p-10 text-center">
          <User className="w-10 h-10 text-hint mx-auto mb-3" />
          <p className="text-sm text-mid">No RSVPs on this event yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-hint text-center py-6">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="bg-white border border-ivory-200 rounded-lg divide-y divide-ivory-200 overflow-hidden">
          {filtered.map((r) => {
            const attended = !!r.attendedAt
            const seats = 1 + r.guests
            return (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${attended ? 'text-emerald-800' : 'text-brand'}`}>
                    {r.name}
                    {seats > 1 && <span className="ml-2 text-xs text-hint">+{r.guests}</span>}
                  </p>
                  <p className="text-xs text-hint truncate">{r.email}{r.payMode ? ` · ${r.payMode}` : ''}{r.paidAt ? ' · paid' : ''}</p>
                </div>
                {attended ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" /> Checked in
                    </span>
                    <button
                      type="button"
                      onClick={() => undoCheckIn(r.id)}
                      className="text-hint hover:text-red-600 p-1"
                      title="Undo check-in"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => checkIn(r.id)}
                    className="bg-accent text-white text-xs font-medium px-4 py-2 rounded hover:bg-gold-900 flex-shrink-0 inline-flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" /> Check in
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </AdminShell>
  )
}
