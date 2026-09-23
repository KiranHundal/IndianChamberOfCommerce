import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { eq, isNotNull, isNull, and } from 'drizzle-orm'

/**
 * Auto-relink phantom records: any member whose paymentReference already
 * contains a Square receipt number (from a prior manual match) but whose
 * Square payment lost its matchedMemberId link (usually from a re-sync).
 * We look up their Square payment by the receipt number embedded in the
 * member's paymentReference field and re-link it.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-cleanup-receipt-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ membershipNumber: string | null; name: string; status: string; detail?: string }> = []

  // Phantom members: paymentMethod='square' AND paymentReference is not null.
  // We'll check which ones aren't currently linked to a Square payment.
  const candidates = await db
    .select()
    .from(members)
    .where(and(eq(members.paymentMethod, 'square'), isNotNull(members.paymentReference)))

  // Load orphan Square payments (matchedMemberId is null)
  const orphanPayments = await db.select().from(squarePayments).where(isNull(squarePayments.matchedMemberId))

  for (const member of candidates) {
    const ref = member.paymentReference?.trim() || ''
    if (!ref) continue

    // paymentReference is typically "Receipt #abcd" — extract the receipt part.
    const receiptMatch = ref.match(/Receipt\s*#?\s*([A-Za-z0-9]+)/i)
    const receipt = receiptMatch ? receiptMatch[1] : ref.replace(/[^A-Za-z0-9]/g, '')
    if (!receipt) continue

    const payment = orphanPayments.find((p) => p.receiptNumber === receipt)
    if (!payment) continue

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
      status: 'linked',
      detail: `Receipt #${receipt} ← $${dollars}`,
    })
  }

  return NextResponse.json({ success: true, linked: results.length, results })
}
