import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { or, eq } from 'drizzle-orm'
import { sendTeamUpdateEmail } from '@/lib/email'

/**
 * One-click "Send Team Update" blast. Admin only. Iterates every row with
 * role admin / moderator / reviewer and sends them the role-specific
 * what's-new email from lib/team-update-emails.ts.
 *
 * Returns a per-recipient results array so the admin UI can show which
 * ones went out and which failed. Emails are sent sequentially (small
 * roster: ~10 recipients max) to keep Resend throughput sane and surface
 * failures individually.
 *
 * Safety:
 *   - Admin-only guard
 *   - Rows with placeholder emails (@noemail.cvicc.org) are skipped —
 *     Resend would reject the domain anyway
 *   - Deactivated staff rows are skipped
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string; email?: string; name?: string } | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const team = await db
    .select()
    .from(members)
    .where(or(eq(members.role, 'admin'), eq(members.role, 'moderator'), eq(members.role, 'reviewer')))

  type Result = {
    name: string
    email: string
    role: string
    status: 'sent' | 'failed' | 'skipped'
    reason?: string
  }
  const results: Result[] = []

  for (const m of team) {
    if (m.status === 'deactivated') {
      results.push({ name: m.name, email: m.email, role: m.role, status: 'skipped', reason: 'deactivated' })
      continue
    }
    if (!m.email || m.email.toLowerCase().endsWith('@noemail.cvicc.org')) {
      results.push({ name: m.name, email: m.email, role: m.role, status: 'skipped', reason: 'placeholder email' })
      continue
    }
    try {
      await sendTeamUpdateEmail({
        name: m.name,
        email: m.email,
        role: m.role as 'admin' | 'moderator' | 'reviewer',
      })
      results.push({ name: m.name, email: m.email, role: m.role, status: 'sent' })
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Failed to send'
      console.error(`sendTeamUpdateEmail failed for ${m.email}:`, err)
      results.push({ name: m.name, email: m.email, role: m.role, status: 'failed', reason })
    }
  }

  const sent = results.filter((r) => r.status === 'sent').length
  const failed = results.filter((r) => r.status === 'failed').length
  const skipped = results.filter((r) => r.status === 'skipped').length

  return NextResponse.json({
    success: true,
    sent,
    failed,
    skipped,
    total: results.length,
    results,
  })
}

/**
 * Preview: who would receive what. Lets the admin confirm the recipient
 * list before clicking Send. No emails sent.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const team = await db
    .select({
      name: members.name,
      email: members.email,
      role: members.role,
      status: members.status,
    })
    .from(members)
    .where(or(eq(members.role, 'admin'), eq(members.role, 'moderator'), eq(members.role, 'reviewer')))

  const recipients = team.map((m) => ({
    name: m.name,
    email: m.email,
    role: m.role,
    willReceive:
      m.status === 'deactivated'
        ? 'skipped (deactivated)'
        : m.email.toLowerCase().endsWith('@noemail.cvicc.org')
          ? 'skipped (placeholder email)'
          : 'will send',
  }))

  return NextResponse.json({ recipients })
}
