import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendTeamAccessEmail } from '@/lib/email'

const TARGET = { name: 'Gigi Sethi', email: 'gigisethi04@gmail.com' } as const

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

async function runSeed(invitedBy: string | null) {
  const email = TARGET.email.toLowerCase().trim()
  const now = new Date()
  const results: string[] = []

  const [existing] = await db.select().from(members).where(eq(members.email, email)).limit(1)

  if (existing) {
    if (existing.role === 'reviewer') {
      results.push(`skipped: ${existing.name} <${email}> is already reviewer`)
    } else if (existing.role === 'admin') {
      results.push(`skipped: ${existing.name} <${email}> is admin (left as admin)`)
    } else {
      await db
        .update(members)
        .set({ role: 'reviewer', status: 'approved', approvedAt: existing.approvedAt || now })
        .where(eq(members.id, existing.id))
      results.push(`updated: ${existing.name} <${email}> was ${existing.role} → reviewer`)
    }
    try {
      await sendTeamAccessEmail({ name: existing.name, email, role: 'reviewer', invitedBy })
      results.push(`sent: access email to ${email}`)
    } catch (err) {
      console.error('sendTeamAccessEmail failed for', email, err)
      results.push(`email FAILED for ${email}`)
    }
  } else {
    await db.insert(members).values({
      id: crypto.randomUUID(),
      email,
      passwordHash: '',
      name: TARGET.name,
      phone: null,
      businessName: null,
      city: null,
      sector: null,
      membershipTier: 'individual',
      status: 'approved',
      role: 'reviewer',
      membershipNumber: null,
      createdAt: now,
      approvedAt: now,
      paymentMethod: null,
      amountPaid: null,
      paymentReference: null,
      paymentDate: null,
    })
    results.push(`created: ${TARGET.name} <${email}> as reviewer`)
    try {
      await sendTeamAccessEmail({ name: TARGET.name, email, role: 'reviewer', invitedBy })
      results.push(`sent: access email to ${email}`)
    } catch (err) {
      console.error('sendTeamAccessEmail failed for', email, err)
      results.push(`email FAILED for ${email}`)
    }
  }

  return NextResponse.json({ success: true, results })
}

export async function POST() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  const u = (session.user || {}) as { name?: string; email?: string }
  return runSeed(u.name || u.email || null)
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  const u = (session.user || {}) as { name?: string; email?: string }
  return runSeed(u.name || u.email || null)
}
