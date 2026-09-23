import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { eq, inArray, or } from 'drizzle-orm'

const EMAILS_TO_DELETE: string[] = []
const MEMBERSHIP_NUMBERS_TO_DELETE = ['0006'] // duplicate Aishvinder brar (keep #0030)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-cleanup-test-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const emails = EMAILS_TO_DELETE.map((e) => e.toLowerCase())

  const conditions = []
  if (emails.length > 0) conditions.push(inArray(members.email, emails))
  if (MEMBERSHIP_NUMBERS_TO_DELETE.length > 0) {
    conditions.push(inArray(members.membershipNumber, MEMBERSHIP_NUMBERS_TO_DELETE))
  }
  if (conditions.length === 0) {
    return NextResponse.json({ success: true, message: 'Nothing configured to delete.', deleted: [] })
  }

  const whereClause = conditions.length === 1 ? conditions[0] : or(...conditions)

  const existing = await db
    .select({ id: members.id, email: members.email, name: members.name, membershipNumber: members.membershipNumber })
    .from(members)
    .where(whereClause)

  if (existing.length === 0) {
    return NextResponse.json({ success: true, message: 'No matching members found.', deleted: [] })
  }

  const memberIds = existing.map((m) => m.id)

  for (const id of memberIds) {
    await db.update(squarePayments).set({ matchedMemberId: null }).where(eq(squarePayments.matchedMemberId, id))
  }

  await db.delete(members).where(inArray(members.id, memberIds))

  return NextResponse.json({
    success: true,
    message: `Deleted ${existing.length} member(s).`,
    deleted: existing,
  })
}
