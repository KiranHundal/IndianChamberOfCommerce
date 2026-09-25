import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { events } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { put } from '@vercel/blob'
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

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await ensureEventsSchema()
  const rows = await db.select().from(events).orderBy(desc(events.startAt))
  return NextResponse.json({ events: rows })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await ensureEventsSchema()

  try {
    const formData = await req.formData()
    const title = formData.get('title')?.toString()?.trim()
    const description = formData.get('description')?.toString()?.trim() || null
    const location = formData.get('location')?.toString()?.trim() || null
    const address = formData.get('address')?.toString()?.trim() || null
    const startAtStr = formData.get('startAt')?.toString()
    const endAtStr = formData.get('endAt')?.toString() || ''
    const eventType = formData.get('eventType')?.toString()?.trim() || 'Networking'
    const membersOnly = formData.get('membersOnly') === 'true'
    const rsvpMode = (formData.get('rsvpMode')?.toString() || 'none') as 'none' | 'external' | 'internal'
    const rsvpUrl = formData.get('rsvpUrl')?.toString()?.trim() || null
    const capacityStr = formData.get('capacity')?.toString() || ''
    const published = formData.get('published') === 'true'
    const cover = formData.get('cover') as File | null

    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    if (!startAtStr) return NextResponse.json({ error: 'Start date/time is required.' }, { status: 400 })

    const startAt = new Date(startAtStr)
    if (isNaN(startAt.getTime())) return NextResponse.json({ error: 'Start date is invalid.' }, { status: 400 })
    const endAt = endAtStr ? new Date(endAtStr) : null
    if (endAt && isNaN(endAt.getTime())) return NextResponse.json({ error: 'End date is invalid.' }, { status: 400 })

    if (!['none', 'external', 'internal'].includes(rsvpMode)) {
      return NextResponse.json({ error: 'Invalid RSVP mode.' }, { status: 400 })
    }
    if (rsvpMode === 'external' && !rsvpUrl) {
      return NextResponse.json({ error: 'External RSVP mode needs a URL.' }, { status: 400 })
    }

    let coverImageUrl: string | null = null
    if (cover && cover.size > 0) {
      if (cover.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: 'Cover image must be under 8MB.' }, { status: 400 })
      }
      if (!cover.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Cover file must be an image.' }, { status: 400 })
      }
      const ext = cover.name.split('.').pop() || 'jpg'
      const safeSlug = slugify(title)
      const blob = await put(`events/${safeSlug}-${Date.now()}.${ext}`, cover, { access: 'public' })
      coverImageUrl = blob.url
    }

    const slug = `${slugify(title)}-${startAt.toISOString().slice(0, 10)}`
    const id = crypto.randomUUID()
    const capacity = capacityStr && Number.isFinite(parseInt(capacityStr, 10)) ? parseInt(capacityStr, 10) : null

    await db.insert(events).values({
      id,
      slug,
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
      published,
      createdAt: new Date(),
      createdBy: session.user?.email || null,
    })

    return NextResponse.json({ success: true, id, slug })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create event'
    console.error('Event create error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
