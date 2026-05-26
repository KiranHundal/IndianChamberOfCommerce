'use client'

import { useState } from 'react'
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

export default function JoinPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

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
                    <a
                      href={SQUARE_LINKS[tier.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full mt-8 text-center font-label text-label tracking-label uppercase px-6 py-3.5 rounded-sm transition-all bg-accent text-white hover:bg-gold-900 shadow-card hover:shadow-hover"
                    >
                      Join Now — ${tier.salePrice}/year
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
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
