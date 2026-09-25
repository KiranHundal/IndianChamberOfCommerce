import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { and, eq, isNotNull } from 'drizzle-orm'
import { ensureMembersRenewalSchema } from '@/lib/ensure-members-schema'
import { sendRenewalReminderEmail } from '@/lib/email'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

// Window: reminders go out for anyone expiring within the next 30 days
// OR up to 14 days past due. The 21-day cooldown means a single admin
// click in that window sends ~2 reminders per renewal cycle (once around
// 30d out, once around 7d out).
const DAYS_AHEAD = 30
const DAYS_PAST = 14
const COOLDOWN_DAYS = 21
const DAY_MS = 24 * 60 * 60 * 1000

export async function POST() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureMembersRenewalSchema()

  const rows = await db
    .select()
    .from(members)
    .where(and(eq(members.status, 'approved'), isNotNull(members.expiresAt)))

  const now = Date.now()
  let sent = 0
  let skippedCooldown = 0
  let skippedOutOfWindow = 0
  const errors: Array<{ email: string; error: string }> = []

  for (const m of rows) {
    if (!m.expiresAt) { skippedOutOfWindow++; continue }
    const expiresMs = new Date(m.expiresAt).getTime()
    const daysLeft = Math.round((expiresMs - now) / DAY_MS)
    if (daysLeft > DAYS_AHEAD || daysLeft < -DAYS_PAST) { skippedOutOfWindow++; continue }
    if (m.renewalReminderSentAt) {
      const lastSentMs = new Date(m.renewalReminderSentAt).getTime()
      if (now - lastSentMs < COOLDOWN_DAYS * DAY_MS) { skippedCooldown++; continue }
    }

    try {
      await sendRenewalReminderEmail({
        to: m.email,
        name: m.name,
        membershipTier: m.membershipTier,
        expiresAt: new Date(m.expiresAt),
        daysLeft,
      })
      await db.update(members).set({ renewalReminderSentAt: new Date() }).where(eq(members.id, m.id))
      sent++
    } catch (e) {
      errors.push({ email: m.email, error: e instanceof Error ? e.message : 'unknown' })
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    skippedCooldown,
    skippedOutOfWindow,
    errors,
    windowDaysAhead: DAYS_AHEAD,
    windowDaysPast: DAYS_PAST,
  })
}
