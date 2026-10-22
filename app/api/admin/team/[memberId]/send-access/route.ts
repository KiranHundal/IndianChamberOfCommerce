import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendTeamAccessEmail } from '@/lib/email'

/**
 * Admin-only: resend the team-access welcome email to a staff account.
 * Walks the recipient through /register where they choose their own
 * password — admin never handles the plaintext.
 *
 * Safe to run on anyone with role admin/moderator/reviewer, whether or
 * not they've set a password yet. If they have, the /register link
 * returns a friendly "already have an account, please sign in" message.
 */
export async function POST(_req: NextRequest, { params }: { params: { memberId: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [target] = await db.select().from(members).where(eq(members.id, params.memberId)).limit(1)
  if (!target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (target.role !== 'admin' && target.role !== 'moderator' && target.role !== 'reviewer') {
    return NextResponse.json(
      { error: `${target.name} is not on the team (role: ${target.role}). Grant access first.` },
      { status: 400 },
    )
  }

  if (!target.email || target.email.endsWith('@noemail.cvicc.org')) {
    return NextResponse.json(
      { error: `${target.name} has no real email on file. Edit their row first.` },
      { status: 400 },
    )
  }

  const invitedBy = (user.name as string | undefined) || (user.email as string | undefined) || null

  try {
    await sendTeamAccessEmail({
      name: target.name,
      email: target.email,
      role: target.role as 'admin' | 'moderator' | 'reviewer',
      invitedBy,
    })
  } catch (err) {
    console.error('send-access email failed for', target.email, err)
    const message = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    email: target.email,
    role: target.role,
    alreadyHasPassword: !!target.passwordHash,
  })
}
