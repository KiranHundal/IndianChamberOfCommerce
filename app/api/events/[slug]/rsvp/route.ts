import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events, eventRsvps } from '@/lib/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import { sendEventRsvpConfirmationEmail, sendEventRsvpAdminNotificationEmail } from '@/lib/email'
import { createEventCheckoutLink } from '@/lib/square'

const ADMIN_FALLBACK = 'info@indianchamberofcommerce.org'
const DOOR_SURCHARGE_CENTS = 500

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await ensureEventsSchema()
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
    const note = typeof body.note === 'string' ? body.note.trim() || null : null
    const guestsRaw = Number(body.guests)
    const guests = Number.isFinite(guestsRaw) ? Math.max(0, Math.min(10, Math.floor(guestsRaw))) : 0
    const payModeIn = typeof body.payMode === 'string' ? body.payMode : 'none'

    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const [event] = await db.select().from(events).where(and(eq(events.slug, params.slug), eq(events.published, true))).limit(1)
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    if (event.rsvpMode !== 'internal') {
      return NextResponse.json({ error: 'This event is not accepting online RSVPs.' }, { status: 400 })
    }

    // Resolve the pay mode against what the event actually supports.
    // Free events always land in "none"; paid events honor the visitor's
    // choice of online or at-door.
    const isPaid = (event.priceCents ?? 0) > 0
    let payMode: 'online' | 'door' | 'none' = 'none'
    if (isPaid) payMode = payModeIn === 'door' ? 'door' : 'online'

    const [{ seats: seatsUsed }] = await db
      .select({ seats: sql<number>`coalesce(sum(1 + guests), 0)` })
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, event.id))
    if (event.capacity != null) {
      if ((Number(seatsUsed) || 0) + 1 + guests > event.capacity) {
        return NextResponse.json({ error: 'This event is full.' }, { status: 409 })
      }
    }

    const rsvpId = crypto.randomUUID()
    await db.insert(eventRsvps).values({
      id: rsvpId,
      eventId: event.id,
      name,
      email,
      phone,
      guests,
      note,
      payMode,
      createdAt: new Date(),
    })

    // If they chose online payment, spin up a Square Checkout Link and
    // return its URL — the client redirects there. If Square is unhealthy
    // we still keep the RSVP row so nothing is lost.
    let paymentUrl: string | null = null
    if (payMode === 'online' && isPaid) {
      const seats = 1 + guests
      const total = (event.priceCents ?? 0) * seats
      const siteUrl = process.env.NEXTAUTH_URL || 'https://www.indianchamberofcommerce.org'
      const redirect = `${siteUrl}/events/${event.slug}/paid?rsvpId=${rsvpId}`
      try {
        const link = await createEventCheckoutLink({
          name: `${event.title} — ${name}${seats > 1 ? ` (+${guests})` : ''}`,
          amountCents: total,
          buyerEmail: email,
          eventId: event.id,
          rsvpId,
          redirectUrl: redirect,
        })
        paymentUrl = link.url
        await db.update(eventRsvps).set({
          squareCheckoutId: link.id,
          squareOrderId: link.order_id || null,
        }).where(eq(eventRsvps.id, rsvpId))
      } catch (e) {
        console.error('Square checkout link failed:', e)
        // Fall through — the RSVP is in, admin will follow up.
      }
    }

    // Running totals for the admin notification email.
    const [{ rsvpCount }] = await db
      .select({ rsvpCount: sql<number>`count(*)` })
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, event.id))
    const totalRsvps = Number(rsvpCount) || 0
    const totalSeats = (Number(seatsUsed) || 0) + 1 + guests

    // Confirmation email skipped when we're about to redirect to Square —
    // the RSVP will be confirmed after payment succeeds. For pay-at-door
    // and free events, send now.
    if (!paymentUrl) {
      const eventPayload = {
        slug: event.slug,
        title: event.title,
        location: event.location,
        address: event.address,
        startAt: new Date(event.startAt),
        endAt: event.endAt ? new Date(event.endAt) : null,
        priceCents: payMode === 'door' ? (event.priceCents ?? 0) + DOOR_SURCHARGE_CENTS : event.priceCents,
      }
      try {
        await sendEventRsvpConfirmationEmail({ to: email, name, guests, event: eventPayload })
      } catch (e) {
        console.error('RSVP confirmation email failed:', e)
      }
    }

    try {
      await sendEventRsvpAdminNotificationEmail({
        to: event.notifyEmail || ADMIN_FALLBACK,
        attendeeName: name,
        attendeeEmail: email,
        attendeePhone: phone,
        guests,
        note: note ? `${note}${payMode !== 'none' ? `\n\nPay mode: ${payMode}` : ''}` : payMode !== 'none' ? `Pay mode: ${payMode}` : null,
        event: {
          title: event.title,
          startAt: new Date(event.startAt),
          priceCents: payMode === 'door' ? (event.priceCents ?? 0) + DOOR_SURCHARGE_CENTS : event.priceCents,
          slug: event.slug,
        },
        totalRsvps,
        totalSeats,
        capacity: event.capacity,
      })
    } catch (e) {
      console.error('RSVP admin notification email failed:', e)
    }

    return NextResponse.json({ success: true, paymentUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to RSVP.'
    console.error('RSVP error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
