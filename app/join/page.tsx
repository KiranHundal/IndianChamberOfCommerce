'use client'

import { useState, useRef, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Users,
  Megaphone,
  CalendarCheck,
  Handshake,
  Network,
  CheckCircle,
  User,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

const whyJoin = [
  { icon: Users, text: 'Build powerful business connections' },
  { icon: Megaphone, text: 'Promote your business in the community' },
  { icon: CalendarCheck, text: 'Access exclusive networking events' },
  { icon: Handshake, text: 'Collaborate with entrepreneurs & professionals' },
  { icon: Network, text: 'Be part of a growing Indian business network' },
]

const SQUARE_LINKS: Record<string, string> = {
  individual: 'https://square.link/u/Av93qe4Z',
  corporate: 'https://square.link/u/9opDARDg',
}

const tiers = [
  {
    id: 'individual',
    name: 'Individual Membership',
    icon: User,
    originalPrice: 195,
    salePrice: 95,
    period: '/year',
    features: [
      'Business directory listing',
      'Access to all networking events',
      'Mentorship program eligibility',
      'Monthly newsletter & updates',
      'Voting rights at general meetings',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Membership',
    icon: Building2,
    originalPrice: 495,
    salePrice: 395,
    period: '/year',
    popular: true,
    features: [
      'Everything in Individual, plus:',
      'Featured directory placement',
      'Logo on partners page',
      'Priority event sponsorship access',
      'Up to 5 employee profiles',
      'Social media promotion',
    ],
  },
]

const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export default function JoinPage() {
  const { data: session } = useSession()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  function selectTierAndScroll(tierId: string) {
    setSelectedTier(tierId)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedTier) return
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
      const check = await fetch('/api/join/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const checkData = await check.json()
      if (!check.ok) {
        setError(checkData.error || 'Something went wrong.')
        setLoading(false)
        return
      }
      if (checkData.exists) {
        setError('An application with this email already exists. Please use a different email or sign in.')
        setLoading(false)
        return
      }

      sessionStorage.setItem(
        'cvicc_pending_application',
        JSON.stringify({
          name,
          email,
          phone,
          businessName,
          city,
          sector,
          membershipTier: selectedTier,
        })
      )

      window.location.href = SQUARE_LINKS[selectedTier]
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (session) {
    return (
      <>
        <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
          <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />
          <div className="max-w-4xl mx-auto px-8">
            <SectionLabel dark>Membership</SectionLabel>
            <h1 className="font-display text-hero-sm md:text-hero-md font-light text-white mt-6">
              You&rsquo;re Already a Member
            </h1>
            <Divider className="mx-auto mt-8" />
          </div>
        </section>
        <section className="bg-page-bg py-24">
          <div className="max-w-md mx-auto px-8 text-center">
            <div className="bg-white border border-ivory-200 rounded-xl p-8 shadow-card">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-display text-h3 text-brand mb-3">Welcome Back!</h3>
              <p className="text-body text-mid mb-6">
                You&rsquo;re already a CVICC member. Visit your portal to manage your membership, update your profile, and access member benefits.
              </p>
              <Link
                href="/portal"
                className="cta-button-glow inline-flex items-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm"
              >
                Go to Portal
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="max-w-4xl mx-auto px-8">
          <SectionLabel dark>Membership</SectionLabel>
          <h1 className="font-display text-hero-sm md:text-hero-md font-light text-white mt-6">
            Together, We{' '}
            <em className="italic text-gold-600">Connect. Empower. Grow.</em>
          </h1>
          <Divider className="mx-auto mt-8" />
          <p className="text-body text-white/55 mt-6 max-w-xl mx-auto">
            Building a stronger Indian business community in the Central Valley.
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="bg-page-bg py-20">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center">
            <AnimatedSection>
              <SectionLabel>Benefits</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <SectionTitle className="mt-4">Why Join CVICC?</SectionTitle>
            </AnimatedSection>
            <AnimatedSection delay={2}>
              <Divider className="mx-auto mt-6" />
            </AnimatedSection>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {whyJoin.map((item, i) => {
              const Icon = item.icon
              return (
                <AnimatedSection key={item.text} delay={i + 3}>
                  <div className="leadership-card flex items-start gap-4 bg-white border border-ivory-200 rounded-xl p-5 h-full relative">
                    <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-accent flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-body text-charcoal leading-snug">{item.text}</p>
                    <div className="gold-accent-line" />
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section id="pricing" className="bg-page-alt py-24 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center">
            <AnimatedSection>
              <SectionLabel>Pricing</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <SectionTitle className="mt-4">Membership Options</SectionTitle>
            </AnimatedSection>
            <AnimatedSection delay={2}>
              <Divider className="mx-auto mt-6" />
            </AnimatedSection>
          </div>

          {/* Limited Time Banner */}
          <AnimatedSection delay={3}>
          <div className="mt-10 bg-navy-900 rounded-lg p-5 text-center flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5 text-gold-400" />
            <p className="font-label text-label tracking-label uppercase text-white">
              Limited-Time Offer — Save <span className="text-gold-400">$100</span> on Annual Membership
            </p>
            <Sparkles className="w-5 h-5 text-gold-400" />
          </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            {tiers.map((tier, i) => {
              const Icon = tier.icon
              const isSelected = selectedTier === tier.id
              return (
                <AnimatedSection key={tier.id} delay={i + 4} className="h-full">
                <div
                  className={`leadership-card relative bg-white border-2 rounded-xl overflow-hidden transition-all cursor-pointer h-full flex flex-col ${
                    isSelected
                      ? 'border-accent shadow-hover ring-2 ring-accent/20'
                      : 'border-ivory-200 hover:border-accent/40 hover:shadow-hover'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute top-0 right-0 bg-accent text-white font-label text-[0.6rem] tracking-widest uppercase px-4 py-1.5 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-brand">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-label text-label tracking-label uppercase text-brand">
                        {tier.name}
                      </h3>
                    </div>

                    {/* Pricing */}
                    <div className="mt-6 flex items-baseline gap-3">
                      <span className="font-display text-display font-light text-brand">
                        ${tier.salePrice}
                      </span>
                      <span className="font-body text-body text-hint line-through">
                        ${tier.originalPrice}
                      </span>
                      <span className="font-body text-small text-mid">{tier.period}</span>
                    </div>

                    <div className="inline-block mt-2 bg-gold-100 text-accent font-label text-[0.625rem] tracking-widest uppercase px-3 py-1 rounded-full">
                      Limited Time Offer
                    </div>

                    {/* Features */}
                    <ul className="mt-6 space-y-3 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-small text-mid">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Select button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        selectTierAndScroll(tier.id)
                      }}
                      className="block w-full mt-8 text-center font-label text-label tracking-label uppercase px-6 py-3.5 rounded-sm transition-all bg-accent text-white hover:bg-gold-900 shadow-card hover:shadow-hover"
                    >
                      Join Now — ${tier.salePrice}/year
                    </button>
                  </div>
                </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section ref={formRef} className="bg-page-bg py-24">
        <div className="max-w-lg mx-auto px-8">
          <div className="text-center mb-10">
            <AnimatedSection>
              <SectionLabel>Apply</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <SectionTitle className="mt-4">Membership Application</SectionTitle>
            </AnimatedSection>
            <AnimatedSection delay={2}>
              <Divider className="mx-auto mt-6" />
            </AnimatedSection>
            <AnimatedSection delay={3}>
              <p className="text-body text-mid mt-4 max-w-md mx-auto">
                Fill out the form below and you&rsquo;ll be directed to complete your payment through Square.
              </p>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={4}>
            <div className="bg-white border border-ivory-200 rounded-xl p-8 shadow-card">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tier selector */}
                <div>
                  <label className="font-label text-micro tracking-widest uppercase text-brand block mb-3">
                    Membership Tier *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTier('individual')}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        selectedTier === 'individual'
                          ? 'border-accent bg-gold-50'
                          : 'border-ivory-200 hover:border-accent/30'
                      }`}
                    >
                      <User className="w-4 h-4 text-accent" />
                      <span className="font-label text-[0.65rem] tracking-widest uppercase text-brand">Individual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('corporate')}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        selectedTier === 'corporate'
                          ? 'border-accent bg-gold-50'
                          : 'border-ivory-200 hover:border-accent/30'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-accent" />
                      <span className="font-label text-[0.65rem] tracking-widest uppercase text-brand">Corporate</span>
                    </button>
                  </div>
                  {!selectedTier && (
                    <p className="text-[0.75rem] text-hint mt-2">Please select a membership tier above or from the pricing cards.</p>
                  )}
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
                  disabled={loading || !selectedTier}
                  className="group w-full flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3.5 rounded-sm transition-all hover:bg-gold-900 shadow-card hover:shadow-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    'Preparing checkout...'
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
                    </>
                  )}
                </button>

                <p className="text-[0.75rem] text-hint text-center">
                  You&rsquo;ll complete your{' '}
                  {selectedTier ? (
                    <span className="text-brand font-medium">
                      ${selectedTier === 'corporate' ? '395' : '95'}/year
                    </span>
                  ) : (
                    'membership'
                  )}{' '}
                  payment securely through Square. Your application is submitted once payment completes.
                </p>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-navy-900 py-20 relative overflow-hidden">
        <div className="absolute top-6 right-6 w-16 h-16 border-t border-r border-gold-600/25" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l border-gold-600/25" />

        <div className="max-w-3xl mx-auto px-8 text-center">
          <SectionLabel dark>Questions?</SectionLabel>
          <h2 className="font-display text-h2 text-white mt-4">
            Need help choosing a plan?
          </h2>
          <p className="text-body text-white/55 mt-4 max-w-xl mx-auto">
            Contact our Chairwoman for any questions about membership benefits,
            eligibility, or the application process.
          </p>
          <p className="font-display text-h4 text-gold-400 mt-6">Sonia Heer</p>
          <a
            href="tel:5104531248"
            className="inline-flex items-center gap-2 text-white font-label text-label tracking-label uppercase mt-2 hover:text-gold-400 transition-colors"
          >
            (510) 453-1248
          </a>
        </div>
      </section>
    </>
  )
}
