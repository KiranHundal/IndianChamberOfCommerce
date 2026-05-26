import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

const pillars = [
  {
    letter: 'C',
    title: 'Connect',
    text: 'Build meaningful relationships with fellow entrepreneurs and professionals across the Central Valley.',
  },
  {
    letter: 'E',
    title: 'Empower',
    text: 'Access mentorship, resources, and educational opportunities to grow your business and career.',
  },
  {
    letter: 'G',
    title: 'Grow',
    text: 'Expand your reach through networking events, business directory listings, and community visibility.',
  },
]

export default function AboutPreview() {
  return (
    <section className="bg-page-bg py-24">
      <div className="max-w-5xl mx-auto px-8">
        <div className="text-center">
          <AnimatedSection>
            <SectionLabel>Our Mission</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle className="mt-4">
              Empowering Indian Businesses in the Central Valley
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
          <AnimatedSection delay={3}>
            <p className="text-body text-mid mt-6 max-w-2xl mx-auto leading-relaxed">
              CVICC is a unified platform where Indian-American entrepreneurs
              and professionals connect, collaborate, and grow together — building
              a stronger business community for the entire Valley.
            </p>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
          {pillars.map((pillar, i) => (
            <AnimatedSection key={pillar.title} delay={i + 4}>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 text-center h-full relative">
                <div className="w-14 h-14 rounded-full bg-navy-900 mx-auto flex items-center justify-center">
                  <span className="font-display text-h3 italic text-gold-400">
                    {pillar.letter}
                  </span>
                </div>
                <h3 className="font-display text-h4 text-brand mt-5">{pillar.title}</h3>
                <p className="text-small text-mid mt-3 leading-relaxed">{pillar.text}</p>
                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={7}>
          <div className="text-center mt-12">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 font-label text-label tracking-label uppercase text-accent hover:text-gold-900 transition-colors"
            >
              Learn More About CVICC
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
