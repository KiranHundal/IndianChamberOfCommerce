'use client'

import { useState, FormEvent } from 'react'
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
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'

const whyJoin = [
  { icon: Users, text: 'Build powerful business connections' },
  { icon: Megaphone, text: 'Promote your business in the community' },
  { icon: CalendarCheck, text: 'Access exclusive networking events' },
  { icon: Handshake, text: 'Collaborate with entrepreneurs & professionals' },
  { icon: Network, text: 'Be part of a growing Indian business network' },
]

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
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('fullName') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('applyEmail') as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem('applyPhone') as HTMLInputElement).value.trim(),
      city: (form.elements.namedItem('city') as HTMLSelectElement).value,
      businessName: (form.elements.namedItem('businessName') as HTMLInputElement).value.trim(),
      sector: (form.elements.namedItem('sector') as HTMLSelectElement).value,
      about: (form.elements.namedItem('about') as HTMLTextAreaElement).value.trim(),
      membershipTier: selectedTier || 'individual',
    }

    if (!data.name || !data.email || !data.businessName) {
      setStatus('error')
      setErrorMsg('Please fill in your name, email, and business name.')
      return
    }

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(result.error || 'Something went wrong.')
        return
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
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
            <SectionLabel>Benefits</SectionLabel>
            <SectionTitle className="mt-4">Why Join CVICC?</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {whyJoin.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.text}
                  className="flex items-start gap-4 bg-white border border-ivory-200 rounded-lg p-5 shadow-card"
                >
                  <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-accent flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-body text-charcoal leading-snug">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="bg-page-alt py-24">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Pricing</SectionLabel>
            <SectionTitle className="mt-4">Membership Options</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          {/* Limited Time Banner */}
          <div className="mt-10 bg-navy-900 rounded-lg p-5 text-center flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5 text-gold-400" />
            <p className="font-label text-label tracking-label uppercase text-white">
              Limited-Time Offer — Save <span className="text-gold-400">$100</span> on Annual Membership
            </p>
            <Sparkles className="w-5 h-5 text-gold-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            {tiers.map((tier) => {
              const Icon = tier.icon
              const isSelected = selectedTier === tier.id
              return (
                <div
                  key={tier.id}
                  className={`relative bg-white border-2 rounded-xl overflow-hidden shadow-card transition-all cursor-pointer ${
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

                  <div className="p-8">
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
                    <ul className="mt-6 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-small text-mid">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Select button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTier(tier.id)
                        document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className={`w-full mt-8 font-label text-label tracking-label uppercase px-6 py-3.5 rounded-sm transition-all ${
                        isSelected
                          ? 'bg-accent text-white shadow-card'
                          : 'bg-navy-900 text-white hover:bg-navy-800'
                      }`}
                    >
                      {isSelected ? 'Selected — Apply Below' : `Choose ${tier.name.split(' ')[0]}`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Get Started</SectionLabel>
            <SectionTitle className="mt-4">Join Today & Make an Impact</SectionTitle>
            <Divider className="mx-auto mt-6" />
            <p className="text-body text-mid mt-4 max-w-xl mx-auto">
              Your membership helps strengthen our community and creates opportunities for all.
              Together, we build a stronger tomorrow.
            </p>
          </div>

          <div className="mt-12 max-w-2xl mx-auto bg-white border border-ivory-200 rounded-lg p-8">
            {status === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-accent mx-auto" />
                <h3 className="font-display text-h3 text-brand mt-6">
                  Application Received
                </h3>
                <p className="text-body text-mid mt-3 max-w-md mx-auto">
                  Thank you for joining the Central Valley Indian Chamber of Commerce.
                  Our team will review your application and your business will appear in the directory once approved.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-accent text-small font-medium hover:text-gold-900 transition-colors"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Selected tier indicator */}
                {selectedTier && (
                  <div className="bg-navy-100 border border-brand/10 rounded-md px-4 py-3 flex items-center justify-between">
                    <span className="font-label text-micro tracking-widest uppercase text-brand">
                      {selectedTier === 'corporate' ? 'Corporate Membership' : 'Individual Membership'}
                    </span>
                    <span className="font-display text-h4 text-brand">
                      ${selectedTier === 'corporate' ? '395' : '95'}
                      <span className="text-small text-mid font-body">/year</span>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="fullName" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                      Full Name *
                    </label>
                    <input id="fullName" type="text" required className={inputClass} placeholder="Your full name" />
                  </div>
                  <div>
                    <label htmlFor="applyEmail" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                      Email *
                    </label>
                    <input id="applyEmail" type="email" required className={inputClass} placeholder="you@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="applyPhone" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                      Phone
                    </label>
                    <input id="applyPhone" type="tel" className={inputClass} placeholder="(559) 555-0100" />
                  </div>
                  <div>
                    <label htmlFor="city" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                      City
                    </label>
                    <select id="city" className={inputClass}>
                      <option value="">Select city</option>
                      <option value="Fresno">Fresno</option>
                      <option value="Clovis">Clovis</option>
                      <option value="Visalia">Visalia</option>
                      <option value="Bakersfield">Bakersfield</option>
                      <option value="Modesto">Modesto</option>
                      <option value="Madera">Madera</option>
                      <option value="Hanford">Hanford</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="businessName" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Business Name *
                  </label>
                  <input id="businessName" type="text" required className={inputClass} placeholder="Your business name" />
                </div>
                <div>
                  <label htmlFor="sector" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Industry Sector
                  </label>
                  <select id="sector" className={inputClass}>
                    <option value="">Select sector</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Legal">Legal</option>
                    <option value="Technology">Technology</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="about" className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Tell Us About Your Business
                  </label>
                  <textarea
                    id="about"
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Brief description of your business and why you'd like to join"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3.5 rounded-sm hover:bg-gold-900 transition-all shadow-card hover:shadow-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
                </button>
                <p className="text-caption text-hint text-center mt-3">
                  Your business will appear in our directory once reviewed and approved.
                </p>
              </form>
            )}
          </div>

          {/* Contact CTA */}
          <div className="mt-16 text-center">
            <p className="text-body text-mid">
              Questions about membership? Contact our Chairwoman
            </p>
            <p className="font-display text-h4 text-brand mt-2">
              Sonia Heer
            </p>
            <a
              href="tel:5104531248"
              className="inline-flex items-center gap-2 text-accent font-label text-label tracking-label uppercase mt-2 hover:text-gold-900 transition-colors"
            >
              (510) 453-1248
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
