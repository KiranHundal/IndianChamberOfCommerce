import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { eventRsvps, squarePayments, members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import {
  fetchSquareOrder,
  fetchSquarePayment,
  resolvePaymentEmail,
  resolvePaymentName,
  sumProcessingFees,
} from '@/lib/square'
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
  const paymentStub = payload.data?.object?.payment
  if (!paymentStub?.id) return NextResponse.json({ ignored: true, reason: 'no payment id' })

  try {
    await ensureEventsSchema()

    // The webhook envelope is intentionally minimal — refetch the full
    // payment so we have processing fees, card details, refunds, etc.
    // Same shape sync uses, so the write below matches it byte for byte.
    const p = await fetchSquarePayment(paymentStub.id)
    if (!p) return NextResponse.json({ ignored: true, reason: 'payment fetch returned nothing' })

    // Event tag detection (same as sync).
    let eventId: string | null = null
    let eventRsvpId: string | null = null
    if (p.order_id) {
      const [rsvpByOrder] = await db.select().from(eventRsvps).where(eq(eventRsvps.squareOrderId, p.order_id)).limit(1)
      if (rsvpByOrder) {
        eventId = rsvpByOrder.eventId
        eventRsvpId = rsvpByOrder.id
      }
    }
    if (!eventRsvpId) {
      const noteBucket = [p.note || '']
      if (p.order_id) {
        const order = await fetchSquareOrder(p.order_id)
        if (order?.reference_id) noteBucket.push(order.reference_id)
        for (const t of order?.tenders || []) if (t.note) noteBucket.push(t.note)
      }
      for (const s of noteBucket) {
        const m = s.match(EVENT_NOTE)
        if (m) { eventId = m[1]; eventRsvpId = m[2]; break }
      }
    }
    const paymentKind: 'event' | 'membership' = eventRsvpId ? 'event' : 'membership'

    // Resolve buyer email + name — same helpers sync uses.
    const email = await resolvePaymentEmail(p)
    const name = await resolvePaymentName(p)
    const feeCents = sumProcessingFees(p)
    const totalCents = p.total_money?.amount ?? p.amount_money.amount
    const refundedCents = p.refunded_money?.amount ?? 0
    const paidAt = new Date(p.created_at)

    // Membership match — only when this isn't an event ticket.
    let matchedMemberId: string | null = null
    if (paymentKind === 'membership' && email) {
      const [m] = await db.select().from(members).where(eq(members.email, email)).limit(1)
      if (m) matchedMemberId = m.id
    }

    const [existing] = await db
      .select()
      .from(squarePayments)
      .where(eq(squarePayments.id, p.id))
      .limit(1)
    // Preserve an existing manual match — the Match button on /admin/finances
    // must never be silently reverted by a webhook.
    const preservedMatchedMemberId = existing?.matchedMemberId || matchedMemberId

    const row = {
      id: p.id,
      status: p.status,
      amountCents: totalCents,
      feeCents,
      refundedCents,
      buyerEmail: email,
      buyerName: name,
      receiptNumber: p.receipt_number || null,
      receiptUrl: p.receipt_url || null,
      orderId: p.order_id || null,
      cardBrand: p.card_details?.card?.card_brand || null,
      last4: p.card_details?.card?.last_4 || null,
      note: p.note || null,
      paidAt,
      syncedAt: new Date(),
      matchedMemberId: preservedMatchedMemberId,
      paymentKind,
      eventId,
      eventRsvpId,
    }
    if (existing) {
      await db.update(squarePayments).set(row).where(eq(squarePayments.id, p.id))
    } else {
      await db.insert(squarePayments).values(row)
    }

    // Enrich the matched member row with authoritative payment data —
    // this is what sync does, and now the webhook does too so a fresh
    // membership payment appears reconciled without a manual sync click.
    if (paymentKind === 'membership' && preservedMatchedMemberId && p.status === 'COMPLETED') {
      const [m] = await db.select().from(members).where(eq(members.id, preservedMatchedMemberId)).limit(1)
      if (m) {
        const dollars = Math.round((totalCents - refundedCents) / 100)
        await db.update(members).set({
          paymentMethod: 'square',
          amountPaid: dollars > 0 ? dollars : m.amountPaid,
          paymentDate: m.paymentDate || paidAt,
        }).where(eq(members.id, m.id))
      }
    }

    // Event side: mark the RSVP paid + send the deferred confirmation.
    if (eventRsvpId && p.status === 'COMPLETED') {
      const [rsvp] = await db.select().from(eventRsvps).where(eq(eventRsvps.id, eventRsvpId)).limit(1)
      if (rsvp) {
        const wasPaid = !!rsvp.paidAt
        await db.update(eventRsvps).set({
          paidAt: rsvp.paidAt || new Date(),
          paidAmount: totalCents - refundedCents,
          paymentMethod: 'square',
          paymentReference: p.id,
          squareOrderId: p.order_id || rsvp.squareOrderId,
        }).where(eq(eventRsvps.id, eventRsvpId))

        if (!wasPaid) {
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
    }

    return NextResponse.json({ success: true, kind: paymentKind, matched: !!preservedMatchedMemberId })
  } catch (e) {
    console.error('Square webhook error:', e)
    // 200 back to Square so it doesn't retry-loop against a transient
    // internal error; we log it and the manual sync remains a safety net.
    return NextResponse.json({ error: 'internal error' }, { status: 200 })
  }
}

// Square expects a 200 to any GET during the "test webhook" step of setup.
export async function GET() {
  return NextResponse.json({ ok: true })
}
