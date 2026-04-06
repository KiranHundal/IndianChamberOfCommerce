import type { Metadata } from 'next'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { mockSectors } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Industry Sectors',
  description:
    'Explore the diverse industry sectors represented by the Central Valley Indian Chamber of Commerce.',
}

const sectorIcons: Record<string, string> = {
  Healthcare: 'H',
  'Real Estate': 'R',
  Legal: 'L',
  Technology: 'T',
  Hospitality: 'Ho',
  Agriculture: 'A',
  Education: 'E',
  Finance: 'F',
}

export default function SectorsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>What We Represent</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Industry Sectors
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-page-bg py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockSectors.map((sector, i) => (
              <AnimatedSection key={sector._id} delay={i}>
                <div className="bg-white border border-ivory-200 rounded-lg p-8 text-center hover:shadow-hover transition-all">
                  <div className="w-16 h-16 rounded-full bg-navy-100 mx-auto flex items-center justify-center text-brand">
                    <span className="font-display text-h3 italic">
                      {sectorIcons[sector.name] || sector.name[0]}
                    </span>
                  </div>
                  <p className="font-label text-label-lg tracking-label uppercase text-brand mt-4">
                    {sector.name}
                  </p>
                  <p className="text-small text-mid mt-3">
                    {sector.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
