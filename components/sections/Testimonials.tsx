import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'
import TestimonialCard from './TestimonialCard'
import { db } from '@/lib/db'
import { leaderVideos } from '@/lib/schema'

export const revalidate = 60

const testimonials = [
  {
    quote:
      'When Indian-American entrepreneurs stop working in silos and start building together, something powerful happens. We are real estate brokers, doctors, financial advisors, tech founders — and when we unite under one roof, we don\'t just grow businesses. We change the economic landscape of an entire region.',
    name: 'Sonia Heer',
    title: 'Chairwoman & Founder',
    credential: 'Broker/Owner, Golden State Realty · Founder, Lavish Eventz',
    image: '/headshots/sonia1.png',
  },
  {
    quote:
      'As a healthcare professional, I\'ve seen firsthand how a strong business community elevates an entire region. CVICC gives Indian-American professionals a platform to innovate, collaborate, and lead — together we\'re shaping the future of the Valley.',
    name: 'Dr. Surdeep Singh',
    title: 'President & Founder',
    credential: 'DDS, Robotic Dental Implant Center',
    image: '/headshots/surdeep1.png',
  },
  {
    quote:
      'Having worked with over 5,500 individuals in our community, I know the power of trust and connection. CVICC is more than a business network — it\'s a platform where our community\'s ambition, expertise, and values come together to shape the Central Valley\'s future.',
    name: 'Rajinder Kumar',
    title: 'Executive Director & Founder',
    credential: 'CPFA, CRPC, SE-AWMA — Financial Advisor, Senior Portfolio Advisor, Merrill Lynch',
    image: '/headshots/RajK.jpeg',
  },
  {
    quote:
      'CVICC is where numbers meet purpose. As treasurer, I\'m proud to help steward the financial vision that empowers Indian-American entrepreneurs to build lasting businesses and give back to our Central Valley community.',
    name: 'Kiran Hundal',
    title: 'Treasurer',
    credential: '',
    image: '/headshots/KiranH.jpg',
  },
]

async function getVideoMap(): Promise<Map<string, string>> {
  try {
    const rows = await db.select().from(leaderVideos)
    return new Map(rows.map((r) => [r.leaderName, r.url]))
  } catch {
    return new Map()
  }
}

export default async function Testimonials() {
  const videoMap = await getVideoMap()

  return (
    <section className="bg-navy-900 py-24 relative overflow-hidden">
      <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/20 hidden md:block" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/20 hidden md:block" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/20 hidden md:block" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/20 hidden md:block" />

      <div className="max-w-6xl mx-auto px-8">
        <div className="text-center mb-14">
          <AnimatedSection>
            <SectionLabel dark>From Our Founders</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Voices of Leadership
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
          <AnimatedSection delay={3}>
            <p className="text-body text-white/50 mt-6 max-w-xl mx-auto">
              Hear directly from the founders shaping CVICC&rsquo;s vision for the Central Valley.
            </p>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i + 4} className="h-full">
              <TestimonialCard {...t} videoUrl={videoMap.get(t.name)} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
