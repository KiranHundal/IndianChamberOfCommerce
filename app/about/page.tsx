import type { Metadata } from 'next'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { mockSiteSettings } from '@/lib/mock-data'

export function generateMetadata(): Metadata {
  return {
    title: 'About Us',
    description:
      'Learn about the Central Valley Indian Chamber of Commerce (CVICC) mission to empower, connect, and elevate Indian-American businesses across the Central Valley.',
  }
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
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        {/* Corner marks */}
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
              The Central Valley Indian Chamber of Commerce (CVICC) was founded
              with a clear purpose: to create a unified platform where
              Indian-American entrepreneurs and professionals in the Central
              Valley can connect, collaborate, and grow together. For over{' '}
              {mockSiteSettings.yearsEstablished} years, we have served as the
              bridge between ambition and opportunity for our members.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={1}>
            <p className="text-body text-mid leading-relaxed mt-6">
              Our vision is a Central Valley where Indian-American businesses are
              recognized as vital contributors to the regional economy, where
              emerging entrepreneurs have access to the mentors and resources
              they need, and where our cultural heritage enriches the broader
              community. We believe that when our members succeed, the entire
              Valley benefits.
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
                <p className="font-label text-micro tracking-widest uppercase text-accent mt-2">
                  {stat.label}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
