import type { Metadata } from 'next'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

export const metadata: Metadata = {
  title: 'Initiatives',
  description:
    'Discover the programs and initiatives of the Central Valley Indian Chamber of Commerce that support business growth and community development.',
}

const initiatives = [
  {
    label: 'Empowerment',
    title: 'Mentorship Program',
    description:
      'Our flagship mentorship program connects experienced business leaders with emerging entrepreneurs in the Central Valley. Mentors provide guidance on strategy, operations, and growth while mentees bring fresh perspectives and energy.',
    bullets: [
      'One-on-one pairing based on industry and goals',
      'Quarterly check-ins and progress tracking',
      'Access to exclusive mentor networking events',
      'Structured six-month engagement cycles',
    ],
    icon: 'M',
  },
  {
    label: 'Networking',
    title: 'Cross-Sector Networking',
    description:
      'Monthly networking events bring together professionals from all eight of our industry sectors. These curated gatherings bridge industries, spark collaboration, and create business opportunities that would not emerge in siloed environments.',
    bullets: [
      'Monthly themed mixer events',
      'Industry spotlight presentations',
      'Facilitated introductions and icebreakers',
      'Follow-up connection support',
    ],
    icon: 'N',
  },
  {
    label: 'Education',
    title: 'Business Development Workshops',
    description:
      'Practical, skills-focused workshops designed to help members strengthen their businesses. From digital marketing to financial planning, our workshops are led by industry experts and tailored to the Central Valley market.',
    bullets: [
      'Digital marketing and social media strategy',
      'Financial literacy and tax planning',
      'Legal compliance and business formation',
      'Leadership and team management',
    ],
    icon: 'W',
  },
  {
    label: 'Service',
    title: 'Community Outreach',
    description:
      'CVICC is committed to giving back to the broader Central Valley community. Through volunteer drives, charitable partnerships, and cultural celebrations, we strengthen the ties between the Indian-American business community and our neighbors.',
    bullets: [
      'Annual Diwali community celebration',
      'Scholarship fund for local students',
      'Partnerships with local nonprofits',
      'Volunteer service days throughout the year',
    ],
    icon: 'O',
  },
]

export default function InitiativesPage() {
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
            <SectionLabel dark>What We Do</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Our Initiatives
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      {/* Initiatives List */}
      <section className="bg-page-bg py-24">
        <div className="max-w-6xl mx-auto px-8 space-y-16">
          {initiatives.map((initiative, i) => {
            const isReversed = i % 2 === 1

            return (
              <AnimatedSection key={initiative.title} delay={i}>
                <div className="bg-white border border-ivory-200 rounded-lg overflow-hidden">
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 ${
                      isReversed ? 'md:direction-rtl' : ''
                    }`}
                  >
                    {/* Text */}
                    <div
                      className={`p-8 ${isReversed ? 'md:order-2' : 'md:order-1'}`}
                    >
                      <SectionLabel>{initiative.label}</SectionLabel>
                      <h3 className="font-display text-h3 text-brand mt-2">
                        {initiative.title}
                      </h3>
                      <p className="text-body text-mid mt-3">
                        {initiative.description}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {initiative.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2 text-small text-mid"
                          >
                            <span className="text-accent mt-0.5 shrink-0">
                              &bull;
                            </span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Placeholder Image */}
                    <div
                      className={`bg-navy-100 h-64 md:h-auto flex items-center justify-center ${
                        isReversed ? 'md:order-1' : 'md:order-2'
                      }`}
                    >
                      <div className="w-24 h-24 rounded-full bg-white/60 flex items-center justify-center">
                        <span className="font-display text-h1 italic text-brand">
                          {initiative.icon}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </section>
    </>
  )
}
