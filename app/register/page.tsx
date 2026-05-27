'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const membershipNumber = (form.elements.namedItem('membershipNumber') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipNumber, password }),
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
              <SectionLabel dark>Account Created</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <SectionTitle dark className="mt-4">
                Welcome to CVICC
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
                <h3 className="font-display text-h3 text-brand mb-3">Account Created!</h3>
                <p className="text-body text-mid mb-6">
                  Your account is ready. Sign in to access your member portal, view your membership details, and explore member benefits.
                </p>
                <Link
                  href="/login"
                  className="cta-button-glow inline-block bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm"
                >
                  Sign In
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
            <SectionLabel dark>Member Portal</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Create Your Account
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
          <AnimatedSection delay={3}>
            <p className="text-body text-white/55 mt-4">
              Enter your membership number from your approval email to set up your account.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-24">
        <div className="max-w-md mx-auto px-8">
          <AnimatedSection>
            <div className="bg-white border border-ivory-200 rounded-xl p-8 shadow-card">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="membershipNumber" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Membership Number *
                  </label>
                  <input
                    id="membershipNumber"
                    name="membershipNumber"
                    type="text"
                    required
                    className={inputClass + ' text-center text-h3 font-display tracking-widest'}
                    placeholder="0001"
                    maxLength={4}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Password *
                  </label>
                  <input id="password" name="password" type="password" required className={inputClass} placeholder="Min 6 characters" />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Confirm Password *
                  </label>
                  <input id="confirmPassword" name="confirmPassword" type="password" required className={inputClass} placeholder="Repeat password" />
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
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-small text-mid">
                  Don&rsquo;t have a membership number?{' '}
                  <Link href="/join" className="text-accent hover:text-gold-900 transition-colors font-medium">
                    Join CVICC
                  </Link>
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
