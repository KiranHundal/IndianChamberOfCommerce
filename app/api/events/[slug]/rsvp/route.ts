import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events, eventRsvps } from '@/lib/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  await ensureEventsSchema()
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
    const note = typeof body.note === 'string' ? body.note.trim() || null : null
    const guestsRaw = Number(body.guests)
    const guests = Number.isFinite(guestsRaw) ? Math.max(0, Math.min(10, Math.floor(guestsRaw))) : 0

    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const [event] = await db.select().from(events).where(and(eq(events.slug, params.slug), eq(events.published, true))).limit(1)
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    if (event.rsvpMode !== 'internal') {
      return NextResponse.json({ error: 'This event is not accepting online RSVPs.' }, { status: 400 })
    }

    if (event.capacity != null) {
      const [{ count }] = await db
        .select({ count: sql<number>`coalesce(sum(1 + guests), 0)` })
        .from(eventRsvps)
        .where(eq(eventRsvps.eventId, event.id))
      const seatsUsed = Number(count) || 0
      if (seatsUsed + 1 + guests > event.capacity) {
        return NextResponse.json({ error: 'This event is full.' }, { status: 409 })
      }
    }

    await db.insert(eventRsvps).values({
      id: crypto.randomUUID(),
      eventId: event.id,
      name,
      email,
      phone,
      guests,
      note,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to RSVP.'
    console.error('RSVP error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
