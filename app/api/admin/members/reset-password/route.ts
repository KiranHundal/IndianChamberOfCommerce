import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

/**
 * Clears a member's passwordHash so they can go back to /register and set
 * a new one. Used when a member locks themselves out by typo'ing during
 * initial registration — we don't have a public "forgot password" flow
 * yet, so admin unblocks them here.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown> | undefined)?.role
  if (!session?.user || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await req.json().catch(() => ({}))
  if (!memberId) {
    return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  await db
    .update(members)
    .set({ passwordHash: '' })
    .where(eq(members.id, memberId))

  return NextResponse.json({
    success: true,
    name: member.name,
    email: member.email,
  })
}
