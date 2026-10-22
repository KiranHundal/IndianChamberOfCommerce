import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { seedChamberBatchV1 } from '@/lib/seed-chamber-batch'

/**
 * Admin-triggered bulk import of the 54-member Sept-Oct 2026 founding
 * cohort collected offline (Zelle, check, cash, and the chamber's
 * website Square page) by board members Sonia Heer, Dr. Surdeep Singh,
 * Akash Singhal, and Rajinder Kumar.
 *
 * The underlying function is idempotent — INSERT OR IGNORE on email
 * UNIQUE + deterministic seed ids. Hitting this endpoint twice is a
 * no-op after the first successful run, and the response still shows
 * the full report so admin can grep for members with placeholder
 * emails or notes to fix.
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown> | undefined)?.role
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Admin only.' }, { status: 403 })
  }

  try {
    const report = await seedChamberBatchV1()
    return NextResponse.json(report)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Seed failed.'
    console.error('seed-chamber-batch error:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
