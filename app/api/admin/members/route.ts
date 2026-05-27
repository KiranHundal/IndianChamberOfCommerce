import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendMemberApprovedEmail } from '@/lib/email'

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
    const activationToken = crypto.randomUUID()

    await db.update(members).set({
      status: 'approved',
      approvedAt: new Date(),
      activationToken,
    }).where(eq(members.id, memberId))

    const [approved] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
    if (approved) {
      try {
        await sendMemberApprovedEmail({
          name: approved.name,
          email: approved.email,
          membershipTier: approved.membershipTier,
          activationToken,
        })
      } catch (emailError) {
        console.error('Approval email error:', emailError)
      }
    }

    return NextResponse.json({ success: true, message: 'Member approved.' })
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
