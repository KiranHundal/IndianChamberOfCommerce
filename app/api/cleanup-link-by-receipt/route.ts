import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { eq, isNotNull, and } from 'drizzle-orm'

/**
 * Force-relink phantoms: any member with paymentMethod='square' + a stored
 * receipt reference gets their Square payment re-pointed to them. If the
 * payment was linked to a wrong member during a re-sync (buyer email
 * matched someone else), we correct it here — the receipt stored on the
 * member's record is the source of truth, since it was set by an earlier
 * manual Confirm Match.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-cleanup-receipt-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{
    membershipNumber: string | null
    name: string
    receipt: string
    status: string
    previouslyLinkedTo?: string | null
    detail?: string
  }> = []

  const candidates = await db
    .select()
    .from(members)
    .where(and(eq(members.paymentMethod, 'square'), isNotNull(members.paymentReference)))

  for (const member of candidates) {
    const ref = member.paymentReference?.trim() || ''
    const receiptMatch = ref.match(/Receipt\s*#?\s*([A-Za-z0-9]+)/i)
    const receipt = receiptMatch ? receiptMatch[1] : ''
    if (!receipt) continue

    const [payment] = await db
      .select()
      .from(squarePayments)
      .where(eq(squarePayments.receiptNumber, receipt))
      .limit(1)
    if (!payment) {
      results.push({
        membershipNumber: member.membershipNumber,
        name: member.name,
        receipt,
        status: 'skipped',
        detail: 'No Square payment with that receipt found',
      })
      continue
    }

    if (payment.matchedMemberId === member.id) {
      results.push({
        membershipNumber: member.membershipNumber,
        name: member.name,
        receipt,
        status: 'already-linked',
      })
      continue
    }

    const previousLink = payment.matchedMemberId
    let previousName: string | null = null
    if (previousLink) {
      const [prev] = await db.select({ name: members.name }).from(members).where(eq(members.id, previousLink)).limit(1)
      previousName = prev?.name || null
    }

    // Force-relink to the receipt-owning member
    await db.update(squarePayments).set({ matchedMemberId: member.id }).where(eq(squarePayments.id, payment.id))

    const dollars = Math.round((payment.amountCents - payment.refundedCents) / 100)
    await db
      .update(members)
      .set({
        amountPaid: dollars > 0 ? dollars : member.amountPaid,
        paymentDate: payment.paidAt,
      })
      .where(eq(members.id, member.id))

    results.push({
      membershipNumber: member.membershipNumber,
      name: member.name,
      receipt,
      status: 'relinked',
      previouslyLinkedTo: previousName || previousLink,
      detail: `Receipt #${receipt} ← $${dollars}`,
    })
  }

  return NextResponse.json({
    success: true,
    total: results.length,
    relinked: results.filter((r) => r.status === 'relinked').length,
    alreadyLinked: results.filter((r) => r.status === 'already-linked').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    results,
  })
}
