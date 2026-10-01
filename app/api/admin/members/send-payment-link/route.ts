import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendMembershipPaymentLinkEmail } from '@/lib/email'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown> | undefined)?.role
  if (!session?.user || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await req.json()
  if (!memberId) {
    return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }
  if (member.status !== 'pending') {
    return NextResponse.json({ error: 'Payment link is only for pending members.' }, { status: 400 })
  }

  // Look up the referring board member's email so we can CC them on the
  // payment link — gives the referrer visibility that the handoff
  // happened and lets them follow up with their contact directly.
  let referrerEmail: string | null = null
  if (member.referredBy) {
    const [referrer] = await db
      .select({ email: boardMembers.email })
      .from(boardMembers)
      .where(eq(boardMembers.id, member.referredBy))
      .limit(1)
    if (referrer?.email) referrerEmail = referrer.email
  }

  try {
    await sendMembershipPaymentLinkEmail({
      name: member.name,
      email: member.email,
      membershipTier: member.membershipTier,
      cc: referrerEmail,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const now = new Date()
  await db.update(members).set({ paymentLinkSentAt: now }).where(eq(members.id, memberId))

  return NextResponse.json({ success: true, sentAt: now.toISOString() })
}
