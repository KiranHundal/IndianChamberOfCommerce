import type { Metadata } from 'next'
import Image from 'next/image'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'
import Badge from '@/components/ui/Badge'
import { mockLeadership } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Board of Directors — CVICC',
  description:
    'Meet the Board of Directors of the Central Valley Indian Chamber of Commerce — the leaders guiding our mission.',
}

const HEADSHOT_MAP: Record<string, string> = {
  'Sonia Heer': '/headshots/sonia-heer.jpg',
  'Dr. Surdeep Singh': '/headshots/surdeep-singh.jpg',
  'Rajinder Kumar': '/headshots/rajinder-kumar.jpg',
  'Isha Lochab': '/headshots/isha-lochab.jpg',
  'Kiranjot Kaur Hundal': '/headshots/kiranjot-hundal.jpg',
  'Roken Bhatt': '/headshots/roken-bhatt.jpg',
  'Manreet Sandhu': '/headshots/manreet-sandhu.jpg',
  'Akash Singal': '/headshots/akash-singal.jpg',
  'Bobby Basra': '/headshots/bobby-basra.jpg',
}

function getBioText(bio: Array<{ children: Array<{ text: string }> }>): string {
  return bio.map((block) => block.children.map((c) => c.text).join('')).join(' ')
}

function getRolePriority(role: string): 'executive' | 'officer' | 'member' {
  const r = role.toLowerCase()
  if (r.includes('chair') || r.includes('president')) return 'executive'
  if (r.includes('treasurer') || r.includes('secretary')) return 'officer'
  if (r === 'founder') return 'executive'
  return 'member'
}

export default function LeadershipPage() {
  const executives = mockLeadership.filter((l) => getRolePriority(l.role) === 'executive')
  const officers = mockLeadership.filter((l) => getRolePriority(l.role) === 'officer')
  const members = mockLeadership.filter((l) => getRolePriority(l.role) === 'member')

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
            <SectionLabel dark>Board of Directors</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Our Leadership
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <p className="text-white/55 text-body max-w-2xl mx-auto mt-6">
              The CVICC Board of Directors is composed of dedicated professionals
              who volunteer their time, expertise, and passion to serve the
              Indian-American business community of the Central Valley.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={3}>
            <Divider className="mx-auto mt-8" />
          </AnimatedSection>
        </div>
      </section>

      {/* Executive Leadership — large cards */}
      <section className="bg-page-bg py-24">
        <div className="max-w-6xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel>Executive Leadership</SectionLabel>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
            {executives.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i + 1}>
                <div className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all group">
                  <div className="relative h-72 overflow-hidden">
                    <Image
                      src={HEADSHOT_MAP[leader.name] || '/headshots/placeholder.jpg'}
                      alt={leader.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6">
                      <p className="font-label text-[0.625rem] tracking-widest uppercase text-gold-400">
                        {leader.role}
                      </p>
                      <h3 className="font-display text-h3 text-white mt-1">
                        {leader.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    {leader.sector && (
                      <Badge variant="navy" className="mb-3">
                        {leader.sector.name}
                      </Badge>
                    )}
                    <p className="text-small text-mid leading-relaxed">
                      {getBioText(leader.bio as Array<{ children: Array<{ text: string }> }>)}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Officers */}
      <section className="bg-page-alt py-20">
        <div className="max-w-6xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel>Officers</SectionLabel>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            {officers.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i + 1}>
                <div className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all flex">
                  <div className="relative w-40 min-h-[200px] flex-shrink-0">
                    <Image
                      src={HEADSHOT_MAP[leader.name] || '/headshots/placeholder.jpg'}
                      alt={leader.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1">
                    <p className="font-label text-[0.625rem] tracking-widest uppercase text-accent">
                      {leader.role}
                    </p>
                    <h3 className="font-display text-h4 text-brand mt-1">
                      {leader.name}
                    </h3>
                    {leader.sector && (
                      <Badge variant="navy" className="mt-2">
                        {leader.sector.name}
                      </Badge>
                    )}
                    <p className="text-small text-mid mt-3 leading-relaxed">
                      {getBioText(leader.bio as Array<{ children: Array<{ text: string }> }>)}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Board Members */}
      <section className="bg-page-bg py-20">
        <div className="max-w-6xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel>Board Members</SectionLabel>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {members.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i + 1}>
                <div className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all text-center">
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={HEADSHOT_MAP[leader.name] || '/headshots/placeholder.jpg'}
                      alt={leader.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-h5 text-brand">
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
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Board CTA */}
      <section className="bg-navy-900 py-20 relative overflow-hidden">
        <div className="absolute top-6 right-6 w-16 h-16 border-t border-r border-gold-600/25" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l border-gold-600/25" />

        <div className="max-w-3xl mx-auto px-8 text-center">
          <AnimatedSection>
            <SectionLabel dark>Get Involved</SectionLabel>
            <h2 className="font-display text-h2 text-white mt-4">
              Interested in serving on the board?
            </h2>
            <p className="text-body text-white/55 mt-4 max-w-xl mx-auto">
              CVICC welcomes nominations from dedicated professionals who want
              to give back to the Indian-American business community. Board
              elections are held annually at the General Membership Meeting.
            </p>
            <a
              href="/contact"
              className="inline-block mt-8 bg-accent text-white rounded-sm px-8 py-3.5 font-label text-label tracking-label uppercase hover:bg-gold-900 transition-all"
            >
              Contact Us
            </a>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
