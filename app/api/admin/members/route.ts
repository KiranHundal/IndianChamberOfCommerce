import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq, desc, isNotNull } from 'drizzle-orm'
import { sendMemberApprovedEmail } from '@/lib/email'

async function getNextMembershipNumber(): Promise<string> {
  const [latest] = await db
    .select({ membershipNumber: members.membershipNumber })
    .from(members)
    .where(isNotNull(members.membershipNumber))
    .orderBy(desc(members.membershipNumber))
    .limit(1)

  const lastNum = latest?.membershipNumber ? parseInt(latest.membershipNumber, 10) : 0
  return String(lastNum + 1).padStart(4, '0')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as Record<string, unknown>).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allMembers = await db.select().from(members)
  return NextResponse.json({ members: allMembers })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as Record<string, unknown>).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId, action } = await req.json()

  if (!memberId || !action) {
    return NextResponse.json({ error: 'Missing memberId or action' }, { status: 400 })
  }

  if (action === 'approve') {
    const membershipNumber = await getNextMembershipNumber()

    await db.update(members).set({
      status: 'approved',
      approvedAt: new Date(),
      membershipNumber,
    }).where(eq(members.id, memberId))

    const [approved] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
    if (approved) {
      try {
        await sendMemberApprovedEmail({
          name: approved.name,
          email: approved.email,
          membershipTier: approved.membershipTier,
          membershipNumber,
        })
      } catch (emailError) {
        console.error('Approval email error:', emailError)
      }
    }

    return NextResponse.json({ success: true, message: `Member approved. Membership #${membershipNumber}` })
  }

  if (action === 'reject') {
    await db.update(members).set({ status: 'rejected' }).where(eq(members.id, memberId))
    return NextResponse.json({ success: true, message: 'Member rejected.' })
  }

  if (action === 'deactivate') {
    await db.update(members).set({ status: 'deactivated', deactivatedAt: new Date() }).where(eq(members.id, memberId))
    return NextResponse.json({ success: true, message: 'Member deactivated.' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
