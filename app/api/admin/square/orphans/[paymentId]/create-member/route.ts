import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { desc, eq, isNotNull } from 'drizzle-orm'
import { sendMemberApprovedEmail } from '@/lib/email'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

async function getNextMembershipNumber(): Promise<string> {
  const [latest] = await db
    .select({ membershipNumber: members.membershipNumber })
    .from(members)
    .where(isNotNull(members.membershipNumber))
    .orderBy(desc(members.membershipNumber))
    .limit(1
  )
  const lastNum = latest?.membershipNumber ? parseInt(latest.membershipNumber, 10) : 0
  return String(lastNum + 1).padStart(4, '0')
}

export async function POST(_req: NextRequest, { params }: { params: { paymentId: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [payment] = await db
    .select()
    .from(squarePayments)
    .where(eq(squarePayments.id, params.paymentId))
    .limit(1)

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (payment.matchedMemberId) {
    return NextResponse.json({ error: 'Payment is already linked to a member.' }, { status: 400 })
  }

  const email = payment.buyerEmail?.toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: 'Square payment has no buyer email — cannot invite.' }, { status: 400 })
  }
  const name = payment.buyerName?.trim() || email.split('@')[0]

  // If a member with this email already exists (edge case), just link and email.
  const [existing] = await db.select().from(members).where(eq(members.email, email)).limit(1)

  const amountDollars = Math.round((payment.amountCents - payment.refundedCents) / 100)
  const tier = amountDollars >= 300 ? 'corporate' : 'individual'
  const now = new Date()

  let memberId = existing?.id
  let membershipNumber = existing?.membershipNumber

  if (existing) {
    // Attach the Square payment to the existing member and enrich their record
    memberId = existing.id
    if (!membershipNumber) {
      membershipNumber = await getNextMembershipNumber()
    }
    await db
      .update(members)
      .set({
        status: 'approved',
        approvedAt: existing.approvedAt || now,
        membershipNumber,
        paymentMethod: 'square',
        amountPaid: amountDollars > 0 ? amountDollars : existing.amountPaid,
        paymentDate: existing.paymentDate || payment.paidAt,
        paymentReference: existing.paymentReference || (payment.receiptNumber ? `Receipt #${payment.receiptNumber}` : null),
      })
      .where(eq(members.id, existing.id))
  } else {
    memberId = crypto.randomUUID()
    membershipNumber = await getNextMembershipNumber()
    await db.insert(members).values({
      id: memberId,
      email,
      passwordHash: '',
      name,
      phone: null,
      businessName: null,
      city: null,
      sector: null,
      membershipTier: tier,
      status: 'approved',
      role: 'member',
      membershipNumber,
      createdAt: now,
      approvedAt: now,
      paymentMethod: 'square',
      amountPaid: amountDollars,
      paymentReference: payment.receiptNumber ? `Receipt #${payment.receiptNumber}` : null,
      paymentDate: payment.paidAt,
    })
  }

  // Link the payment
  await db.update(squarePayments).set({ matchedMemberId: memberId }).where(eq(squarePayments.id, params.paymentId))

  // Send invite (welcome email with membership # + /register link)
  let emailStatus: 'sent' | 'failed' = 'sent'
  try {
    await sendMemberApprovedEmail({
      name,
      email,
      membershipTier: existing?.membershipTier || tier,
      membershipNumber: membershipNumber!,
    })
  } catch (err) {
    console.error('Orphan invite email error:', err)
    emailStatus = 'failed'
  }

  return NextResponse.json({
    success: true,
    memberId,
    membershipNumber,
    email,
    name,
    amount: amountDollars,
    tier: existing?.membershipTier || tier,
    emailStatus,
    linkedExisting: !!existing,
  })
}
