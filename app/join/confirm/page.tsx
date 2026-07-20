'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import Divider from '@/components/ui/Divider'

type Status = 'loading' | 'success' | 'error' | 'no-data'

export default function ConfirmPaymentPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('cvicc_pending_application')
    if (!raw) {
      setStatus('no-data')
      const t = setTimeout(() => router.push('/join'), 4000)
      return () => clearTimeout(t)
    }

    let payload: unknown
    try {
      payload = JSON.parse(raw)
    } catch {
      setStatus('no-data')
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/join/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          setErrorMessage(data.error || 'We could not finalize your application. Please contact us.')
          setStatus('error')
          return
        }
        sessionStorage.removeItem('cvicc_pending_application')
        setStatus('success')
      } catch {
        setErrorMessage('Network error while finalizing your application. Please contact us.')
        setStatus('error')
      }
    })()
  }, [router])

  return (
    <>
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />
        <div className="max-w-4xl mx-auto px-8">
          <SectionLabel dark>
            {status === 'success' ? 'Welcome to CVICC' : status === 'error' ? 'Something Went Wrong' : 'Payment Confirmation'}
          </SectionLabel>
          <h1 className="font-display text-hero-sm md:text-hero-md font-light text-white mt-6">
            {status === 'success' ? 'Thank You!' : status === 'error' ? 'Almost There' : 'Finalizing...'}
          </h1>
          <Divider className="mx-auto mt-8" />
        </div>
      </section>

      <section className="bg-page-bg py-24">
        <div className="max-w-md mx-auto px-8 text-center">
          <div className="bg-white border border-ivory-200 rounded-xl p-8 shadow-card">
            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="font-display text-h3 text-brand mb-3">Finalizing Your Application</h3>
                <p className="text-body text-mid">
                  We&rsquo;re confirming your payment and setting up your membership. This will only take a moment.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-display text-h3 text-brand mb-3">Application Complete!</h3>
                <p className="text-body text-mid mb-6">
                  Your payment was successful and your membership application has been submitted.
                  You&rsquo;ll receive a confirmation email shortly, and our team will review your application within 1&ndash;2 business days.
                </p>
                <Link
                  href="/"
                  className="cta-button-glow inline-flex items-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm"
                >
                  Back to Home
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-display text-h3 text-brand mb-3">Your Payment Went Through</h3>
                <p className="text-body text-mid mb-4">
                  {errorMessage}
                </p>
                <p className="text-small text-mid mb-6">
                  Don&rsquo;t worry &mdash; your payment is safe. Please reach out and we&rsquo;ll finish setting up your membership by hand.
                </p>
                <Link
                  href="/contact"
                  className="cta-button-glow inline-flex items-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm"
                >
                  Contact Us
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </>
            )}

            {status === 'no-data' && (
              <>
                <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-display text-h3 text-brand mb-3">No Pending Application</h3>
                <p className="text-body text-mid mb-6">
                  We couldn&rsquo;t find a pending application to confirm. Redirecting you to the membership page...
                </p>
                <Link
                  href="/join"
                  className="cta-button-glow inline-flex items-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm"
                >
                  Go to Membership
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
