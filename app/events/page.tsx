import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { mockEvents } from '@/lib/mock-data'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import Badge from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Explore upcoming and past CVICC events including galas, networking mixers, workshops, and seminars for Indian-American business professionals in the Central Valley.',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getDescriptionText(description: Record<string, unknown>[]): string {
  if (!description || !description.length) return ''
  return description
    .map((block: Record<string, unknown>) =>
      (block.children as Record<string, unknown>[])?.map((child: Record<string, unknown>) => child.text).join('') ?? ''
    )
    .join(' ')
}

// Split mock events: first 3 as upcoming, last 3 as past
const upcomingEvents = mockEvents.slice(0, 3)
const pastEvents = mockEvents.slice(3)

export default function EventsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center">
        <div className="max-w-[75rem] mx-auto px-8">
          <SectionLabel dark>What&apos;s Happening</SectionLabel>
          <SectionTitle dark className="mt-4">
            Events &amp; Programs
          </SectionTitle>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8 text-center">
          <SectionLabel>Coming Up</SectionLabel>
          <SectionTitle className="mt-4">Upcoming Events</SectionTitle>
          <Divider className="mx-auto mt-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {upcomingEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all text-left"
              >
                {/* Image placeholder */}
                <div className="bg-navy-100 h-48 flex items-center justify-center">
                  <Calendar className="text-brand/30 w-16 h-16" />
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="font-label text-micro tracking-widest uppercase text-accent">
                    {formatDate(event.date)}
                  </p>
                  <h3 className="font-display text-h4 text-brand mt-2">
                    {event.title}
                  </h3>
                  <p className="text-small text-mid mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="navy">{event.type}</Badge>
                    {event.isMembersOnly && (
                      <Badge variant="gold">Members Only</Badge>
                    )}
                  </div>

                  <p className="text-small text-mid mt-3 line-clamp-2">
                    {getDescriptionText(event.description)}
                  </p>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-4">
                    <Link
                      href={`/events/${event.slug.current}`}
                      className="text-accent text-small hover:underline"
                    >
                      Learn More &rarr;
                    </Link>
                    {event.rsvpUrl && (
                      <a
                        href={event.rsvpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-accent text-white rounded-md font-label text-micro tracking-label uppercase hover:bg-accent/90 transition-all"
                      >
                        RSVP
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="bg-page-alt py-24">
        <div className="max-w-[75rem] mx-auto px-8 text-center">
          <SectionLabel>Looking Back</SectionLabel>
          <SectionTitle className="mt-4">Past Events</SectionTitle>
          <Divider className="mx-auto mt-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {pastEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all text-left opacity-90"
              >
                {/* Image placeholder */}
                <div className="bg-navy-100 h-48 flex items-center justify-center">
                  <Calendar className="text-brand/30 w-16 h-16" />
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="font-label text-micro tracking-widest uppercase text-accent">
                    {formatDate(event.date)}
                  </p>
                  <h3 className="font-display text-h4 text-brand mt-2">
                    {event.title}
                  </h3>
                  <p className="text-small text-mid mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="navy">{event.type}</Badge>
                    <Badge variant="outline">Past Event</Badge>
                    {event.isMembersOnly && (
                      <Badge variant="gold">Members Only</Badge>
                    )}
                  </div>

                  <p className="text-small text-mid mt-3 line-clamp-2">
                    {getDescriptionText(event.description)}
                  </p>

                  {/* Footer — no RSVP for past events */}
                  <div className="mt-4">
                    <Link
                      href={`/events/${event.slug.current}`}
                      className="text-accent text-small hover:underline"
                    >
                      Learn More &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
