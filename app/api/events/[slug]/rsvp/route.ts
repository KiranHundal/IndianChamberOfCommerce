import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events, eventRsvps } from '@/lib/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import { sendEventRsvpConfirmationEmail, sendEventRsvpAdminNotificationEmail } from '@/lib/email'

const ADMIN_FALLBACK = 'info@indianchamberofcommerce.org'

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

    // Seat check happens BEFORE the insert so we don't oversell. Sum
    // includes each RSVP's own seat (1) plus its guests.
    const [{ seats: seatsUsed }] = await db
      .select({ seats: sql<number>`coalesce(sum(1 + guests), 0)` })
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, event.id))
    if (event.capacity != null) {
      if ((Number(seatsUsed) || 0) + 1 + guests > event.capacity) {
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

    // Recount after insert for the admin notification (running totals).
    const [{ rsvpCount }] = await db
      .select({ rsvpCount: sql<number>`count(*)` })
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, event.id))
    const totalRsvps = Number(rsvpCount) || 0
    const totalSeats = (Number(seatsUsed) || 0) + 1 + guests

    // Emails are fire-and-forget from the visitor's perspective — we
    // don't want a Resend hiccup to fail their RSVP after the row is in.
    const eventPayload = {
      slug: event.slug,
      title: event.title,
      location: event.location,
      address: event.address,
      startAt: new Date(event.startAt),
      endAt: event.endAt ? new Date(event.endAt) : null,
      priceCents: event.priceCents,
    }
    try {
      await sendEventRsvpConfirmationEmail({ to: email, name, guests, event: eventPayload })
    } catch (e) {
      console.error('RSVP confirmation email failed:', e)
    }
    try {
      await sendEventRsvpAdminNotificationEmail({
        to: event.notifyEmail || ADMIN_FALLBACK,
        attendeeName: name,
        attendeeEmail: email,
        attendeePhone: phone,
        guests,
        note,
        event: { title: event.title, startAt: eventPayload.startAt, priceCents: event.priceCents, slug: event.slug },
        totalRsvps,
        totalSeats,
        capacity: event.capacity,
      })
    } catch (e) {
      console.error('RSVP admin notification email failed:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to RSVP.'
    console.error('RSVP error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
