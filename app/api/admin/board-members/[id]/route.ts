import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { del, put } from '@vercel/blob'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const [existing] = await db.select().from(boardMembers).where(eq(boardMembers.id, params.id)).limit(1)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    const name = formData.get('name')?.toString()?.trim()
    if (name) updates.name = name
    const role = formData.get('role')?.toString()?.trim()
    if (role) updates.role = role
    const bioRaw = formData.get('bio')
    if (bioRaw !== null) updates.bio = bioRaw.toString().trim() || null
    const emailRaw = formData.get('email')
    if (emailRaw !== null) {
      const emailValue = emailRaw.toString().trim().toLowerCase() || null
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
      }
      updates.email = emailValue
    }
    const displayOrderRaw = formData.get('displayOrder')?.toString()
    if (displayOrderRaw !== undefined) {
      const parsed = parseInt(displayOrderRaw, 10)
      if (Number.isFinite(parsed)) updates.displayOrder = parsed
    }

    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Photo must be under 5MB.' }, { status: 400 })
      }
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
      }
      const ext = photo.name.split('.').pop() || 'jpg'
      const safeSlug = (updates.name as string | undefined || existing.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const blob = await put(`board/${safeSlug}-${Date.now()}.${ext}`, photo, {
        access: 'public',
      })
      if (existing.photoUrl) {
        try {
          await del(existing.photoUrl)
        } catch {}
      }
      updates.photoUrl = blob.url
    }

    if (Object.keys(updates).length > 0) {
      await db.update(boardMembers).set(updates).where(eq(boardMembers.id, params.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update board member'
    console.error('Board member update error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [existing] = await db.select().from(boardMembers).where(eq(boardMembers.id, params.id)).limit(1)
  if (existing) {
    if (existing.photoUrl) {
      try {
        await del(existing.photoUrl)
      } catch {}
    }
    await db.delete(boardMembers).where(eq(boardMembers.id, params.id))
  }
  return NextResponse.json({ success: true })
}
