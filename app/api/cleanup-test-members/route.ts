import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'
import { eq, inArray } from 'drizzle-orm'

const EMAILS_TO_DELETE = [
  'surdeeptest123@gmail.com',
  'surdeep17@gmail.com',
  'ssurdeep@gmail.com',
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-cleanup-test-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const emails = EMAILS_TO_DELETE.map((e) => e.toLowerCase())

  const existing = await db
    .select({ id: members.id, email: members.email, name: members.name, membershipNumber: members.membershipNumber })
    .from(members)
    .where(inArray(members.email, emails))

  if (existing.length === 0) {
    return NextResponse.json({ success: true, message: 'No matching members found.', deleted: [] })
  }

  const memberIds = existing.map((m) => m.id)

  // Unlink any Square payments that referenced these members so those payments
  // return to the orphan bucket rather than pointing to a non-existent id.
  for (const id of memberIds) {
    await db.update(squarePayments).set({ matchedMemberId: null }).where(eq(squarePayments.matchedMemberId, id))
  }

  await db.delete(members).where(inArray(members.email, emails))

  return NextResponse.json({
    success: true,
    message: `Deleted ${existing.length} member(s).`,
    deleted: existing,
  })
}
