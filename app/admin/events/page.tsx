'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar, Plus, Pencil, Trash2, X, Save, Loader2, MapPin,
  Users, Eye, EyeOff, ExternalLink, ImagePlus, DollarSign, CheckCircle2, Circle,
} from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'

interface EventRow {
  id: string
  slug: string
  title: string
  description: string | null
  location: string | null
  address: string | null
  startAt: string | number
  endAt: string | number | null
  coverImageUrl: string | null
  eventType: string
  membersOnly: boolean
  rsvpMode: 'none' | 'external' | 'internal'
  rsvpUrl: string | null
  capacity: number | null
  priceCents: number | null
  notifyEmail: string | null
  published: boolean
  createdAt: string | number
  updatedAt: string | number | null
  summary?: {
    rsvpCount: number
    seats: number
    paid: number
    owedCents: number
    collectedCents: number
  }
}

interface RsvpRow {
  id: string
  eventId: string
  name: string
  email: string
  phone: string | null
  guests: number
  note: string | null
  paidAt: string | number | null
  createdAt: string | number
}


const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-3 py-2 text-sm text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'
const labelClass = 'block text-xs font-medium text-mid mb-1'

const EVENT_TYPES = ['Networking', 'Gala', 'Workshop', 'Seminar', 'Community', 'Fundraiser', 'Other']
const PRICE_PRESETS = [
  { label: 'Free', cents: 0 },
  { label: '$20', cents: 2000 },
  { label: '$40', cents: 4000 },
  { label: '$60', cents: 6000 },
  { label: '$100', cents: 10000 },
]
const NOTIFY_ADDRESSES = [
  { label: 'info@ (default)', value: 'info@indianchamberofcommerce.org' },
  { label: 'sonia@', value: 'sonia@indianchamberofcommerce.org' },
  { label: 'raj@', value: 'raj@indianchamberofcommerce.org' },
]

