import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import { mockEvents } from '@/lib/mock-data'
import Badge from '@/components/ui/Badge'

function findEventBySlug(slug: string) {
  return mockEvents.find((e) => e.slug.current === slug) || null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = findEventBySlug(slug)
  if (!event) {
    return { title: 'Event Not Found' }
  }
  return {
    title: event.title,
    description: getDescriptionText(event.description),
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = findEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const descriptionText = getDescriptionText(event.description)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.date,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    location: {
      '@type': event.isOnline ? 'VirtualLocation' : 'Place',
      name: event.location,
      ...(event.address ? { address: event.address } : {}),
    },
    description: descriptionText,
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-navy-900 py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-small text-white/60 hover:text-white transition-all mb-8"
          >
            &larr; All Events
          </Link>

          <p className="font-label text-micro tracking-widest uppercase text-gold-600 mb-4">
            {formatDate(event.date)}
          </p>

          <h1 className="font-display text-hero-sm md:text-hero-md text-white font-light">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <p className="text-body text-white/60 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {event.location}
            </p>
            <Badge variant="dark">{event.type}</Badge>
            {event.isMembersOnly && (
              <Badge variant="gold">Members Only</Badge>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-page-bg py-16">
        <div className="max-w-3xl mx-auto px-8">
          {/* Image placeholder */}
          <div className="bg-navy-100 w-full h-64 md:h-96 rounded-lg flex items-center justify-center mb-8">
            <Calendar className="text-brand/30 w-20 h-20" />
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-12">
            {/* Main content */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-h3 text-brand mb-4">
                About This Event
              </h2>
              <p className="text-body text-mid leading-relaxed">
                {descriptionText}
              </p>

              {event.sector && (
                <div className="mt-6">
                  <h3 className="font-display text-h4 text-brand mb-2">
                    Sector
                  </h3>
                  <Badge variant="navy">{event.sector.name}</Badge>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white border border-ivory-200 rounded-lg p-6 shadow-card">
                <h3 className="font-display text-h4 text-brand mb-4">
                  Event Details
                </h3>

                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-hint mt-0.5" />
                    <div>
                      <p className="text-small text-charcoal font-medium">
                        {formatDate(event.date)}
                      </p>
                      <p className="text-small text-mid">
                        {formatTime(event.date)}
                        {event.endDate && ` – ${formatTime(event.endDate)}`}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-hint mt-0.5" />
                    <div>
                      <p className="text-small text-charcoal font-medium">
                        {event.location}
                      </p>
                      {event.address && (
                        <p className="text-small text-mid">{event.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Event Type */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-hint mt-0.5" />
                    <div>
                      <p className="text-small text-charcoal font-medium">
                        {event.type}
                      </p>
                      <p className="text-small text-mid">
                        {event.isOnline ? 'Virtual Event' : 'In-Person Event'}
                      </p>
                    </div>
                  </div>

                  {/* Members Only */}
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-hint mt-0.5" />
                    <p className="text-small text-charcoal font-medium">
                      {event.isMembersOnly
                        ? 'Members Only'
                        : 'Open to Everyone'}
                    </p>
                  </div>
                </div>

                {/* RSVP Button */}
                {event.rsvpUrl && (
                  <a
                    href={event.rsvpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center mt-6 px-6 py-3 bg-accent text-white rounded-md font-label text-small tracking-label uppercase hover:bg-accent/90 transition-all"
                  >
                    RSVP Now
                  </a>
                )}

                {/* Sponsor */}
                {event.sponsor && (
                  <div className="mt-6 pt-6 border-t border-ivory-200">
                    <p className="font-label text-micro tracking-widest uppercase text-hint mb-1">
                      Sponsored By
                    </p>
                    <p className="text-small text-charcoal font-medium">
                      {event.sponsor.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
