import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { isNotNull, sql } from 'drizzle-orm'

/**
 * TEMPORARY: wipe every members.referred_by value.
 *
 * Kiran's seed distributed 60/10/random referrers for testing the
 * chart. Now that the field is going live and Gigi will fill it in for
 * real, we need to nuke those made-up values so the chart shows only
 * what people actually pick — not the earlier random split.
 *
 * Admin-only. Idempotent — running twice is a no-op after the first.
 * Delete this endpoint once the real data is populated.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

async function runClear() {
  const before = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(isNotNull(members.referredBy))
  const cleared = Number(before[0]?.count ?? 0)

  await db.update(members).set({ referredBy: null })

  return NextResponse.json({
    success: true,
    cleared,
    message: `Wiped referred_by on ${cleared} members. Every row is now blank; Gigi (or the join form) can fill it in.`,
  })
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runClear()
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runClear()
}
