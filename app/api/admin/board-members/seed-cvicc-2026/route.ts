import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// One-time seed: adds the seven current CVICC board members with the emails
// Kiran shared, so they show up on /admin/team → Grant Access from Board.
// Idempotent — running twice does not duplicate rows; existing rows get
// their email backfilled if it was blank.
const SEED = [
  { name: 'Akash Singhal', role: 'Board Member', email: 'akashsingel@gmail.com' },
  { name: 'Rajinder Kumar', role: 'Board Member', email: 'rk.aususa@gmail.com' },
  { name: 'Manreet Singh Sandhu', role: 'Board Member', email: 'manreet.singh.sandhu@gmail.com' },
  { name: 'Sonia Heer', role: 'Board Member', email: 'sonniaheer@yahoo.com' },
  { name: 'Roken Bhatt', role: 'Treasurer / CPA', email: 'roken@bhattcpa.org' },
  { name: 'Surdeep Singh', role: 'Board Member', email: 'dentist.singh95@gmail.com' },
  { name: 'R. Sidhu Buttar', role: 'Board Member', email: 'rsidhu.buttar@gmail.com' },
] as const

async function runSeed() {
  const existing = await db.select().from(boardMembers)
  const byEmail = new Map(existing.filter((b) => b.email).map((b) => [b.email!.toLowerCase(), b]))
  const byName = new Map(existing.map((b) => [b.name.toLowerCase().trim(), b]))

  const now = new Date()
  const highestOrder = existing.reduce((m, b) => Math.max(m, b.displayOrder), 0)
  let order = highestOrder

  const results: string[] = []
  for (const row of SEED) {
    const emailKey = row.email.toLowerCase()
    const nameKey = row.name.toLowerCase().trim()
    const match = byEmail.get(emailKey) || byName.get(nameKey)
    if (match) {
      if (!match.email) {
        await db.update(boardMembers).set({ email: row.email }).where(eq(boardMembers.id, match.id))
        results.push(`updated: ${row.name} → email set to ${row.email}`)
      } else if (match.email.toLowerCase() !== emailKey) {
        results.push(`skipped: ${row.name} already has different email ${match.email}`)
      } else {
        results.push(`skipped: ${row.name} already up to date`)
      }
      continue
    }
    order += 10
    await db.insert(boardMembers).values({
      id: crypto.randomUUID(),
      name: row.name,
      role: row.role,
      bio: null,
      photoUrl: null,
      email: row.email,
      displayOrder: order,
      createdAt: now,
      welcomeEmailSentAt: null,
    })
    results.push(`added: ${row.name} <${row.email}>`)
  }

  return NextResponse.json({ success: true, results })
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runSeed()
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runSeed()
}
