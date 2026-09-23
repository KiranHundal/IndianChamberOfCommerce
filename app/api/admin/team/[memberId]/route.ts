import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return { session, email: (user.email as string) || null }
}

// PATCH: change role between admin ↔ moderator
export async function PATCH(req: NextRequest, { params }: { params: { memberId: string } }) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role } = await req.json()
  if (role !== 'admin' && role !== 'moderator') {
    return NextResponse.json({ error: 'role must be "admin" or "moderator"' }, { status: 400 })
  }

  const [target] = await db.select().from(members).where(eq(members.id, params.memberId)).limit(1)
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  await db.update(members).set({ role }).where(eq(members.id, params.memberId))
  return NextResponse.json({ success: true, memberId: params.memberId, role })
}

// DELETE: revoke access → role reverts to 'member'
export async function DELETE(_req: NextRequest, { params }: { params: { memberId: string } }) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [target] = await db.select().from(members).where(eq(members.id, params.memberId)).limit(1)
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Guard: can't revoke yourself
  if (ctx.email && target.email.toLowerCase() === ctx.email.toLowerCase()) {
    return NextResponse.json({ error: "You can't revoke your own access." }, { status: 400 })
  }

  // Guard: don't leave the org with zero admins
  if (target.role === 'admin') {
    const otherAdmins = await db.select().from(members).where(eq(members.role, 'admin'))
    if (otherAdmins.filter((m) => m.id !== target.id).length === 0) {
      return NextResponse.json({ error: 'At least one admin must remain.' }, { status: 400 })
    }
  }

  await db.update(members).set({ role: 'member' }).where(eq(members.id, params.memberId))
  return NextResponse.json({ success: true, memberId: params.memberId })
}