function money(cents: number | null): string {
  if (cents == null || cents === 0) return 'Free'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateTime(v: string | number | null): string {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function AdminEventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rows, setRows] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [rsvpFor, setRsvpFor] = useState<EventRow | null>(null)
  const [rsvps, setRsvps] = useState<RsvpRow[]>([])
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [rsvpMode, setRsvpMode] = useState<'none' | 'external' | 'internal'>('none')
  const [priceCents, setPriceCents] = useState<number | null>(null)
  const [priceCustom, setPriceCustom] = useState('')
  const [notifyEmail, setNotifyEmail] = useState<string>('info@indianchamberofcommerce.org')

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/events')
      if (res.ok) {
        const data = await res.json()
        setRows(data.events || [])
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
      fetchRows()
    }
  }, [status, session, router, fetchRows])

  function openAdd() {
    setEditing(null)
    setCoverPreview(null)
    setRemoveCover(false)
    setRsvpMode('none')
    setPriceCents(null)
    setPriceCustom('')
    setNotifyEmail('info@indianchamberofcommerce.org')
    setError('')
    setShowForm(true)
  }

  function openEdit(ev: EventRow) {
    setEditing(ev)
    setCoverPreview(ev.coverImageUrl)
    setRemoveCover(false)
    setRsvpMode(ev.rsvpMode)
    setPriceCents(ev.priceCents)
    const matchedPreset = PRICE_PRESETS.some((p) => p.cents === ev.priceCents)
    setPriceCustom(!matchedPreset && ev.priceCents != null ? String((ev.priceCents / 100).toFixed(ev.priceCents % 100 === 0 ? 0 : 2)) : '')
    setNotifyEmail(ev.notifyEmail || 'info@indianchamberofcommerce.org')
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setCoverPreview(null)
    setRemoveCover(false)
    setError('')
    if (coverRef.current) coverRef.current.value = ''
  }

  async function openRsvps(ev: EventRow) {
    setRsvpFor(ev)
    setRsvps([])
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`)
      if (res.ok) {
        const data = await res.json()
        setRsvps(data.rsvps || [])
      }
    } catch {}
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    if (editing && removeCover) formData.set('removeCover', 'true')

    // Price + notify come from React state, not native inputs — inject
    // them into the FormData before it goes to the API. An empty string
    // means "clear", a numeric string means "set to that value".
    if (priceCents == null && !priceCustom.trim()) {
      formData.set('priceCents', '')
    } else if (priceCustom.trim()) {
      const parsed = parseFloat(priceCustom)
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError('Custom price must be a positive number.')
        setSaving(false)
        return
      }
      formData.set('priceCents', String(Math.round(parsed * 100)))
    } else {
      formData.set('priceCents', String(priceCents))
    }
    formData.set('notifyEmail', notifyEmail)

    try {
      const url = editing ? `/api/admin/events/${editing.id}` : '/api/admin/events'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        await fetchRows()
        closeForm()
        setNotice({ type: 'success', text: editing ? 'Event updated.' : 'Event created.' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    }
    setSaving(false)
  }

  async function handleDelete(ev: EventRow) {
    if (!confirm(`Delete "${ev.title}"? This also removes all RSVPs and cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchRows()
        setNotice({ type: 'success', text: 'Event deleted.' })
      } else {
        const data = await res.json().catch(() => ({}))
        setNotice({ type: 'error', text: data.error || 'Delete failed.' })
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Network error.' })
    }
  }

  async function togglePublished(ev: EventRow) {
    const formData = new FormData()
    formData.set('published', String(!ev.published))
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, { method: 'PUT', body: formData })
      if (res.ok) {
        await fetchRows()
        setNotice({ type: 'success', text: !ev.published ? 'Event published.' : 'Event unpublished.' })
      }
    } catch {}
  }

  function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCoverPreview(url)
    setRemoveCover(false)
  }

  if (status === 'loading' || loading) {
    return <AdminShell title="Events"><div className="animate-pulse text-mid text-sm">Loading…</div></AdminShell>
  }

  const now = Date.now()
  const upcoming = rows.filter((r) => new Date(r.startAt).getTime() >= now)
  const past = rows.filter((r) => new Date(r.startAt).getTime() < now)

  const headerActions = (
    <button
      type="button"
      onClick={openAdd}
      className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-gold-900"
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">New event</span>
    </button>
  )

  return (
    <AdminShell title="Events" actions={headerActions}>
      {notice && (
        <div className={`mb-4 border rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${
          notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {rows.length === 0 && (
        <div className="bg-white border border-ivory-200 rounded-lg p-10 text-center">
          <Calendar className="w-10 h-10 text-hint mx-auto mb-3" />
          <p className="text-sm text-mid mb-3">No events yet.</p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-4 py-2 rounded hover:bg-gold-900"
          >
            <Plus className="w-3.5 h-3.5" />
            Create the first event
          </button>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-2">Upcoming · {upcoming.length}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcoming.map((ev) => (
              <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={handleDelete} onToggle={togglePublished} onRsvps={openRsvps} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-2">Past · {past.length}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {past.map((ev) => (
              <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={handleDelete} onToggle={togglePublished} onRsvps={openRsvps} isPast />
            ))}
          </div>
        </section>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-hover w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ivory-200">
              <h2 className="text-sm font-medium text-brand">{editing ? 'Edit event' : 'New event'}</h2>
              <button type="button" onClick={closeForm} className="text-mid hover:text-brand"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{error}</div>}

              <div>
                <label className={labelClass}>Title *</label>
                <input name="title" required defaultValue={editing?.title || ''} className={inputClass} placeholder="Annual Diwali Gala" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start *</label>
                  <input
                    name="startAt"
                    type="datetime-local"
                    required
                    defaultValue={editing ? toLocalInputValue(new Date(editing.startAt)) : ''}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>End (optional)</label>
                  <input
                    name="endAt"
                    type="datetime-local"
                    defaultValue={editing?.endAt ? toLocalInputValue(new Date(editing.endAt)) : ''}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type</label>
                  <select name="eventType" defaultValue={editing?.eventType || 'Networking'} className={inputClass}>
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Location (short)</label>
                  <input name="location" defaultValue={editing?.location || ''} className={inputClass} placeholder="Fresno Convention Center" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Address (optional)</label>
                <input name="address" defaultValue={editing?.address || ''} className={inputClass} placeholder="700 M St, Fresno, CA 93721" />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  rows={5}
                  defaultValue={editing?.description || ''}
                  className={inputClass}
                  placeholder="Tell members what to expect — agenda, speakers, dress code…"
                />
              </div>

              <div>
                <label className={labelClass}>Cover image</label>
                {coverPreview ? (
                  <div className="relative w-full h-40 rounded overflow-hidden border border-ivory-200 mb-2">
                    <Image src={coverPreview} alt="" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null)
                        setRemoveCover(true)
                        if (coverRef.current) coverRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 bg-white/95 text-brand rounded p-1 hover:bg-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-ivory-200 rounded p-6 cursor-pointer hover:border-accent/40 text-sm text-mid">
                    <ImagePlus className="w-4 h-4" />
                    Choose an image (up to 8MB)
                    <input ref={coverRef} type="file" name="cover" accept="image/*" onChange={onCoverChange} className="hidden" />
                  </label>
                )}
                {coverPreview && !removeCover && (
                  <input ref={coverRef} type="file" name="cover" accept="image/*" onChange={onCoverChange} className="text-xs mt-1" />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>RSVP mode</label>
                  <select
                    name="rsvpMode"
                    value={rsvpMode}
                    onChange={(e) => setRsvpMode(e.target.value as 'none' | 'external' | 'internal')}
                    className={inputClass}
                  >
                    <option value="none">Info only</option>
                    <option value="external">External link</option>
                    <option value="internal">Collect on site</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{rsvpMode === 'external' ? 'RSVP URL *' : 'RSVP URL (unused)'}</label>
                  <input
                    name="rsvpUrl"
                    defaultValue={editing?.rsvpUrl || ''}
                    disabled={rsvpMode !== 'external'}
                    className={`${inputClass} disabled:opacity-50`}
                    placeholder="https://eventbrite.com/…"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Ticket price</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((p) => {
                    const active = priceCents === p.cents && !priceCustom.trim()
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => { setPriceCents(p.cents); setPriceCustom('') }}
                        className={`text-xs font-medium px-3 py-1.5 rounded border transition-all ${
                          active
                            ? 'bg-navy-900 text-white border-navy-900'
                            : 'bg-white text-brand border-ivory-200 hover:border-accent/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                  <div className="inline-flex items-center gap-1 border border-ivory-200 rounded overflow-hidden">
                    <span className="px-2 text-xs text-hint bg-page-bg">$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={priceCustom}
                      onChange={(e) => { setPriceCustom(e.target.value); setPriceCents(null) }}
                      className="w-20 text-xs px-1.5 py-1.5 focus:outline-none"
                      placeholder="Custom"
                    />
                  </div>
                </div>
                <p className="text-[0.65rem] text-hint mt-1">
                  Shown on the event page and confirmation email. Leave $0 for free events.
                </p>
              </div>

              {rsvpMode === 'internal' && (
                <div>
                  <label className={labelClass}>Notify on new RSVP</label>
                  <select
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className={inputClass}
                  >
                    {NOTIFY_ADDRESSES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                  <p className="text-[0.65rem] text-hint mt-1">
                    Each RSVP triggers a summary email here. Attendees always get a confirmation at their own address.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className={labelClass}>Capacity (optional)</label>
                  <input
                    name="capacity"
                    type="number"
                    min={1}
                    defaultValue={editing?.capacity ?? ''}
                    className={inputClass}
                    placeholder="Unlimited"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-brand pb-2">
                  <input type="checkbox" name="membersOnly" value="true" defaultChecked={editing?.membersOnly} />
                  Members only
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-brand pb-2">
                  <input type="checkbox" name="published" value="true" defaultChecked={editing ? editing.published : true} />
                  Published
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ivory-200">
                <button type="button" onClick={closeForm} className="text-sm text-mid px-3 py-2 hover:text-brand">Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-medium px-4 py-2 rounded hover:bg-gold-900 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editing ? 'Save changes' : 'Create event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RSVP list modal */}
      {rsvpFor && (
        <RsvpModal
          event={rsvpFor}
          rsvps={rsvps}
          onClose={() => setRsvpFor(null)}
          onTogglePaid={async (r) => {
            const paid = !r.paidAt
            const res = await fetch(`/api/admin/events/${rsvpFor.id}/rsvps/${r.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paid }),
            })
            if (res.ok) {
              setRsvps((prev) => prev.map((x) => x.id === r.id ? { ...x, paidAt: paid ? new Date().toISOString() : null } : x))
              await fetchRows()
            }
          }}
          onRemove={async (r) => {
            if (!confirm(`Remove ${r.name}'s RSVP?`)) return
            const res = await fetch(`/api/admin/events/${rsvpFor.id}/rsvps/${r.id}`, { method: 'DELETE' })
            if (res.ok) {
              setRsvps((prev) => prev.filter((x) => x.id !== r.id))
              await fetchRows()
            }
          }}
        />
      )}
    </AdminShell>
  )
}

function EventCard({ ev, onEdit, onDelete, onToggle, onRsvps, isPast = false }: {
  ev: EventRow
  onEdit: (e: EventRow) => void
  onDelete: (e: EventRow) => void
  onToggle: (e: EventRow) => void
  onRsvps: (e: EventRow) => void
  isPast?: boolean
}) {
  return (
    <div className={`bg-white border border-ivory-200 rounded-lg overflow-hidden ${isPast ? 'opacity-80' : ''}`}>
      <div className="relative h-32 bg-navy-100">
        {ev.coverImageUrl ? (
          <Image src={ev.coverImageUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Calendar className="w-10 h-10 text-brand/30" /></div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {ev.published ? (
            <span className="bg-emerald-600 text-white text-[0.65rem] font-medium px-2 py-0.5 rounded inline-flex items-center gap-1"><Eye className="w-3 h-3" />Live</span>
          ) : (
            <span className="bg-mid text-white text-[0.65rem] font-medium px-2 py-0.5 rounded inline-flex items-center gap-1"><EyeOff className="w-3 h-3" />Draft</span>
          )}
          {ev.membersOnly && (
            <span className="bg-navy-900 text-gold-400 text-[0.65rem] font-medium px-2 py-0.5 rounded">Members</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid">{formatDateTime(ev.startAt)}</p>
        <h3 className="text-sm font-medium text-brand mt-1">{ev.title}</h3>
        {ev.location && (
          <p className="text-xs text-hint mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-mid flex-wrap">
          <span className="inline-flex items-center gap-1 text-brand">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span className="font-medium">{money(ev.priceCents)}</span>
          </span>
          {ev.rsvpMode === 'internal' && ev.summary && (
            <>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="text-brand font-medium">{ev.summary.rsvpCount}</span> confirmed
                {ev.summary.seats > ev.summary.rsvpCount ? ` · ${ev.summary.seats} seats` : ''}
                {ev.capacity ? <span className="text-hint"> / {ev.capacity}</span> : ''}
              </span>
              {(ev.priceCents || 0) > 0 && ev.summary.owedCents > 0 && (
                <span className="text-hint">
                  {money(ev.summary.collectedCents)}<span className="opacity-60"> / {money(ev.summary.owedCents)}</span>
                </span>
              )}
            </>
          )}
          {ev.rsvpMode === 'external' && (
            <span className="text-hint">External RSVP</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <button type="button" onClick={() => onEdit(ev)} className="text-xs text-brand hover:text-accent inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-page-bg"><Pencil className="w-3 h-3" />Edit</button>
          <button type="button" onClick={() => onToggle(ev)} className="text-xs text-brand hover:text-accent inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-page-bg">
            {ev.published ? <><EyeOff className="w-3 h-3" />Unpublish</> : <><Eye className="w-3 h-3" />Publish</>}
          </button>
          {ev.rsvpMode === 'internal' && (
            <button type="button" onClick={() => onRsvps(ev)} className="text-xs text-brand hover:text-accent inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-page-bg"><Users className="w-3 h-3" />RSVPs</button>
          )}
          {ev.published && (
            <Link href={`/events/${ev.slug}`} target="_blank" className="text-xs text-brand hover:text-accent inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-page-bg"><ExternalLink className="w-3 h-3" />View</Link>
          )}
          <button type="button" onClick={() => onDelete(ev)} className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 ml-auto"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  )
}

function RsvpModal({ event, rsvps, onClose, onTogglePaid, onRemove }: {
  event: EventRow
  rsvps: RsvpRow[]
  onClose: () => void
  onTogglePaid: (r: RsvpRow) => void
  onRemove: (r: RsvpRow) => void
}) {
  const totalSeats = rsvps.reduce((s, r) => s + 1 + r.guests, 0)
  const paidSeats = rsvps.filter((r) => r.paidAt).reduce((s, r) => s + 1 + r.guests, 0)
  const price = event.priceCents || 0
  const collected = paidSeats * price
  const owed = totalSeats * price

  function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Phone', 'Seats', 'Paid', 'RSVP Date', 'Note'],
      ...rsvps.map((r) => [
        r.name,
        r.email,
        r.phone || '',
        String(1 + r.guests),
        r.paidAt ? 'Yes' : 'No',
        new Date(r.createdAt).toLocaleString(),
        r.note || '',
      ]),
    ]
    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.slug}-rsvps.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-hover w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-ivory-200">
          <div>
            <h2 className="text-sm font-medium text-brand">RSVPs · {event.title}</h2>
            <p className="text-xs text-hint">
              {rsvps.length} confirmed · {totalSeats} seats{event.capacity ? ` / ${event.capacity}` : ''}
              {price > 0 ? <> · <span className="text-brand font-medium">{money(collected)}</span> collected / {money(owed)} owed</> : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {rsvps.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="text-xs text-brand border border-ivory-200 rounded px-2 py-1 hover:border-accent/40"
              >
                Export CSV
              </button>
            )}
            <button type="button" onClick={onClose} className="text-mid hover:text-brand"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-5">
          {event.rsvpMode !== 'internal' && (
            <div className="bg-page-bg border border-ivory-200 rounded p-3 text-xs text-mid mb-3">
              This event uses {event.rsvpMode === 'external' ? 'an external RSVP link' : 'no RSVP flow'}. Switch it to &ldquo;Collect on site&rdquo; to gather responses here.
            </div>
          )}
          {rsvps.length === 0 ? (
            <p className="text-sm text-hint py-6 text-center">No RSVPs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[0.65rem] font-medium uppercase tracking-wide text-hint border-b border-ivory-200">
                  <tr>
                    <th className="text-left py-2 pr-3">Attendee</th>
                    <th className="text-right py-2 pr-3">Seats</th>
                    <th className="text-left py-2 pr-3">Note</th>
                    <th className="text-left py-2 pr-3">Confirmed</th>
                    {price > 0 && <th className="text-center py-2 pr-3">Paid</th>}
                    <th className="w-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">
                  {rsvps.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3">
                        <div className="text-brand">{r.name}</div>
                        <div className="text-xs text-hint">
                          <a href={`mailto:${r.email}`} className="hover:text-accent">{r.email}</a>
                          {r.phone ? ` · ${r.phone}` : ''}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-right text-brand">{1 + r.guests}</td>
                      <td className="py-2 pr-3 text-mid truncate max-w-[180px]" title={r.note || ''}>{r.note || '—'}</td>
                      <td className="py-2 pr-3 text-xs text-hint">{new Date(r.createdAt).toLocaleDateString()}</td>
                      {price > 0 && (
                        <td className="py-2 pr-3 text-center">
                          <button
                            type="button"
                            onClick={() => onTogglePaid(r)}
                            title={r.paidAt ? 'Mark unpaid' : 'Mark paid'}
                            className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                              r.paidAt ? 'text-emerald-700 hover:bg-emerald-50' : 'text-hint hover:bg-page-bg'
                            }`}
                          >
                            {r.paidAt ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          </button>
                        </td>
                      )}
                      <td className="py-2 pl-1">
                        <button
                          type="button"
                          onClick={() => onRemove(r)}
                          className="text-hint hover:text-red-600"
                          title="Remove RSVP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
