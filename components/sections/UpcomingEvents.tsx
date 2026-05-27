import Link from 'next/link'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import { mockEvents } from '@/lib/mock-data'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

const upcomingEvents = mockEvents
  .filter((e) => new Date(e.date) > new Date('2026-05-27'))
  .slice(0, 3)

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate().toString(),
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function UpcomingEvents() {
  return (
    <section className="bg-page-alt py-24">
      <div className="max-w-5xl mx-auto px-8">
        <div className="text-center mb-16">
          <AnimatedSection>
            <SectionLabel>Events</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle className="mt-4">Upcoming Events</SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>

        <div className="space-y-6">
          {upcomingEvents.map((event, i) => {
            const { month, day } = formatDate(event.date)
            return (
              <AnimatedSection key={event._id} delay={i + 3}>
                <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-6 sm:p-8 flex gap-6 items-start relative group hover:border-gold-600/30 transition-all">
                  <div className="hidden sm:flex flex-col items-center justify-center min-w-[4.5rem] bg-navy-900 rounded-lg py-3 px-4 text-center">
                    <span className="font-label text-[0.6rem] tracking-widest uppercase text-gold-400">
                      {month}
                    </span>
                    <span className="font-display text-h2 text-white leading-none mt-0.5">
                      {day}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:hidden mb-2">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      <span className="font-label text-[0.6rem] tracking-widest uppercase text-accent">
                        {month} {day}
                      </span>
                    </div>

                    <h3 className="font-display text-h4 text-brand group-hover:text-navy-800 transition-colors">
                      {event.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="flex items-center gap-1.5 text-small text-mid">
                        <MapPin className="w-3.5 h-3.5 text-brand/50" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-small text-mid">
                        <Calendar className="w-3.5 h-3.5 text-brand/50" />
                        {formatTime(event.date)}
                      </span>
                    </div>

                    <span className="inline-block mt-3 bg-navy-100 text-brand rounded-full px-3 py-0.5 text-[0.65rem] font-label tracking-widest uppercase">
                      {event.type}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center self-center">
                    <span className="font-label text-[0.65rem] tracking-widest uppercase text-accent group-hover:text-gold-900 transition-colors flex items-center gap-1">
                      Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="gold-accent-line" />
                </div>
              </AnimatedSection>
            )
          })}
        </div>

        <AnimatedSection delay={6}>
          <div className="text-center mt-12">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 font-label text-label tracking-label uppercase text-accent hover:text-gold-900 transition-colors"
            >
              View All Events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
