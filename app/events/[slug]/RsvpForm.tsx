'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Loader2, CreditCard, DoorOpen } from 'lucide-react'

const inputClass =
  'w-full bg-white border border-ivory-200 rounded-md px-4 py-3 text-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

const DOOR_SURCHARGE_CENTS = 500

function priceLabel(cents: number | null): string {
  if (cents == null) return ''
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`
}

export default function RsvpForm({ slug, title, priceCents }: { slug: string; title: string; priceCents: number | null }) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [guests, setGuests] = useState(0)
  const isPaid = (priceCents ?? 0) > 0
  const [payMode, setPayMode] = useState<'online' | 'door'>(isPaid ? 'online' : 'online')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement)?.value,
      email: (form.elements.namedItem('email') as HTMLInputElement)?.value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement)?.value,
      guests,
      note: (form.elements.namedItem('note') as HTMLTextAreaElement)?.value,
      payMode: isPaid ? payMode : 'none',
    }

    try {
      const res = await fetch(`/api/events/${slug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const raw = await res.text()
      let body: { error?: string; paymentUrl?: string } = {}
      try { body = raw ? JSON.parse(raw) : {} } catch { /* not JSON */ }
      if (!res.ok) {
        setError(body.error || `Request failed (${res.status}).`)
      } else if (body.paymentUrl) {
        // Hand off to Square. Their hosted page owns the rest of the
        // flow and redirects back to /events/<slug>/paid on success.
        window.location.href = body.paymentUrl
        return
      } else {
        setDone(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-brand">You&apos;re in!</h2>
        <p className="text-mid mt-2">
          Thanks for RSVPing to <span className="text-brand font-medium">{title}</span>. We&apos;ll send you a reminder as the date approaches.
        </p>
      </div>
    )
  }

  const seats = 1 + guests
  const baseCents = priceCents ?? 0
  const perTicket = payMode === 'door' ? baseCents + DOOR_SURCHARGE_CENTS : baseCents
  const totalCents = perTicket * seats

  return (
    <div>
      <h2 className="font-display text-2xl text-brand mb-2 text-center">RSVP</h2>
      <p className="text-mid text-center mb-6">Reserve your spot — we&apos;ll email a confirmation and be in touch closer to the date.</p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="name" required placeholder="Your name *" className={inputClass} />
          <input name="email" type="email" required placeholder="Email *" className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="phone" placeholder="Phone (optional)" className={inputClass} />
          <div className="flex items-center gap-3">
            <label className="text-sm text-mid whitespace-nowrap">Extra guests</label>
            <input
              name="guests"
              type="number"
              min={0}
              max={10}
              value={guests}
              onChange={(e) => setGuests(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
              className={inputClass}
            />
          </div>
        </div>
        <textarea name="note" rows={3} placeholder="Anything we should know? (dietary needs, questions…)" className={inputClass} />

        {isPaid && (
          <div className="space-y-2 pt-2">
            <p className="font-label text-[0.7rem] tracking-widest uppercase text-brand/70">Payment</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMode('online')}
                className={`text-left rounded-md border p-4 transition-all ${
                  payMode === 'online'
                    ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                    : 'border-ivory-200 hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-2 text-brand">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Pay online now</span>
                </div>
                <p className="text-xs text-mid mt-1">
                  {priceLabel(baseCents)} · secure Square checkout · confirmed instantly
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPayMode('door')}
                className={`text-left rounded-md border p-4 transition-all ${
                  payMode === 'door'
                    ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                    : 'border-ivory-200 hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-2 text-brand">
                  <DoorOpen className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Pay at door</span>
                </div>
                <p className="text-xs text-mid mt-1">
                  {priceLabel(baseCents + DOOR_SURCHARGE_CENTS)} · adds a ${(DOOR_SURCHARGE_CENTS / 100).toFixed(0)} at-door convenience
                </p>
              </button>
            </div>

            <div className="bg-page-alt border border-ivory-200 rounded px-4 py-3 text-sm text-brand flex items-center justify-between mt-3">
              <span>
                {priceLabel(perTicket)}
                {seats > 1 ? <> × {seats} seats</> : null}
              </span>
              <span className="font-medium">Total: {priceLabel(totalCents)}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent text-white rounded-md font-label text-sm tracking-label uppercase hover:bg-accent/90 disabled:opacity-50 transition-all"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Sending…' : isPaid && payMode === 'online' ? 'Continue to payment' : 'Confirm RSVP'}
        </button>
      </form>
    </div>
  )
}
