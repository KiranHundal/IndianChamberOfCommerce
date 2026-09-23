import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Confirmed matches: site membership number ← Square payment buyer email
const MATCHES: Array<{ membershipNumber: string; squareBuyerEmail: string }> = [
  { membershipNumber: '0011', squareBuyerEmail: 'ankushjassi.germany@gmail.com' },
  { membershipNumber: '0016', squareBuyerEmail: 'malhotra.ohcpl@gmail.com' },
  { membershipNumber: '0003', squareBuyerEmail: 'jjimenez@thepmlounge.com' },
  { membershipNumber: '0031', squareBuyerEmail: 'manraj.ghuman1999@gmail.com' },
  { membershipNumber: '0002', squareBuyerEmail: 'philliptaylorbrown0@gmail.com' },
  { membershipNumber: '0042', squareBuyerEmail: 'harinder.s.sandhu@bofa.com' },
  { membershipNumber: '0005', squareBuyerEmail: 'spsidhu@yahoo.com' },
  { membershipNumber: '0012', squareBuyerEmail: 'sharnjit_07@yahoo.com' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-cleanup-link-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ membershipNumber: string; email: string; status: string; detail?: string }> = []

  for (const m of MATCHES) {
    const email = m.squareBuyerEmail.toLowerCase()

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.membershipNumber, m.membershipNumber))
      .limit(1)
    if (!member) {
      results.push({ membershipNumber: m.membershipNumber, email, status: 'skipped', detail: 'Member not found' })
      continue
    }

    const [payment] = await db
      .select()
      .from(squarePayments)
      .where(eq(squarePayments.buyerEmail, email))
      .limit(1)
    if (!payment) {
      results.push({ membershipNumber: m.membershipNumber, email, status: 'skipped', detail: 'Square payment not found' })
      continue
    }

    if (payment.matchedMemberId && payment.matchedMemberId !== member.id) {
      results.push({
        membershipNumber: m.membershipNumber,
        email,
        status: 'skipped',
        detail: `Payment already linked to a different member (${payment.matchedMemberId})`,
      })
      continue
    }

    // Link the Square payment to the member
    await db.update(squarePayments).set({ matchedMemberId: member.id }).where(eq(squarePayments.id, payment.id))

    // Update the member with the real Square amount + receipt reference
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
      email,
      status: 'linked',
      detail: `${member.name} ← $${dollars} · Receipt #${payment.receiptNumber || payment.id.slice(0, 8)}`,
    })
  }

  const linked = results.filter((r) => r.status === 'linked').length
  const skipped = results.filter((r) => r.status === 'skipped').length

  return NextResponse.json({
    success: true,
    message: `Linked ${linked} orphan payment(s) to members. ${skipped} skipped.`,
    results,
  })
}
