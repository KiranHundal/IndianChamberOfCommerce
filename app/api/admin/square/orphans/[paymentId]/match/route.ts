import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

export async function POST(req: NextRequest, { params }: { params: { paymentId: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await req.json()
  if (!memberId) {
    return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  }

  const [payment] = await db
    .select()
    .from(squarePayments)
    .where(eq(squarePayments.id, params.paymentId))
    .limit(1)
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Link the payment to the member
  await db.update(squarePayments).set({ matchedMemberId: memberId }).where(eq(squarePayments.id, params.paymentId))

  // Update the member's payment info to reflect the real Square payment
  const dollars = Math.round((payment.amountCents - payment.refundedCents) / 100)
  await db
    .update(members)
    .set({
      paymentMethod: 'square',
      amountPaid: dollars > 0 ? dollars : member.amountPaid,
      paymentDate: payment.paidAt,
      paymentReference: payment.receiptNumber ? `Receipt #${payment.receiptNumber}` : member.paymentReference,
    })
    .where(eq(members.id, memberId))

  return NextResponse.json({ success: true, matchedMemberName: member.name, amount: dollars })
}
