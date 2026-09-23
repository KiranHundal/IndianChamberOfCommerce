import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Link phantom records (method=square + receipt stored but no linked Square payment)
// by looking up the Square payment by its receipt number.
const MATCHES: Array<{ membershipNumber: string; receiptNumber: string }> = [
  { membershipNumber: '0006', receiptNumber: 'nBX6' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-cleanup-receipt-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ membershipNumber: string; receipt: string; status: string; detail?: string }> = []

  for (const m of MATCHES) {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.membershipNumber, m.membershipNumber))
      .limit(1)
    if (!member) {
      results.push({ membershipNumber: m.membershipNumber, receipt: m.receiptNumber, status: 'skipped', detail: 'Member not found' })
      continue
    }

    const [payment] = await db
      .select()
      .from(squarePayments)
      .where(eq(squarePayments.receiptNumber, m.receiptNumber))
      .limit(1)
    if (!payment) {
      results.push({ membershipNumber: m.membershipNumber, receipt: m.receiptNumber, status: 'skipped', detail: 'Square payment not found' })
      continue
    }

    if (payment.matchedMemberId === member.id) {
      results.push({ membershipNumber: m.membershipNumber, receipt: m.receiptNumber, status: 'already-linked' })
      continue
    }

    // Link the Square payment to the member
    await db.update(squarePayments).set({ matchedMemberId: member.id }).where(eq(squarePayments.id, payment.id))

    const dollars = Math.round((payment.amountCents - payment.refundedCents) / 100)
    await db
      .update(members)
      .set({
        paymentMethod: 'square',
        amountPaid: dollars > 0 ? dollars : member.amountPaid,
        paymentDate: payment.paidAt,
        paymentReference: payment.receiptNumber ? `Receipt #${payment.receiptNumber}` : member.paymentReference,
      })
      .where(eq(members.id, member.id))

    results.push({
      membershipNumber: m.membershipNumber,
      receipt: m.receiptNumber,
      status: 'linked',
      detail: `${member.name} ← $${dollars}`,
    })
  }

  return NextResponse.json({ success: true, results })
}
