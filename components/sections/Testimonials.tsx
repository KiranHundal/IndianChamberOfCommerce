import Image from 'next/image'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

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
]

export default function Testimonials() {
  return (
    <section className="bg-navy-900 py-24 relative overflow-hidden">
      <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/20 hidden md:block" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/20 hidden md:block" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/20 hidden md:block" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/20 hidden md:block" />

      <div className="max-w-6xl mx-auto px-8">
        <div className="text-center mb-16">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i + 3} className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold-600/30">
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div>
                    <p className="font-display text-[1rem] text-white">{t.name}</p>
                    <p className="font-label text-[0.55rem] tracking-widest uppercase text-gold-600/80 mt-0.5">
                      {t.title}
                    </p>
                    <p className="text-[0.7rem] text-white/40 mt-0.5">
                      {t.credential}
                    </p>
                  </div>
                </div>

                <div className="flex-1 relative mt-6">
                  <span className="font-display text-[4rem] leading-none text-gold-600/20 absolute -top-2 -left-1">&ldquo;</span>
                  <p className="text-body text-white/70 leading-relaxed pt-8 italic">
                    {t.quote}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
