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

  if (!paid) {
    // Unpaid: clear the whole payment record.
    await db
      .update(eventRsvps)
      .set({ paidAt: null, paidAmount: null, paymentMethod: null, paymentReference: null })
      .where(and(eq(eventRsvps.eventId, params.id), eq(eventRsvps.id, params.rsvpId)))
    return NextResponse.json({ success: true })
  }

  // Marking paid — accept optional amount (dollars), method, reference.
  const ALLOWED_METHODS = new Set(['square', 'cash', 'check', 'zelle', 'venmo', 'other'])
  const methodIn = typeof body.method === 'string' ? body.method.toLowerCase() : ''
  const method = ALLOWED_METHODS.has(methodIn) ? methodIn : 'other'

  let amountCents: number | null = null
  if (body.amount != null && body.amount !== '') {
    const amt = parseFloat(String(body.amount))
    if (Number.isFinite(amt) && amt >= 0) amountCents = Math.round(amt * 100)
  }
  const reference = typeof body.reference === 'string' ? body.reference.trim().slice(0, 200) || null : null

  await db
    .update(eventRsvps)
    .set({
      paidAt: new Date(),
      paidAmount: amountCents,
      paymentMethod: method,
      paymentReference: reference,
    })
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
