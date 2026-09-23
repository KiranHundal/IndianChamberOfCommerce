import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendTeamAccessEmail } from '@/lib/email'

// One-time seed: grants MODERATOR access to the four board members Kiran
// asked to give finances access to. Idempotent — running twice does not
// create duplicates or reset a role. If someone is already an admin, they
// are LEFT AS ADMIN; only 'member' (or missing) is promoted to moderator.
const TARGETS = [
  { name: 'Sonia Heer', email: 'sonniaheer@yahoo.com' },
  { name: 'Roken Bhatt', email: 'roken@bhattcpa.org' },
  { name: 'Surdeep Singh', email: 'dentist.singh95@gmail.com' },
  { name: 'Rajinder Kumar', email: 'rk.aususa@gmail.com' },
] as const

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

async function runSeed(invitedBy: string | null) {
  const results: string[] = []
  const now = new Date()

  async function trySendAccessEmail(name: string, email: string) {
    try {
      await sendTeamAccessEmail({ name, email, role: 'moderator', invitedBy })
      return true
    } catch (err) {
      console.error('sendTeamAccessEmail failed for', email, err)
      return false
    }
  }

  for (const t of TARGETS) {
    const email = t.email.toLowerCase().trim()

    // Resolve display name — prefer any matching board_members row, then the
    // hardcoded label.
    const [board] = await db.select().from(boardMembers).where(eq(boardMembers.email, email)).limit(1)
    const name = board?.name || t.name

    const [existing] = await db.select().from(members).where(eq(members.email, email)).limit(1)

    if (existing) {
      if (existing.role === 'admin') {
        results.push(`skipped: ${name} <${email}> is already admin (left as admin)`)
        continue
      }
      if (existing.role === 'moderator') {
        const sent = await trySendAccessEmail(existing.name, email)
        results.push(`skipped: ${name} <${email}> already moderator${sent ? ' · access email re-sent' : ''}`)
        continue
      }
      await db
        .update(members)
        .set({ role: 'moderator', status: 'approved', approvedAt: existing.approvedAt || now })
        .where(eq(members.id, existing.id))
      const sent = await trySendAccessEmail(existing.name, email)
      results.push(`promoted: ${name} <${email}> → moderator${sent ? ' · access email sent' : ' · email FAILED'}`)
      continue
    }

    // No member row yet — create one with role=moderator.
    await db.insert(members).values({
      id: crypto.randomUUID(),
      email,
      passwordHash: '',
      name,
      phone: null,
      businessName: null,
      city: null,
      sector: null,
      membershipTier: 'individual',
      status: 'approved',
      role: 'moderator',
      membershipNumber: null,
      createdAt: now,
      approvedAt: now,
      paymentMethod: null,
      amountPaid: null,
      paymentReference: null,
      paymentDate: null,
    })
    const sent = await trySendAccessEmail(name, email)
    results.push(`created: ${name} <${email}> as moderator${sent ? ' · access email sent' : ' · email FAILED'}`)
  }

  return NextResponse.json({ success: true, results })
}

export async function POST() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runSeed((session.user as { name?: string; email?: string })?.name || (session.user as { email?: string })?.email || null)
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runSeed((session.user as { name?: string; email?: string })?.name || (session.user as { email?: string })?.email || null)
}
