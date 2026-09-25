import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eventPhotos } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureEventsSchema()

  const [row] = await db.select().from(eventPhotos)
    .where(and(eq(eventPhotos.id, params.photoId), eq(eventPhotos.eventId, params.id)))
    .limit(1)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try { await del(row.url) } catch {}
  await db.delete(eventPhotos)
    .where(and(eq(eventPhotos.id, params.photoId), eq(eventPhotos.eventId, params.id)))
  return NextResponse.json({ success: true })
}
