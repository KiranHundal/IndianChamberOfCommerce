import type { Metadata } from 'next'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'
import Badge from '@/components/ui/Badge'
import { mockLeadership } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Leadership',
  description:
    'Meet the leadership team of the Central Valley Indian Chamber of Commerce.',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}

function getBioText(bio: Array<{ children: Array<{ text: string }> }>): string {
  return bio.map((block) => block.children.map((c) => c.text).join('')).join(' ')
}

export default function LeadershipPage() {
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
            <SectionLabel dark>Our Team</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Our Leadership
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockLeadership.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i}>
                <div className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all">
                  {/* Photo placeholder */}
                  <div className="bg-navy-100 h-48 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center">
                      <span className="font-display text-h1 italic text-brand">
                        {getInitials(leader.name)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <h3 className="font-display text-h4 text-brand">
                      {leader.name}
                    </h3>
                    <p className="font-label text-micro tracking-widest uppercase text-accent mt-1">
                      {leader.role}
                    </p>

                    {leader.sector && (
                      <Badge variant="navy" className="mt-2">
                        {leader.sector.name}
                      </Badge>
                    )}

                    <p className="text-small text-mid mt-3">
                      {getBioText(leader.bio as Array<{ children: Array<{ text: string }> }>)}
                    </p>

                    {leader.videoUrl && (
                      <a
                        href={leader.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-accent font-label text-micro tracking-widest uppercase mt-4 hover:text-brand transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Watch Video
                      </a>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
