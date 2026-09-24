import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses } from '@/lib/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { reason?: unknown } = {}
  try {
    body = await req.json()
  } catch {}
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!reason || reason.length < 3) {
    return NextResponse.json(
      { error: 'A deletion reason is required (at least 3 characters).' },
      { status: 400 }
    )
  }
  if (reason.length > 500) {
    return NextResponse.json(
      { error: 'Deletion reason is too long (max 500 characters).' },
      { status: 400 }
    )
  }

  const [existing] = await db.select().from(expenses).where(eq(expenses.id, params.id)).limit(1)
  if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  if (existing.deletedAt) {
    return NextResponse.json({ error: 'Expense already deleted.' }, { status: 400 })
  }

  const deletedBy = (session.user as { email?: string; name?: string })?.email
    || (session.user as { name?: string })?.name
    || 'unknown'

  await db
    .update(expenses)
    .set({
      deletedAt: new Date(),
      deletedBy,
      deletionReason: reason,
    })
    .where(eq(expenses.id, params.id))

  return NextResponse.json({ success: true, deletedBy, reason })
}
