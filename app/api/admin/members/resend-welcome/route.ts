import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendMemberApprovedEmail } from '@/lib/email'

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
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (member.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved members can receive the welcome email.' }, { status: 400 })
  }
  if (!member.membershipNumber) {
    return NextResponse.json({ error: 'Member is missing a membership number.' }, { status: 400 })
  }

  try {
    await sendMemberApprovedEmail({
      name: member.name,
      email: member.email,
      membershipTier: member.membershipTier,
      membershipNumber: member.membershipNumber,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ success: true, sentTo: member.email })
}
