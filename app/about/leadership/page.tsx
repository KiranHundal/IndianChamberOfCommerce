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
  'Sonia Heer': '/headshots/sonia1.png',
  'Dr. Surdeep Singh': '/headshots/surdeep1.png',
  'Rajinder Kumar': '/headshots/RajK.jpeg',
  'Isha Lochab': '/headshots/Isha1.png',
  'Kiran Hundal': '/headshots/KiranH.jpg',
  'Roken Bhatt': '/headshots/Roken1.png',
  'Manreet Sandhu': '/headshots/manreet-sandhu.jpg',
  'Akash Singal': '/headshots/Akash1.png',
  'Bobby Basra': '/headshots/bobby-basra.jpg',
}

const HEADSHOT_POSITION: Record<string, string> = {
  'Sonia Heer': 'center 10%',
  'Dr. Surdeep Singh': 'center 10%',
  'Rajinder Kumar': 'center 10%',
  'Isha Lochab': 'center 10%',
  'Roken Bhatt': 'center 5%',
  'Akash Singal': 'center 10%',
  'Kiran Hundal': 'center 10%',
}

const EXEC_TRANSFORM: Record<string, string> = {
  'Sonia Heer': 'scale(1.25) translateY(-6%)',
  'Dr. Surdeep Singh': 'scale(1.25) translateY(-1%)',
  'Rajinder Kumar': 'scale(1.25) translateY(-5%)',
}

const BOARD_TRANSFORM: Record<string, string> = {
  'Isha Lochab': 'scale(1.45) translateY(-5%)',
  'Roken Bhatt': 'scale(1.3) translateY(-5%)',
  'Akash Singal': 'scale(1.3) translateY(-5%)',
}

const executives = mockLeadership.filter((l) =>
  ['Sonia Heer', 'Dr. Surdeep Singh', 'Rajinder Kumar'].includes(l.name)
)
const officers = mockLeadership.filter((l) =>
  ['Kiran Hundal'].includes(l.name)
)
const boardMembers = mockLeadership.filter((l) =>
  ['Isha Lochab', 'Roken Bhatt', 'Manreet Sandhu', 'Akash Singal', 'Bobby Basra'].includes(l.name)
)

export default function LeadershipPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30 corner-bracket corner-bracket-tl" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30 corner-bracket corner-bracket-tr" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30 corner-bracket corner-bracket-bl" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30 corner-bracket corner-bracket-br" />

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

      {/* Executive Leadership */}
      <section className="bg-page-bg py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <AnimatedSection>
              <SectionLabel>Executive Leadership</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <Divider className="mx-auto mt-4" />
            </AnimatedSection>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {executives.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i + 2} className="h-full">
                <div className="leadership-card bg-white border border-ivory-200 rounded-xl overflow-hidden flex flex-col h-full relative">
                  <div className="card-image relative h-[28rem] overflow-hidden flex-shrink-0">
                    <Image
                      src={HEADSHOT_MAP[leader.name] || '/headshots/placeholder.jpg'}
                      alt={leader.name}
                      fill
                      className="object-cover"
                      style={{
                        objectPosition: HEADSHOT_POSITION[leader.name] || 'center top',
                        transform: EXEC_TRANSFORM[leader.name] || undefined,
                        transformOrigin: 'center top',
                      }}
                    />
                    <div className="card-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
                    <div className="card-name absolute bottom-5 left-6 right-6">
                      <h3 className="font-display text-h3 text-white drop-shadow-lg">
                        {leader.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="font-label text-[0.625rem] tracking-widest uppercase text-brand/70">
                      {leader.role}
                    </p>
                    {leader.sector && (
                      <Badge variant="navy" className="mt-2 self-start">
                        {leader.sector.name}
                      </Badge>
                    )}
                  </div>

                  <div className="gold-accent-line" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Officers */}
      <section className="bg-page-alt py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <AnimatedSection>
              <SectionLabel>Officers</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <Divider className="mx-auto mt-4" />
            </AnimatedSection>
          </div>

          <div className="flex justify-center">
            {officers.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i + 2}>
                <div className="officer-card bg-white border border-ivory-200 rounded-xl overflow-hidden flex flex-row min-h-[12rem] w-[28rem] max-w-full relative">
                  <div className="card-image relative w-48 flex-shrink-0 overflow-hidden">
                    <Image
                      src={HEADSHOT_MAP[leader.name] || '/headshots/placeholder.jpg'}
                      alt={leader.name}
                      fill
                      className="object-cover transition-transform duration-700"
                      style={{ objectPosition: HEADSHOT_POSITION[leader.name] || 'center top' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                  </div>

                  <div className="p-6 flex flex-col justify-center">
                    <h3 className="font-display text-h3 text-brand">
                      {leader.name}
                    </h3>
                    <p className="font-label text-[0.625rem] tracking-widest uppercase text-brand/70 mt-2">
                      {leader.role}
                    </p>
                  </div>

                  <div className="gold-accent-line" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Board Members */}
      <section className="bg-page-bg py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <AnimatedSection>
              <SectionLabel>Board Members</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <Divider className="mx-auto mt-4" />
            </AnimatedSection>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {boardMembers.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i + 2}>
                <div className="board-card bg-white border border-ivory-200 rounded-xl overflow-hidden flex flex-col h-full relative">
                  <div className="card-image relative h-52 overflow-hidden flex-shrink-0">
                    <Image
                      src={HEADSHOT_MAP[leader.name] || '/headshots/placeholder.jpg'}
                      alt={leader.name}
                      fill
                      className="object-cover transition-transform duration-700"
                      style={{
                        objectPosition: HEADSHOT_POSITION[leader.name] || 'center top',
                        transform: BOARD_TRANSFORM[leader.name] || undefined,
                        transformOrigin: 'center top',
                      }}
                    />
                    <div className="card-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
                    <div className="card-name absolute bottom-4 left-4 right-4">
                      <h3 className="font-display text-h4 text-white drop-shadow-lg">
                        {leader.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="font-label text-[0.625rem] tracking-widest uppercase text-brand/70">
                      {leader.role}
                    </p>
                  </div>

                  <div className="gold-accent-line" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Board CTA */}
      <section className="bg-navy-900 py-20 relative overflow-hidden">
        <div className="absolute top-6 right-6 w-16 h-16 border-t border-r border-gold-600/25 corner-bracket corner-bracket-tr" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l border-gold-600/25 corner-bracket corner-bracket-bl" />

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
              className="cta-button-glow inline-block mt-8 bg-accent text-white rounded-sm px-8 py-3.5 font-label text-label tracking-label uppercase"
            >
              Contact Us
            </a>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
