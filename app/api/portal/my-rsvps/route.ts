import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, eventRsvps } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = (session?.user as { email?: string } | undefined)?.email?.toLowerCase()
  if (!email) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    await ensureEventsSchema()
    const rsvps = await db.select().from(eventRsvps).where(eq(eventRsvps.email, email))
    if (rsvps.length === 0) return NextResponse.json({ upcoming: [], past: [] })

    // Fetch events one-shot then join in memory — small volumes, one query.
    const eventIds = Array.from(new Set(rsvps.map((r) => r.eventId)))
    const eventRows = await db.select().from(events)
    const byId = new Map(eventRows.filter((e) => eventIds.includes(e.id)).map((e) => [e.id, e]))

    const now = Date.now()
    const enriched = rsvps
      .map((r) => {
        const e = byId.get(r.eventId)
        if (!e) return null
        return {
          rsvpId: r.id,
          seats: 1 + r.guests,
          paidAt: r.paidAt,
          paidAmount: r.paidAmount,
          paymentMethod: r.paymentMethod,
          payMode: r.payMode,
          event: {
            id: e.id,
            slug: e.slug,
            title: e.title,
            startAt: e.startAt,
            endAt: e.endAt,
            location: e.location,
            coverImageUrl: e.coverImageUrl,
            priceCents: e.priceCents,
            eventType: e.eventType,
          },
        }
      })
      .filter((x): x is NonNullable<typeof x> => !!x)

    const upcoming = enriched
      .filter((r) => new Date(r.event.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.event.startAt).getTime() - new Date(b.event.startAt).getTime())
    const past = enriched
      .filter((r) => new Date(r.event.startAt).getTime() < now)
      .sort((a, b) => new Date(b.event.startAt).getTime() - new Date(a.event.startAt).getTime())

    return NextResponse.json({ upcoming, past })
  } catch (e) {
    console.error('portal my-rsvps error:', e)
    return NextResponse.json({ upcoming: [], past: [] })
  }
}
