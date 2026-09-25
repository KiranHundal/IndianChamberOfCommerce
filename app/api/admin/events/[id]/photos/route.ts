import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eventPhotos, events } from '@/lib/schema'
import { asc, eq } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  const rows = await db.select().from(eventPhotos)
    .where(eq(eventPhotos.eventId, params.id))
    .orderBy(asc(eventPhotos.displayOrder), asc(eventPhotos.uploadedAt))
  return NextResponse.json({ photos: rows })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  try {
    const [event] = await db.select().from(events).where(eq(events.id, params.id)).limit(1)
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })

    const formData = await req.formData()
    // Multi-file upload — the admin can drop several photos at once.
    const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
    const captions = formData.getAll('captions').map((c) => (typeof c === 'string' ? c : ''))

    if (files.length === 0) return NextResponse.json({ error: 'Choose at least one image.' }, { status: 400 })

    const created: string[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.size > 8 * 1024 * 1024) continue
      if (!f.type.startsWith('image/')) continue
      const ext = f.name.split('.').pop() || 'jpg'
      const blob = await put(`events/${event.slug}/${crypto.randomUUID()}.${ext}`, f, { access: 'public' })
      const id = crypto.randomUUID()
      await db.insert(eventPhotos).values({
        id,
        eventId: event.id,
        url: blob.url,
        caption: captions[i]?.trim() || null,
        displayOrder: 100 + i,
        uploadedAt: new Date(),
        uploadedBy: session.user?.email || null,
      })
      created.push(id)
    }
    return NextResponse.json({ success: true, ids: created })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to upload.'
    console.error('Event photo upload error:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
