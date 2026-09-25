'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

const inputClass =
  'w-full bg-white border border-ivory-200 rounded-md px-4 py-3 text-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export default function RsvpForm({ slug, title }: { slug: string; title: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement)?.value,
      email: (form.elements.namedItem('email') as HTMLInputElement)?.value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement)?.value,
      guests: Number((form.elements.namedItem('guests') as HTMLInputElement)?.value || 0),
      note: (form.elements.namedItem('note') as HTMLTextAreaElement)?.value,
    }

    try {
      const res = await fetch(`/api/events/${slug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Something went wrong.')
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

  return (
    <div>
      <h2 className="font-display text-2xl text-brand mb-2 text-center">RSVP</h2>
      <p className="text-mid text-center mb-6">Reserve your spot — we&apos;ll be in touch closer to the date.</p>

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
            <input name="guests" type="number" min={0} max={10} defaultValue={0} className={inputClass} />
          </div>
        </div>
        <textarea name="note" rows={3} placeholder="Anything we should know? (dietary needs, questions…)" className={inputClass} />

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent text-white rounded-md font-label text-sm tracking-label uppercase hover:bg-accent/90 disabled:opacity-50 transition-all"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Sending…' : 'Confirm RSVP'}
        </button>
      </form>
    </div>
  )
}
