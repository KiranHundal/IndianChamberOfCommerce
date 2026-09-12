import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendBoardMemberWelcomeEmail } from '@/lib/email'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [member] = await db.select().from(boardMembers).where(eq(boardMembers.id, params.id)).limit(1)
  if (!member) {
    return NextResponse.json({ error: 'Board member not found.' }, { status: 404 })
  }
  if (!member.email) {
    return NextResponse.json({ error: 'No email on file for this board member. Add one first.' }, { status: 400 })
  }

  try {
    await sendBoardMemberWelcomeEmail({ name: member.name, email: member.email, role: member.role })
    await db.update(boardMembers).set({ welcomeEmailSentAt: new Date() }).where(eq(boardMembers.id, member.id))
    return NextResponse.json({ success: true, message: `Welcome email sent to ${member.email}.` })
  } catch (error) {
    console.error('Board member welcome resend error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send email.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
