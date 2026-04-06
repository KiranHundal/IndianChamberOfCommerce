import type { Metadata } from 'next'
import {
  Users,
  BookOpen,
  UserCheck,
  Handshake,
  Megaphone,
  Heart,
  Check,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import Button from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Join the Chamber',
  description:
    'Become a member of the Central Valley Indian Chamber of Commerce and unlock networking events, mentorship, business directory listing, and more.',
}

const benefits = [
  {
    icon: Users,
    title: 'Networking Events',
    description: '40+ annual events to connect with fellow professionals and grow your business relationships.',
  },
  {
    icon: BookOpen,
    title: 'Business Directory',
    description: 'Get listed in our member directory and increase your visibility to potential clients and partners.',
  },
  {
    icon: UserCheck,
    title: 'Mentorship Access',
    description: 'Connect with industry leaders who can guide your business growth and career development.',
  },
  {
    icon: Handshake,
    title: 'Cross-Sector Partnerships',
    description: 'Collaborate across industries to discover new opportunities and expand your reach.',
  },
  {
    icon: Megaphone,
    title: 'Marketing Exposure',
    description: 'Get featured on our website and social media channels to boost your brand awareness.',
  },
  {
    icon: Heart,
    title: 'Community Impact',
    description: 'Support Indian business growth in the Central Valley and contribute to a thriving community.',
  },
]

const tiers = [
  {
    name: 'Individual',
    price: 150,
    featured: false,
    features: [
      'Member directory listing',
      'Access to all networking events',
      'Monthly newsletter',
      'Online community access',
      'Annual gala invitation',
    ],
  },
  {
    name: 'Business',
    price: 300,
    featured: true,
    features: [
      'Everything in Individual',
      'Business directory listing with logo',
      'Priority event registration',
      'Mentorship program access',
      'Social media spotlight (2x/year)',
      'Website featured member profile',
    ],
  },
  {
    name: 'Corporate',
    price: 500,
    featured: false,
    features: [
      'Everything in Business',
      'Premium directory placement',
      'Event sponsorship opportunities',
      'Speaking opportunities at events',
      'Dedicated account manager',
      'Logo on CVICC website',
      'Annual awards nomination',
    ],
  },
]

export default function JoinPage() {
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
          <SectionTitle dark className="mt-4">
            Join the Chamber
          </SectionTitle>
          <Divider className="mx-auto mt-6" />
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Why Join</SectionLabel>
            <SectionTitle className="mt-4">Membership Benefits</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.title}
                  className="bg-white border border-ivory-200 rounded-lg p-6 text-center shadow-card"
                >
                  <div className="w-12 h-12 rounded-full bg-navy-100 mx-auto flex items-center justify-center text-brand">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-h4 text-brand mt-4">
                    {benefit.title}
                  </h3>
                  <p className="text-small text-mid mt-2">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="bg-page-alt py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Plans</SectionLabel>
            <SectionTitle className="mt-4">Membership Tiers</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all ${
                  tier.featured ? 'ring-2 ring-accent' : ''
                }`}
              >
                {/* Header */}
                <div
                  className={`p-6 text-center relative ${
                    tier.featured ? 'bg-brand' : 'bg-navy-100'
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute top-3 right-3 bg-accent text-white text-xs font-label tracking-label uppercase px-3 py-1 rounded-sm">
                      Most Popular
                    </span>
                  )}
                  <h3
                    className={`font-display text-h3 ${
                      tier.featured ? 'text-white' : 'text-brand'
                    }`}
                  >
                    {tier.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="p-8 text-center border-b border-ivory-200">
                  <span className="font-display text-h1 text-brand">
                    ${tier.price}
                  </span>
                  <span className="text-small text-mid"> /year</span>
                </div>

                {/* Features */}
                <div className="p-8">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-small text-mid"
                      >
                        <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button
                      href="#apply"
                      variant={tier.featured ? 'gold' : 'primary'}
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tally Form */}
      <section id="apply" className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Get Started</SectionLabel>
            <SectionTitle className="mt-4">Apply Now</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="mt-12 bg-white border border-ivory-200 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
            <div>
              <p className="text-body text-mid">
                Membership application form will appear here
              </p>
              <p className="text-small text-hint mt-2">
                Powered by Tally.so — form will be embedded once live
              </p>
              {/* <iframe data-tally-src="https://tally.so/embed/mRxVYa?alignLeft=1&hideTitle=1&transparentBackground=1" width="100%" height="500" frameBorder="0" title="Membership Application"></iframe> */}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
