import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eventRsvps } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; rsvpId: string } }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  const body = await req.json().catch(() => ({}))
  const paid = body.paid === true

  await db
    .update(eventRsvps)
    .set({ paidAt: paid ? new Date() : null })
    .where(and(eq(eventRsvps.eventId, params.id), eq(eventRsvps.id, params.rsvpId)))
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; rsvpId: string } }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  await db.delete(eventRsvps).where(and(eq(eventRsvps.eventId, params.id), eq(eventRsvps.id, params.rsvpId)))
  return NextResponse.json({ success: true })
}
