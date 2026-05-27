'use client'

import { useState, FormEvent } from 'react'

const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export default function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value.trim()
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value.trim()
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.trim()
    const subject = (form.elements.namedItem('subject') as HTMLSelectElement).value
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim()

    if (!firstName || !lastName || !email || !subject || !message) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, subject, message }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-ivory-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-h3 text-brand mb-3">Message Sent!</h3>
        <p className="text-body text-mid">
          Thank you for reaching out. We&rsquo;ll get back to you within 1&ndash;2 business days.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-ivory-200 rounded-lg p-8">
      <h3 className="font-display text-h3 text-brand mb-6">Send a Message</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="firstName" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
              First Name *
            </label>
            <input id="firstName" name="firstName" type="text" required className={inputClass} placeholder="Your first name" />
          </div>
          <div>
            <label htmlFor="lastName" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
              Last Name *
            </label>
            <input id="lastName" name="lastName" type="text" required className={inputClass} placeholder="Your last name" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
            Email *
          </label>
          <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="phone" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
            Phone (optional)
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} placeholder="(510) 453-1248" />
        </div>
        <div>
          <label htmlFor="subject" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
            Subject *
          </label>
          <select id="subject" name="subject" required className={inputClass}>
            <option value="">Select a topic</option>
            <option value="membership">Membership Inquiry</option>
            <option value="events">Events &amp; Programs</option>
            <option value="partnership">Partnership Opportunity</option>
            <option value="mentorship">Mentorship Program</option>
            <option value="media">Media &amp; Press</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="message" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
            Message *
          </label>
          <textarea id="message" name="message" rows={5} required className={inputClass + ' resize-none'} placeholder="How can we help you?" />
        </div>

        {error && (
          <p className="text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm hover:bg-gold-900 transition-all shadow-card hover:shadow-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
