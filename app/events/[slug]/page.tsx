import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { events } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import Badge from '@/components/ui/Badge'
import RsvpForm from './RsvpForm'

export const dynamic = 'force-dynamic'

async function getEvent(slug: string) {
  await ensureEventsSchema()
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.published, true)))
    .limit(1)
  return row || null
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const ev = await getEvent(params.slug)
  if (!ev) return { title: 'Event not found' }
  return {
    title: ev.title,
    description: ev.description?.slice(0, 155) || `${ev.eventType} event on ${new Date(ev.startAt).toLocaleDateString()}.`,
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const ev = await getEvent(params.slug)
  if (!ev) notFound()

  const start = new Date(ev.startAt)
  const end = ev.endAt ? new Date(ev.endAt) : null
  const isPast = start.getTime() < Date.now()

  return (
    <>
      <section className="relative bg-navy-900 text-white">
        {ev.coverImageUrl && (
          <div className="absolute inset-0 opacity-30">
            <Image src={ev.coverImageUrl} alt="" fill className="object-cover" unoptimized priority />
          </div>
        )}
        <div className="relative max-w-[75rem] mx-auto px-8 py-24 md:py-32">
          <Link href="/events" className="text-gold-400 text-sm hover:underline">← All events</Link>
          <div className="flex flex-wrap gap-2 mt-6">
            <Badge variant="gold">{ev.eventType}</Badge>
            {isPast && <Badge variant="outline">Past Event</Badge>}
            {ev.membersOnly && <Badge variant="navy">Members Only</Badge>}
          </div>
          <h1 className="font-display text-4xl md:text-5xl mt-4">{ev.title}</h1>
          <div className="mt-6 space-y-2 text-sm md:text-base text-white/90">
            <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gold-400" />{formatDate(start)}</p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400" />
              {formatTime(start)}{end ? ` – ${formatTime(end)}` : ''}
            </p>
            {ev.location && (
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gold-400" />
                {ev.location}{ev.address ? ` · ${ev.address}` : ''}
              </p>
            )}
            {ev.capacity && (
              <p className="flex items-center gap-2 text-white/70"><Users className="w-4 h-4 text-gold-400" />Capacity: {ev.capacity}</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-page-bg py-16">
        <div className="max-w-[52rem] mx-auto px-8">
          {ev.description ? (
            <div className="prose prose-lg text-charcoal whitespace-pre-wrap">{ev.description}</div>
          ) : (
            <p className="text-mid italic">Details coming soon.</p>
          )}

          {!isPast && (
            <div id="rsvp" className="mt-12 pt-8 border-t border-ivory-200">
              {ev.rsvpMode === 'external' && ev.rsvpUrl && (
                <div className="text-center">
                  <h2 className="font-display text-2xl text-brand mb-3">Ready to attend?</h2>
                  <p className="text-mid mb-6">RSVPs are handled on our partner page.</p>
                  <a
                    href={ev.rsvpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 bg-accent text-white rounded-md font-label text-sm tracking-label uppercase hover:bg-accent/90 transition-all"
                  >
                    RSVP now
                  </a>
                </div>
              )}
              {ev.rsvpMode === 'internal' && (
                <RsvpForm slug={ev.slug} title={ev.title} />
              )}
              {ev.rsvpMode === 'none' && (
                <p className="text-mid text-center">Questions? <Link href="/contact" className="text-accent hover:underline">Reach out</Link>.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
