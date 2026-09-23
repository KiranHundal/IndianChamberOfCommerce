import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { inArray } from 'drizzle-orm'

// Members that are Approved but have no verified payment (no Square receipt
// and no offline method logged). Move them back to Pending until payment
// can be confirmed.
const MEMBERSHIP_NUMBERS = ['0027', '0038', '0026', '0018', '0029']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-cleanup-pending-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await db
    .select({
      id: members.id,
      membershipNumber: members.membershipNumber,
      name: members.name,
      status: members.status,
    })
    .from(members)
    .where(inArray(members.membershipNumber, MEMBERSHIP_NUMBERS))

  const idsToUpdate = existing.map((m) => m.id)
  if (idsToUpdate.length > 0) {
    await db.update(members).set({ status: 'pending' }).where(inArray(members.id, idsToUpdate))
  }

  return NextResponse.json({
    success: true,
    updated: existing.length,
    members: existing.map((m) => ({
      membershipNumber: m.membershipNumber,
      name: m.name,
      previousStatus: m.status,
      newStatus: 'pending',
    })),
  })
}
