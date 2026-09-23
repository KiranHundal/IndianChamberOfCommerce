import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, squarePayments, squareSync } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import {
  fetchAllSquarePayments,
  resolvePaymentEmail,
  resolvePaymentName,
  sumProcessingFees,
} from '@/lib/square'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
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
    const payments = await fetchAllSquarePayments()

    // Load all members once for email lookup
    const allMembers = await db.select().from(members)
    const membersByEmail = new Map<string, typeof allMembers[number]>()
    for (const m of allMembers) {
      membersByEmail.set(m.email.toLowerCase(), m)
    }

    let newCount = 0
    let updatedCount = 0
    let completedCount = 0
    let matchedCount = 0
    let unmatchedCount = 0
    let nonCompletedCount = 0

    for (const p of payments) {
      const email = await resolvePaymentEmail(p)
      const name = await resolvePaymentName(p)
      const feeCents = sumProcessingFees(p)
      const totalCents = p.total_money?.amount ?? p.amount_money.amount
      const refundedCents = p.refunded_money?.amount ?? 0
      const paidAt = new Date(p.created_at)

      const matched = email ? membersByEmail.get(email) : undefined

      const [existing] = await db
        .select({ id: squarePayments.id, matchedMemberId: squarePayments.matchedMemberId })
        .from(squarePayments)
        .where(eq(squarePayments.id, p.id))
        .limit(1)

      // Preserve any existing manual match — sync should never un-link a
      // payment that was linked by the Match button.
      const preservedMatchedMemberId = existing?.matchedMemberId || matched?.id || null

      // Only tally match/orphan against COMPLETED payments — the finances
      // table also filters to COMPLETED, so the numbers line up.
      if (p.status === 'COMPLETED') {
        completedCount++
        if (preservedMatchedMemberId) matchedCount++
        else unmatchedCount++
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

