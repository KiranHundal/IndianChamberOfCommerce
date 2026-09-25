import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin } from 'lucide-react'
import { db } from '@/lib/db'
import { events } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import Badge from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Explore upcoming and past CVICC events including galas, networking mixers, workshops, and seminars for Indian-American business professionals in the Central Valley.',
}

export const dynamic = 'force-dynamic'

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default async function EventsPage() {
  await ensureEventsSchema()
  const rows = await db.select().from(events).where(eq(events.published, true))
  const now = Date.now()
  const upcoming = rows
    .filter((r) => new Date(r.startAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  const past = rows
    .filter((r) => new Date(r.startAt).getTime() < now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 6)

  return (
    <>
      <section className="bg-navy-900 py-32 text-center">
        <div className="max-w-[75rem] mx-auto px-8">
          <SectionLabel dark>What&apos;s Happening</SectionLabel>
          <SectionTitle dark className="mt-4">Events &amp; Programs</SectionTitle>
        </div>
      </section>

      <section className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8 text-center">
          <SectionLabel>Coming Up</SectionLabel>
          <SectionTitle className="mt-4">Upcoming Events</SectionTitle>
          <Divider className="mx-auto mt-6" />

          {upcoming.length === 0 ? (
            <p className="text-mid mt-12">
              No upcoming events at the moment — check back soon, or{' '}
              <Link href="/contact" className="text-accent hover:underline">get in touch</Link>{' '}
              to be notified.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              {upcoming.map((ev) => (
                <EventCard key={ev.id} ev={ev} />
              ))}
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="bg-page-alt py-24">
          <div className="max-w-[75rem] mx-auto px-8 text-center">
            <SectionLabel>Looking Back</SectionLabel>
            <SectionTitle className="mt-4">Past Events</SectionTitle>
            <Divider className="mx-auto mt-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              {past.map((ev) => <EventCard key={ev.id} ev={ev} isPast />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

function EventCard({ ev, isPast = false }: {
  ev: typeof events.$inferSelect
  isPast?: boolean
}) {
  const start = new Date(ev.startAt)
  return (
    <div className={`bg-white border border-ivory-200 rounded-lg overflow-hidden shadow-card hover:shadow-hover transition-all text-left ${isPast ? 'opacity-90' : ''}`}>
      <div className="relative bg-navy-100 h-48">
        {ev.coverImageUrl ? (
          <Image src={ev.coverImageUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Calendar className="text-brand/30 w-16 h-16" /></div>
        )}
      </div>
      <div className="p-6">
        <p className="font-label text-micro tracking-widest uppercase text-brand/70">
          {formatDate(start)} · {formatTime(start)}
        </p>
        <h3 className="font-display text-h4 text-brand mt-2">{ev.title}</h3>
        {ev.location && (
          <p className="text-small text-mid mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4" />{ev.location}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="navy">{ev.eventType}</Badge>
          {isPast && <Badge variant="outline">Past Event</Badge>}
          {ev.membersOnly && <Badge variant="gold">Members Only</Badge>}
          {ev.priceCents != null && (
            <Badge variant="outline">
              {ev.priceCents === 0 ? 'Free' : `$${(ev.priceCents / 100).toLocaleString('en-US', { minimumFractionDigits: ev.priceCents % 100 === 0 ? 0 : 2 })}`}
            </Badge>
          )}
        </div>
        {ev.description && (
          <p className="text-small text-mid mt-3 line-clamp-2">{ev.description}</p>
        )}
        <div className="flex justify-between items-center mt-4">
          <Link href={`/events/${ev.slug}`} className="text-accent text-small hover:underline">
            Learn More &rarr;
          </Link>
          {!isPast && ev.rsvpMode === 'external' && ev.rsvpUrl && (
            <a
              href={ev.rsvpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-accent text-white rounded-md font-label text-micro tracking-label uppercase hover:bg-accent/90 transition-all"
            >
              RSVP
            </a>
          )}
          {!isPast && ev.rsvpMode === 'internal' && (
            <Link
              href={`/events/${ev.slug}#rsvp`}
              className="inline-block px-4 py-2 bg-accent text-white rounded-md font-label text-micro tracking-label uppercase hover:bg-accent/90 transition-all"
            >
              RSVP
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
