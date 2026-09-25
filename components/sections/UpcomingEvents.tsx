import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar } from 'lucide-react'
import { db } from '@/lib/db'
import { events } from '@/lib/schema'
import { and, eq, gte, asc } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

function formatMonthDay(d: Date) {
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate().toString(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function priceLabel(cents: number | null): string | null {
  if (cents == null) return null
  if (cents === 0) return 'Complimentary'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`
}

export default async function UpcomingEvents() {
  await ensureEventsSchema()
  const now = new Date()
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.published, true), gte(events.startAt, now)))
    .orderBy(asc(events.startAt))
    .limit(4)

  // No events? Section still shows an elegant, on-brand message so the
  // page doesn't look broken during quiet weeks. Better restraint than
  // hiding a whole section.
  if (rows.length === 0) {
    return (
      <section className="bg-page-alt py-24">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <AnimatedSection><SectionLabel>Programs</SectionLabel></AnimatedSection>
          <AnimatedSection delay={1}><SectionTitle className="mt-4">The season ahead</SectionTitle></AnimatedSection>
          <AnimatedSection delay={2}><Divider className="mx-auto mt-6" /></AnimatedSection>
          <AnimatedSection delay={3}>
            <p className="text-body text-mid mt-8 max-w-xl mx-auto leading-relaxed">
              Our next season of galas, mixers, and executive roundtables is being finalized. Join our list to receive an invitation before public announcement.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-8 font-label text-label tracking-label uppercase text-accent hover:text-gold-900 transition-colors"
            >
              Request Invitations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    )
  }

  const [featured, ...rest] = rows

  return (
    <section className="bg-page-alt py-24">
      <div className="max-w-6xl mx-auto px-8">
        <div className="text-center mb-16">
          <AnimatedSection><SectionLabel>Programs</SectionLabel></AnimatedSection>
          <AnimatedSection delay={1}><SectionTitle className="mt-4">The season ahead</SectionTitle></AnimatedSection>
          <AnimatedSection delay={2}><Divider className="mx-auto mt-6" /></AnimatedSection>
        </div>

        {/* Featured — editorial half-image, half-typography layout.
            Cover image gets air on the left; the title breathes on the
            right in the display serif. One quiet gold CTA. */}
        <AnimatedSection delay={3}>
          <FeaturedEvent event={featured} />
        </AnimatedSection>

        {rest.length > 0 && (
          <div className="mt-20">
            <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-ivory-200">
              <p className="font-label text-[0.65rem] tracking-widest uppercase text-brand/60">
                Also this season
              </p>
              <Link
                href="/events"
                className="font-label text-[0.65rem] tracking-widest uppercase text-accent hover:text-gold-900 inline-flex items-center gap-1.5"
              >
                All events <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
              {rest.slice(0, 3).map((ev, i) => (
                <AnimatedSection key={ev.id} delay={i + 4}>
                  <MiniEvent event={ev} />
                </AnimatedSection>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function FeaturedEvent({ event }: { event: typeof events.$inferSelect }) {
  const start = new Date(event.startAt)
  const { month, day, weekday, time } = formatMonthDay(start)
  const price = priceLabel(event.priceCents)
  const cta =
    event.rsvpMode === 'external' && event.rsvpUrl
      ? { href: event.rsvpUrl, label: 'Reserve your seat', external: true }
      : event.rsvpMode === 'internal'
      ? { href: `/events/${event.slug}#rsvp`, label: 'Reserve your seat', external: false }
      : { href: `/events/${event.slug}`, label: 'View invitation', external: false }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
      {/* Image side */}
      <div className="lg:col-span-7 relative">
        <Link href={`/events/${event.slug}`} className="block relative aspect-[4/3] lg:aspect-[3/2] overflow-hidden bg-navy-100 group">
          {event.coverImageUrl ? (
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              unoptimized
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-navy-900">
              <Calendar className="w-16 h-16 text-gold-400/30" />
            </div>
          )}
          {/* Corner date plate — restrained, editorial */}
          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-5 py-3 flex items-baseline gap-2">
            <span className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">{month}</span>
            <span className="font-display text-3xl text-brand leading-none">{day}</span>
          </div>
        </Link>
      </div>

      {/* Typography side */}
      <div className="lg:col-span-5">
        <p className="font-label text-[0.65rem] tracking-widest uppercase text-accent">
          {event.eventType} · {weekday}
        </p>
        <h3 className="font-display text-3xl md:text-4xl text-brand mt-3 leading-tight">
          <Link href={`/events/${event.slug}`} className="hover:text-navy-800 transition-colors">
            {event.title}
          </Link>
        </h3>
        {event.description && (
          <p className="text-body text-mid mt-4 leading-relaxed line-clamp-3">
            {event.description}
          </p>
        )}

        <div className="mt-6 space-y-1 text-small text-mid">
          <p>{start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {time}</p>
          {event.location && <p>{event.location}</p>}
        </div>

        {/* Restrained meta chips — kept minimal and quiet */}
        {(event.membersOnly || price) && (
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-ivory-200/70 font-label text-[0.6rem] tracking-widest uppercase text-brand/60">
            {event.membersOnly && <span>Members Only</span>}
            {event.membersOnly && price && <span className="text-brand/30">·</span>}
            {price && <span>{price}</span>}
          </div>
        )}

        <div className="mt-8">
          {cta.external ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 pb-1 border-b border-accent text-accent hover:text-gold-900 hover:border-gold-900 font-label text-label tracking-label uppercase transition-colors"
            >
              {cta.label} <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 pb-1 border-b border-accent text-accent hover:text-gold-900 hover:border-gold-900 font-label text-label tracking-label uppercase transition-colors"
            >
              {cta.label} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniEvent({ event }: { event: typeof events.$inferSelect }) {
  const start = new Date(event.startAt)
  const { month, day, time } = formatMonthDay(start)

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <div className="flex items-baseline gap-4 pb-1 border-b border-transparent group-hover:border-gold-600/40 transition-colors">
        <span className="font-label text-[0.6rem] tracking-widest uppercase text-accent whitespace-nowrap">{month} {day}</span>
        <span className="font-label text-[0.6rem] tracking-widest uppercase text-brand/40">{time}</span>
      </div>
      <h4 className="font-display text-h5 text-brand mt-3 leading-snug group-hover:text-navy-800 transition-colors">
        {event.title}
      </h4>
      {event.location && (
        <p className="text-small text-mid mt-1">{event.location}</p>
      )}
      <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/50 mt-3">
        {event.eventType}
      </p>
    </Link>
  )
}
