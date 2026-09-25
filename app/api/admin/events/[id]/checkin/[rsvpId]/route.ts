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

export async function POST(req: NextRequest, { params }: { params: { id: string; rsvpId: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  const body = await req.json().catch(() => ({}))
  const undo = body.undo === true

  const [rsvp] = await db.select().from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, params.id), eq(eventRsvps.id, params.rsvpId)))
    .limit(1)
  if (!rsvp) return NextResponse.json({ error: 'RSVP not found.' }, { status: 404 })

  if (undo) {
    await db.update(eventRsvps).set({ attendedAt: null, checkedInBy: null })
      .where(eq(eventRsvps.id, params.rsvpId))
    return NextResponse.json({ success: true, attended: false })
  }

  // Idempotent: if they're already checked in, return that state instead
  // of moving the timestamp forward. Useful when someone scans twice.
  if (rsvp.attendedAt) {
    return NextResponse.json({ success: true, attended: true, alreadyCheckedIn: true, attendedAt: rsvp.attendedAt, name: rsvp.name })
  }

  const now = new Date()
  await db.update(eventRsvps).set({
    attendedAt: now,
    checkedInBy: session.user?.email || null,
  }).where(eq(eventRsvps.id, params.rsvpId))

  return NextResponse.json({ success: true, attended: true, attendedAt: now, name: rsvp.name })
}
