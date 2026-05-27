import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { mockSiteSettings, mockLeadership } from '@/lib/mock-data'

export function generateMetadata(): Metadata {
  return {
    title: 'About Us — CVICC',
    description:
      'Learn about the Central Valley Indian Chamber of Commerce (CVICC) mission to empower, connect, and elevate Indian-American businesses across the Central Valley.',
  }
}

const HEADSHOT_MAP: Record<string, string> = {
  'Sonia Heer': '/headshots/SoniaH.jpg',
  'Dr. Surdeep Singh': '/headshots/Surdeep.png',
  'Rajinder Kumar': '/headshots/RajK.jpeg',
  'Isha Lochab': '/headshots/isha-lochab.jpg',
  'Kiran Hundal': '/headshots/kiranjot-hundal.jpg',
  'Roken Bhatt': '/headshots/RokenB.jpeg',
  'Manreet Sandhu': '/headshots/manreet-sandhu.jpg',
  'Akash Singal': '/headshots/Akash.jpg',
  'Bobby Basra': '/headshots/bobby-basra.jpg',
}

const values = [
  {
    icon: 'C',
    title: 'Community',
    description:
      'We foster a strong, inclusive community where Indian-American business owners support one another, share knowledge, and build lasting professional relationships that strengthen the entire Central Valley.',
  },
  {
    icon: 'G',
    title: 'Growth',
    description:
      'We are committed to the professional and economic growth of our members through mentorship, education, networking, and access to resources that help businesses thrive at every stage.',
  },
  {
    icon: 'H',
    title: 'Heritage',
    description:
      'We celebrate and preserve the rich cultural heritage of the Indian-American community while building bridges across cultures and contributing to the diverse fabric of the Central Valley.',
  },
]

const stats = [
  { value: `${mockSiteSettings.memberCount}+`, label: 'Active Members' },
  { value: `${mockSiteSettings.sectorCount}`, label: 'Industry Sectors' },
  { value: `${mockSiteSettings.eventsPerYear}+`, label: 'Events Per Year' },
  { value: `${mockSiteSettings.yearsEstablished}`, label: 'Years Established' },
]

export default function AboutPage() {
  const topLeaders = mockLeadership.slice(0, 4)

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
            <SectionLabel dark>Our Mission</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Empowering Indian Businesses in the Central Valley
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      {/* Content */}
      <section className="bg-page-bg py-24">
        <div className="max-w-3xl mx-auto px-8">
          <AnimatedSection>
            <p className="text-body text-mid leading-relaxed">
              The Central Valley Indian Chamber of Commerce is dedicated to
              supporting and advancing Indian-owned businesses, entrepreneurs,
              and professionals throughout California&rsquo;s Central Valley.
              Our mission is to create opportunities for economic growth,
              business networking, mentorship, cultural celebration, and
              community leadership.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={1}>
            <p className="text-body text-mid leading-relaxed mt-6">
              Through strategic partnerships, educational programs, and
              community events, we aim to strengthen the presence and impact
              of the Indian business community while contributing to the
              overall prosperity of the region. We believe in building bridges
              between cultures, empowering future leaders, and creating a
              thriving ecosystem where businesses and communities grow together.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={2}>
            <Divider className="mx-auto my-12" />
          </AnimatedSection>

          {/* Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {values.map((value, i) => (
              <AnimatedSection key={value.title} delay={i + 3}>
                <div className="bg-white border border-ivory-200 rounded-lg p-8 text-center shadow-card hover:shadow-hover transition-all">
                  <div className="w-16 h-16 rounded-full bg-navy-100 mx-auto flex items-center justify-center">
                    <span className="font-display text-h2 italic text-brand">
                      {value.icon}
                    </span>
                  </div>
                  <h3 className="font-display text-h4 text-brand mt-4">
                    {value.title}
                  </h3>
                  <p className="text-small text-mid mt-3">{value.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-page-alt py-16">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i}>
                <p className="font-display text-h1 text-brand">{stat.value}</p>
                <p className="font-label text-micro tracking-widest uppercase text-brand/70 mt-2">
                  {stat.label}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Board Preview */}
      <section className="bg-page-bg py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center">
            <AnimatedSection>
              <SectionLabel>Leadership</SectionLabel>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <SectionTitle className="mt-4">Board of Directors</SectionTitle>
            </AnimatedSection>
            <AnimatedSection delay={2}>
              <Divider className="mx-auto mt-6" />
            </AnimatedSection>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {topLeaders.map((leader, i) => (
              <AnimatedSection key={leader._id} delay={i + 3}>
                <div className="text-center group">
                  <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden ring-2 ring-ivory-200 group-hover:ring-accent transition-all">
                    <Image
                      src={HEADSHOT_MAP[leader.name] || '/headshots/placeholder.jpg'}
                      alt={leader.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="font-display text-h5 text-brand mt-4">{leader.name}</h4>
                  <p className="font-label text-micro tracking-widest uppercase text-brand/70 mt-1">
                    {leader.role}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={7}>
            <div className="text-center mt-10">
              <Link
                href="/about/leadership"
                className="inline-flex items-center gap-2 font-label text-label tracking-label uppercase text-accent hover:text-gold-900 transition-colors"
              >
                View Full Board
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
