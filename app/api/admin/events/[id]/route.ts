import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, eventRsvps } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { del, put } from '@vercel/blob'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  const [event] = await db.select().from(events).where(eq(events.id, params.id)).limit(1)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rsvps = await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, params.id)).orderBy(asc(eventRsvps.createdAt))
  return NextResponse.json({ event, rsvps })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  try {
    const [existing] = await db.select().from(events).where(eq(events.id, params.id)).limit(1)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const formData = await req.formData()
    const title = formData.get('title')?.toString()?.trim() || existing.title
    const description = formData.get('description')?.toString()?.trim() ?? existing.description
    const location = formData.get('location')?.toString()?.trim() ?? existing.location
    const address = formData.get('address')?.toString()?.trim() ?? existing.address
    const startAtStr = formData.get('startAt')?.toString()
    const endAtStr = formData.get('endAt')?.toString()
    const eventType = formData.get('eventType')?.toString()?.trim() || existing.eventType
    const membersOnlyRaw = formData.get('membersOnly')
    const membersOnly = membersOnlyRaw === null ? existing.membersOnly : membersOnlyRaw === 'true'
    const rsvpMode = (formData.get('rsvpMode')?.toString() || existing.rsvpMode) as 'none' | 'external' | 'internal'
    const rsvpUrl = formData.get('rsvpUrl')?.toString()?.trim() ?? existing.rsvpUrl
    const capacityStr = formData.get('capacity')?.toString()
    const priceCentsStr = formData.get('priceCents')?.toString()
    const notifyEmailRaw = formData.get('notifyEmail')?.toString()?.trim().toLowerCase()
    const publishedRaw = formData.get('published')
    const published = publishedRaw === null ? existing.published : publishedRaw === 'true'
    const cover = formData.get('cover') as File | null
    const removeCover = formData.get('removeCover') === 'true'

    const startAt = startAtStr ? new Date(startAtStr) : existing.startAt
    if (isNaN(startAt.getTime())) return NextResponse.json({ error: 'Start date is invalid.' }, { status: 400 })
    const endAt = endAtStr === '' ? null : endAtStr ? new Date(endAtStr) : existing.endAt
    if (endAt && isNaN(endAt.getTime())) return NextResponse.json({ error: 'End date is invalid.' }, { status: 400 })
    if (!['none', 'external', 'internal'].includes(rsvpMode)) {
      return NextResponse.json({ error: 'Invalid RSVP mode.' }, { status: 400 })
    }
    if (rsvpMode === 'external' && !rsvpUrl) {
      return NextResponse.json({ error: 'External RSVP mode needs a URL.' }, { status: 400 })
    }

    let coverImageUrl: string | null = existing.coverImageUrl
    if (removeCover && existing.coverImageUrl) {
      try { await del(existing.coverImageUrl) } catch {}
      coverImageUrl = null
    }
    if (cover && cover.size > 0) {
      if (cover.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Cover must be under 8MB.' }, { status: 400 })
      if (!cover.type.startsWith('image/')) return NextResponse.json({ error: 'Cover must be an image.' }, { status: 400 })
      if (existing.coverImageUrl) {
        try { await del(existing.coverImageUrl) } catch {}
      }
      const ext = cover.name.split('.').pop() || 'jpg'
      const blob = await put(`events/${slugify(title)}-${Date.now()}.${ext}`, cover, { access: 'public' })
      coverImageUrl = blob.url
    }

    const capacity = capacityStr === '' ? null : capacityStr && Number.isFinite(parseInt(capacityStr, 10)) ? parseInt(capacityStr, 10) : existing.capacity
    const priceCents = priceCentsStr === '' ? null : priceCentsStr !== undefined && Number.isFinite(parseInt(priceCentsStr, 10)) ? Math.max(0, parseInt(priceCentsStr, 10)) : existing.priceCents
    const ALLOWED_NOTIFY = new Set([
      'info@indianchamberofcommerce.org',
      'sonia@indianchamberofcommerce.org',
      'raj@indianchamberofcommerce.org',
    ])
    const notifyEmail = notifyEmailRaw === '' ? null : notifyEmailRaw !== undefined && ALLOWED_NOTIFY.has(notifyEmailRaw) ? notifyEmailRaw : existing.notifyEmail

    await db.update(events).set({
      title,
      description,
      location,
      address,
      startAt,
      endAt,
      coverImageUrl,
      eventType,
      membersOnly,
      rsvpMode,
      rsvpUrl,
      capacity,
      priceCents,
      notifyEmail,
      published,
      updatedAt: new Date(),
    }).where(eq(events.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update event'
    console.error('Event update error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  const [existing] = await db.select().from(events).where(eq(events.id, params.id)).limit(1)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing.coverImageUrl) {
    try { await del(existing.coverImageUrl) } catch {}
  }
  await db.delete(eventRsvps).where(eq(eventRsvps.eventId, params.id))
  await db.delete(events).where(eq(events.id, params.id))
  return NextResponse.json({ success: true })
}
