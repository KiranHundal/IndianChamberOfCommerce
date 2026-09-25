import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, squarePayments, squareSync, eventRsvps } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import {
  fetchAllSquarePayments,
  resolvePaymentEmail,
  resolvePaymentName,
  sumProcessingFees,
  fetchSquareOrder,
} from '@/lib/square'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

// Payment notes on event checkout links look like `event:<eventId>:<rsvpId>`.
// We embed them on the checkout link's payment_note; the order's fulfillment
// text also carries the same string in case Square drops the note on
// downstream payments.
const EVENT_NOTE = /event:([^:\s]+):([^:\s]+)/

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

export const maxDuration = 60

export async function POST() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const runId = crypto.randomUUID()
  const startedAt = new Date()

  await db.insert(squareSync).values({
    id: runId,
    startedAt,
    status: 'running',
    triggeredBy: session.user?.email || null,
  })

  try {
    await ensureEventsSchema()
    const payments = await fetchAllSquarePayments()

    // Load all members once for email lookup
    const allMembers = await db.select().from(members)
    const membersByEmail = new Map<string, typeof allMembers[number]>()
    for (const m of allMembers) {
      membersByEmail.set(m.email.toLowerCase(), m)
    }

    // Same trick for RSVPs — we consult this map before deciding a Square
    // payment is a membership payment.
    const allRsvps = await db.select().from(eventRsvps)
    const rsvpsByOrderId = new Map<string, typeof allRsvps[number]>()
    const rsvpsById = new Map<string, typeof allRsvps[number]>()
    for (const r of allRsvps) {
      if (r.squareOrderId) rsvpsByOrderId.set(r.squareOrderId, r)
      rsvpsById.set(r.id, r)
    }

    let newCount = 0
    let updatedCount = 0
    let completedCount = 0
    let matchedCount = 0
    let unmatchedCount = 0
    let nonCompletedCount = 0

    let eventTaggedCount = 0

    for (const p of payments) {
      const email = await resolvePaymentEmail(p)
      const name = await resolvePaymentName(p)
      const feeCents = sumProcessingFees(p)
      const totalCents = p.total_money?.amount ?? p.amount_money.amount
      const refundedCents = p.refunded_money?.amount ?? 0
      const paidAt = new Date(p.created_at)

      // Event tag detection — the checkout link put `event:<eventId>:<rsvpId>`
      // in the payment note. On resale/refund the note can drop off, so
      // also check the linked order's fulfillment text and reference_id,
      // plus our own by-order-id RSVP index for a hard link.
      let eventId: string | null = null
      let eventRsvpId: string | null = null
      const noteBucket: string[] = [p.note || '']
      if (p.order_id) {
        const rsvpByOrder = rsvpsByOrderId.get(p.order_id)
        if (rsvpByOrder) {
          eventId = rsvpByOrder.eventId
          eventRsvpId = rsvpByOrder.id
        } else {
          const order = await fetchSquareOrder(p.order_id)
          if (order?.reference_id) noteBucket.push(order.reference_id)
          for (const t of order?.tenders || []) if (t.note) noteBucket.push(t.note)
        }
      }
      if (!eventRsvpId) {
        for (const s of noteBucket) {
          const m = s.match(EVENT_NOTE)
          if (m) { eventId = m[1]; eventRsvpId = m[2]; break }
        }
      }

      const paymentKind: 'event' | 'membership' = eventRsvpId ? 'event' : 'membership'

      // Membership matching only runs when this isn't an event payment —
      // an event ticket buyer might also happen to be a member, and we'd
      // wrongly credit their ticket toward their dues.
      const matched = paymentKind === 'membership' && email ? membersByEmail.get(email) : undefined

      const [existing] = await db
        .select({ id: squarePayments.id, matchedMemberId: squarePayments.matchedMemberId })
        .from(squarePayments)
        .where(eq(squarePayments.id, p.id))
        .limit(1)

      const preservedMatchedMemberId = existing?.matchedMemberId || matched?.id || null

      if (p.status === 'COMPLETED') {
        completedCount++
        if (paymentKind === 'event') {
          eventTaggedCount++
        } else if (preservedMatchedMemberId) {
          matchedCount++
        } else {
          unmatchedCount++
        }
      } else {
        nonCompletedCount++
      }

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
        updatedCount++
      } else {
        await db.insert(squarePayments).values(row)
        newCount++
      }

      // Enrich matched member with actual amount/fee/method if we have better data
      if (matched && p.status === 'COMPLETED') {
        const dollars = Math.round((totalCents - refundedCents) / 100)
        await db
          .update(members)
          .set({
            paymentMethod: 'square',
            amountPaid: dollars > 0 ? dollars : matched.amountPaid,
            paymentDate: matched.paymentDate || paidAt,
          })
          .where(eq(members.id, matched.id))
      }

      // Reconcile the RSVP — mark paid with the definitive amount from
      // Square. Happens for BOTH new inserts (webhook or direct visit
      // race) and updates (backfill after the redirect path already set
      // paidAt with an approximate amount).
      if (eventRsvpId && p.status === 'COMPLETED') {
        const netCents = totalCents - refundedCents
        const rsvp = rsvpsById.get(eventRsvpId)
        if (rsvp) {
          await db.update(eventRsvps).set({
            paidAt: rsvp.paidAt || paidAt,
            paidAmount: netCents,
            paymentMethod: 'square',
            paymentReference: p.id,
            squareOrderId: p.order_id || rsvp.squareOrderId,
          }).where(eq(eventRsvps.id, eventRsvpId))
        }
      }
    }

    await db
      .update(squareSync)
      .set({
        finishedAt: new Date(),
        status: 'success',
        paymentCount: payments.length,
        newCount,
        updatedCount,
        matchedCount,
        unmatchedCount,
      })
      .where(eq(squareSync.id, runId))

    return NextResponse.json({
      success: true,
      runId,
      paymentCount: payments.length,
      completedCount,
      nonCompletedCount,
      newCount,
      updatedCount,
      matchedCount,
      unmatchedCount,
      eventTaggedCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    console.error('Square sync error:', error)
    await db
      .update(squareSync)
      .set({
        finishedAt: new Date(),
        status: 'error',
        errorMessage: message,
      })
      .where(eq(squareSync.id, runId))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [lastRun] = await db.select().from(squareSync).orderBy(desc(squareSync.startedAt)).limit(1)
  return NextResponse.json({ lastRun: lastRun || null })
}

