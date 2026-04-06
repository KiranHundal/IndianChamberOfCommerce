import type { Metadata } from 'next'
import { Building2, ExternalLink } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import Button from '@/components/ui/Button'
import { mockPartners } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Partners & Sponsors',
  description:
    'Meet the partners and sponsors who support the Central Valley Indian Chamber of Commerce and help our community thrive.',
}

const goldPartners = mockPartners.filter((p) => p.tier === 'Gold')
const silverPartners = mockPartners.filter((p) => p.tier === 'Silver')
const communityPartners = mockPartners.filter((p) => p.tier === 'Community')

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="max-w-4xl mx-auto px-8">
          <SectionLabel dark>Our Supporters</SectionLabel>
          <SectionTitle dark className="mt-4">
            Partners &amp; Sponsors
          </SectionTitle>
          <Divider className="mx-auto mt-6" />
        </div>
      </section>

      {/* Gold Sponsors */}
      <section className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Premier</SectionLabel>
            <SectionTitle className="mt-4">Gold Sponsors</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {goldPartners.map((partner) => (
              <div
                key={partner._id}
                className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card border-t-4 border-t-accent"
              >
                <div className="bg-gold-100 h-32 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-accent" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-h4 text-brand">
                    {partner.name}
                  </h3>
                  <p className="text-small text-mid mt-2">
                    {partner.description}
                  </p>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-small text-accent hover:text-gold-900 mt-4 transition-colors"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Silver Sponsors */}
      <section className="bg-page-alt py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Supporting</SectionLabel>
            <SectionTitle className="mt-4">Silver Sponsors</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {silverPartners.map((partner) => (
              <div
                key={partner._id}
                className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card border-t-4 border-t-hint"
              >
                <div className="bg-ivory-100 h-24 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-hint" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-h4 text-brand">
                    {partner.name}
                  </h3>
                  <p className="text-small text-mid mt-2">
                    {partner.description}
                  </p>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-small text-accent hover:text-gold-900 mt-4 transition-colors"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Partners */}
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
                className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card border-t-4 border-t-ivory-200"
              >
                <div className="p-6">
                  <h3 className="font-display text-h4 text-brand">
                    {partner.name}
                  </h3>
                  <p className="text-small text-mid mt-2">
                    {partner.description}
                  </p>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-small text-accent hover:text-gold-900 mt-4 transition-colors"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="bg-navy-900 py-24 text-center">
        <div className="max-w-3xl mx-auto px-8">
          <SectionLabel dark>Partner With Us</SectionLabel>
          <SectionTitle dark className="mt-4">
            Become a Partner
          </SectionTitle>
          <Divider className="mx-auto mt-6" />
          <p className="text-body text-white/70 mt-6 leading-relaxed">
            Partnering with CVICC gives your organization direct access to a
            vibrant network of Indian-American business professionals in the
            Central Valley. Explore sponsorship opportunities and grow with our
            community.
          </p>
          <div className="mt-8">
            <Button href="/contact" variant="gold" size="lg">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
