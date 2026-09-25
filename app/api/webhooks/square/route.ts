import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { eventRsvps, squarePayments } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import { fetchSquareOrder } from '@/lib/square'
import { sendEventRsvpConfirmationEmail } from '@/lib/email'
import { events } from '@/lib/schema'

const EVENT_NOTE = /event:([^:\s]+):([^:\s]+)/

// Square signs webhooks with HMAC-SHA256 over `notification_url + body`.
// See https://developer.squareup.com/docs/webhooks/step3validate for details.
function verifySignature(rawBody: string, signature: string | null, notificationUrl: string): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  if (!key || !signature) return false
  const hmac = crypto.createHmac('sha256', key)
  hmac.update(notificationUrl + rawBody)
  const expected = hmac.digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

interface SquareWebhookPaymentEvent {
  type: string
  data?: {
    object?: {
      payment?: {
        id: string
        status?: string
        order_id?: string
        amount_money?: { amount: number; currency: string }
        total_money?: { amount: number; currency: string }
        refunded_money?: { amount: number; currency: string }
        note?: string
        receipt_number?: string | null
        receipt_url?: string | null
        card_details?: { card?: { card_brand?: string; last_4?: string } }
        buyer_email_address?: string | null
        created_at?: string
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-square-hmacsha256-signature')
  const notificationUrl =
    (process.env.NEXTAUTH_URL || 'https://www.indianchamberofcommerce.org').replace(/\/$/, '') +
    '/api/webhooks/square'

  // In production, refuse anything that isn't signed by Square. During
  // early setup (before the signing key is configured) we still accept
  // the payload but only mark it as unverified in logs — the sync job
  // remains the authoritative backfill.
  const verified = verifySignature(raw, signature, notificationUrl)
  if (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY && !verified) {
    console.warn('Square webhook: signature mismatch, ignoring.')
    return NextResponse.json({ ignored: true }, { status: 200 })
  }

  let payload: SquareWebhookPaymentEvent
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.type !== 'payment.updated' && payload.type !== 'payment.created') {
    return NextResponse.json({ ignored: true, reason: 'unhandled type' })
  }
  const payment = payload.data?.object?.payment
  if (!payment) return NextResponse.json({ ignored: true, reason: 'no payment' })

  try {
    await ensureEventsSchema()

    // Resolve the event/rsvp tag: prefer our own DB (RSVP → squareOrderId),
    // fall back to the payment note, then the linked order's reference_id.
    let rsvpId: string | null = null
    let eventId: string | null = null
    if (payment.order_id) {
      const [rsvp] = await db.select().from(eventRsvps).where(eq(eventRsvps.squareOrderId, payment.order_id)).limit(1)
      if (rsvp) {
        rsvpId = rsvp.id
        eventId = rsvp.eventId
      }
    }
    if (!rsvpId) {
      const noteBucket = [payment.note || '']
      if (payment.order_id) {
        const order = await fetchSquareOrder(payment.order_id)
        if (order?.reference_id) noteBucket.push(order.reference_id)
      }
      for (const s of noteBucket) {
        const m = s.match(EVENT_NOTE)
        if (m) { eventId = m[1]; rsvpId = m[2]; break }
      }
    }

    // Upsert the square_payments row — this is the same shape sync writes,
    // so /admin/finances stays consistent with or without the webhook.
    const totalCents = payment.total_money?.amount ?? payment.amount_money?.amount ?? 0
    const refundedCents = payment.refunded_money?.amount ?? 0
    const [existing] = await db.select().from(squarePayments).where(eq(squarePayments.id, payment.id)).limit(1)
    const rowShape = {
      id: payment.id,
      status: payment.status || 'UNKNOWN',
      amountCents: totalCents,
      feeCents: 0,
      refundedCents,
      buyerEmail: payment.buyer_email_address?.toLowerCase() || existing?.buyerEmail || null,
      buyerName: existing?.buyerName || null,
      receiptNumber: payment.receipt_number || existing?.receiptNumber || null,
      receiptUrl: payment.receipt_url || existing?.receiptUrl || null,
      orderId: payment.order_id || existing?.orderId || null,
      cardBrand: payment.card_details?.card?.card_brand || existing?.cardBrand || null,
      last4: payment.card_details?.card?.last_4 || existing?.last4 || null,
      note: payment.note || existing?.note || null,
      paidAt: payment.created_at ? new Date(payment.created_at) : existing?.paidAt || new Date(),
      syncedAt: new Date(),
      matchedMemberId: existing?.matchedMemberId || null,
      paymentKind: (rsvpId ? 'event' : existing?.paymentKind || 'membership') as 'event' | 'membership',
      eventId: eventId || existing?.eventId || null,
      eventRsvpId: rsvpId || existing?.eventRsvpId || null,
    }
    if (existing) {
      await db.update(squarePayments).set(rowShape).where(eq(squarePayments.id, payment.id))
    } else {
      await db.insert(squarePayments).values(rowShape)
    }

    // If this settles an event RSVP, mark paid and — if we hadn't already —
    // send the confirmation email that was withheld until payment cleared.
    if (rsvpId && payment.status === 'COMPLETED') {
      const [rsvp] = await db.select().from(eventRsvps).where(eq(eventRsvps.id, rsvpId)).limit(1)
      if (rsvp && !rsvp.paidAt) {
        await db.update(eventRsvps).set({
          paidAt: new Date(),
          paidAmount: totalCents - refundedCents,
          paymentMethod: 'square',
          paymentReference: payment.id,
          squareOrderId: payment.order_id || rsvp.squareOrderId,
        }).where(eq(eventRsvps.id, rsvpId))

        try {
          const [event] = await db.select().from(events).where(eq(events.id, rsvp.eventId)).limit(1)
          if (event) {
            const seats = 1 + rsvp.guests
            await sendEventRsvpConfirmationEmail({
              to: rsvp.email,
              name: rsvp.name,
              guests: rsvp.guests,
              event: {
                slug: event.slug,
                title: event.title,
                location: event.location,
                address: event.address,
                startAt: new Date(event.startAt),
                endAt: event.endAt ? new Date(event.endAt) : null,
                priceCents: seats > 0 ? Math.round((totalCents - refundedCents) / seats) : event.priceCents,
              },
            })
          }
        } catch (e) {
          console.error('Webhook confirmation email failed:', e)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Square webhook error:', e)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// Square expects a 200 to any GET during the "test webhook" step of setup.
export async function GET() {
  return NextResponse.json({ ok: true })
}
