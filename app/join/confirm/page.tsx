'use client'

import { Suspense, useState, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { User, Building2 } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export default function ConfirmPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page-bg" />}>
      <ConfirmContent />
    </Suspense>
  )
}

function ConfirmContent() {
  const searchParams = useSearchParams()
  const tierParam = searchParams.get('tier')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tier, setTier] = useState(tierParam === 'corporate' ? 'corporate' : 'individual')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
    const businessName = (form.elements.namedItem('businessName') as HTMLInputElement).value
    const city = (form.elements.namedItem('city') as HTMLInputElement).value
    const sector = (form.elements.namedItem('sector') as HTMLInputElement).value

    try {
      const res = await fetch('/api/join/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, businessName, city, sector, membershipTier: tier }),
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
      <>
        <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
          <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30 corner-bracket corner-bracket-tl" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30 corner-bracket corner-bracket-tr" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30 corner-bracket corner-bracket-bl" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30 corner-bracket corner-bracket-br" />

          <div className="max-w-4xl mx-auto px-8">
            <AnimatedSection>
              <SectionLabel dark>Application Submitted</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <SectionTitle dark className="mt-4">
                Thank You!
              </SectionTitle>
            </AnimatedSection>
            <AnimatedSection delay={2}>
              <Divider className="mx-auto mt-6" />
            </AnimatedSection>
          </div>
        </section>

        <section className="bg-page-bg py-24">
          <div className="max-w-md mx-auto px-8">
            <AnimatedSection>
              <div className="bg-white border border-ivory-200 rounded-xl p-8 shadow-card text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-h3 text-brand mb-3">Application Received</h3>
                <p className="text-body text-mid mb-4">
                  Your membership application is pending admin approval. You&rsquo;ll receive an email with a link to create your member portal account once approved.
                </p>
                <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                  <p className="text-small text-brand/80">
                    Check your inbox for a confirmation email from CVICC.
                  </p>
                </div>
                <Link
                  href="/"
                  className="cta-button-glow inline-block bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm mt-6"
                >
                  Back to Home
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </>
    )
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
            <SectionLabel dark>Post-Payment</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Complete Your Application
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
          <AnimatedSection delay={3}>
            <p className="text-body text-white/55 mt-4">
              After completing your payment on Square, fill out the form below to submit your membership application.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-24">
        <div className="max-w-lg mx-auto px-8">
          <AnimatedSection>
            <div className="bg-white border border-ivory-200 rounded-xl p-8 shadow-card">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-label text-micro tracking-widest uppercase text-brand block mb-3">
                    Membership Tier
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTier('individual')}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        tier === 'individual'
                          ? 'border-accent bg-gold-50'
                          : 'border-ivory-200 hover:border-accent/30'
                      }`}
                    >
                      <User className="w-4 h-4 text-accent" />
                      <span className="font-label text-[0.65rem] tracking-widest uppercase text-brand">Individual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTier('corporate')}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        tier === 'corporate'
                          ? 'border-accent bg-gold-50'
                          : 'border-ivory-200 hover:border-accent/30'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-accent" />
                      <span className="font-label text-[0.65rem] tracking-widest uppercase text-brand">Corporate</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Full Name *
                  </label>
                  <input id="name" name="name" type="text" required className={inputClass} placeholder="Your full name" />
                </div>

                <div>
                  <label htmlFor="email" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Email *
                  </label>
                  <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
                </div>

                <div>
                  <label htmlFor="phone" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Phone
                  </label>
                  <input id="phone" name="phone" type="tel" className={inputClass} placeholder="(555) 123-4567" />
                </div>

                <div>
                  <label htmlFor="businessName" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Business Name
                  </label>
                  <input id="businessName" name="businessName" type="text" className={inputClass} placeholder="Your business" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                      City
                    </label>
                    <input id="city" name="city" type="text" className={inputClass} placeholder="e.g. Fresno" />
                  </div>
                  <div>
                    <label htmlFor="sector" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                      Industry
                    </label>
                    <input id="sector" name="sector" type="text" className={inputClass} placeholder="e.g. Healthcare" />
                  </div>
                </div>

                {error && (
                  <p className="text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="cta-button-glow w-full bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3.5 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
