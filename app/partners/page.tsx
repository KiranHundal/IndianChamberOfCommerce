import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import Badge from '@/components/ui/Badge'
import { mockPartners } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Partners & Sponsors',
  description:
    'Our partners and sponsors help make the Central Valley Indian Chamber of Commerce possible. Learn about partnership opportunities.',
}

const tierConfig = {
  Gold: { borderColor: 'border-t-accent', bgColor: 'bg-gold-100' },
  Silver: { borderColor: 'border-t-hint', bgColor: 'bg-navy-100' },
  Community: { borderColor: 'border-t-ivory-200', bgColor: 'bg-page-alt' },
}

export default function PartnersPage() {
  const goldPartners = mockPartners.filter((p) => p.tier === 'Gold')
  const silverPartners = mockPartners.filter((p) => p.tier === 'Silver')
  const communityPartners = mockPartners.filter((p) => p.tier === 'Community')

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="max-w-4xl mx-auto px-8">
          <SectionLabel dark>Our Partners</SectionLabel>
          <SectionTitle dark className="mt-4">
            Partners &amp; Sponsors
          </SectionTitle>
          <Divider className="mx-auto mt-6" />
          <p className="text-body text-white/55 mt-6 max-w-xl mx-auto">
            We are grateful for the organizations that support our mission of connecting and empowering Indian businesses in the Central Valley.
          </p>
        </div>
      </section>

      {/* Gold Partners */}
      {goldPartners.length > 0 && (
        <section className="bg-page-bg py-24">
          <div className="max-w-[75rem] mx-auto px-8">
            <div className="text-center">
              <SectionLabel>Premier</SectionLabel>
              <SectionTitle className="mt-4">Gold Partners</SectionTitle>
              <Divider className="mx-auto mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {goldPartners.map((partner) => (
                <div
                  key={partner._id}
                  className="bg-white border border-ivory-200 border-t-4 border-t-accent rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all"
                >
                  <div className="bg-gold-100 h-32 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-accent/40" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-h4 text-brand">{partner.name}</h3>
                      <Badge variant="gold">Gold</Badge>
                    </div>
                    <p className="text-small text-mid mt-3">{partner.description}</p>
                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent text-small font-medium mt-4 inline-block hover:text-gold-900 transition-colors"
                      >
                        Visit Website &rarr;
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Silver Partners */}
      {silverPartners.length > 0 && (
        <section className="bg-page-alt py-24">
          <div className="max-w-[75rem] mx-auto px-8">
            <div className="text-center">
              <SectionLabel>Supporting</SectionLabel>
              <SectionTitle className="mt-4">Silver Partners</SectionTitle>
              <Divider className="mx-auto mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              {silverPartners.map((partner) => (
                <div
                  key={partner._id}
                  className="bg-white border border-ivory-200 border-t-4 border-t-hint rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all"
                >
                  <div className="bg-navy-100 h-24 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-brand/30" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-h4 text-brand">{partner.name}</h3>
                      <Badge variant="navy">Silver</Badge>
                    </div>
                    <p className="text-small text-mid mt-3">{partner.description}</p>
                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent text-small font-medium mt-4 inline-block hover:text-gold-900 transition-colors"
                      >
                        Visit Website &rarr;
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Partners */}
      {communityPartners.length > 0 && (
        <section className="bg-page-bg py-24">
          <div className="max-w-[75rem] mx-auto px-8">
            <div className="text-center">
              <SectionLabel>Community</SectionLabel>
              <SectionTitle className="mt-4">Community Partners</SectionTitle>
              <Divider className="mx-auto mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {communityPartners.map((partner) => (
                <div
                  key={partner._id}
                  className="bg-white border border-ivory-200 border-t-4 border-t-ivory-200 rounded-lg p-6 shadow-card hover:shadow-hover transition-all"
                >
                  <h3 className="font-display text-h4 text-brand">{partner.name}</h3>
                  <p className="text-small text-mid mt-2">{partner.description}</p>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent text-small font-medium mt-3 inline-block hover:text-gold-900 transition-colors"
                    >
                      Visit Website &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Become a Partner CTA */}
      <section className="bg-navy-900 py-24 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="relative z-10 max-w-2xl mx-auto px-8">
          <SectionLabel dark>Partner With Us</SectionLabel>
          <h2 className="font-display text-h1 md:text-display font-light text-white mt-4">
            Become a Partner
          </h2>
          <p className="font-body text-body text-white/55 mt-4">
            Support the Indian business community in the Central Valley and gain visibility among 200+ businesses and professionals.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-block bg-accent text-white font-label text-label tracking-label uppercase px-8 py-3 rounded-sm hover:bg-gold-900 transition-all"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
