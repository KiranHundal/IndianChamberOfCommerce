import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { boardMembers } from '@/lib/schema'
import { asc, eq } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { sendBoardMemberWelcomeEmail } from '@/lib/email'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db.select().from(boardMembers).orderBy(asc(boardMembers.displayOrder))
  return NextResponse.json({ boardMembers: rows })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const name = formData.get('name')?.toString()?.trim()
    const role = formData.get('role')?.toString()?.trim() || 'Board Member'
    const bio = formData.get('bio')?.toString()?.trim() || null
    const email = formData.get('email')?.toString()?.trim()?.toLowerCase() || null
    const sendWelcome = formData.get('sendWelcome') === 'true'
    const displayOrder = parseInt(formData.get('displayOrder')?.toString() || '100', 10)
    const photo = formData.get('photo') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    let photoUrl: string | null = null
    if (photo && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Photo must be under 5MB.' }, { status: 400 })
      }
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
      }
      const ext = photo.name.split('.').pop() || 'jpg'
      const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const blob = await put(`board/${safeSlug}-${Date.now()}.${ext}`, photo, {
        access: 'public',
      })
      photoUrl = blob.url
    }

    const id = crypto.randomUUID()
    await db.insert(boardMembers).values({
      id,
      name,
      role,
      bio,
      photoUrl,
      email,
      displayOrder: Number.isFinite(displayOrder) ? displayOrder : 100,
      createdAt: new Date(),
    })

    let emailStatus: 'sent' | 'failed' | 'skipped' = 'skipped'
    if (email && sendWelcome) {
      try {
        await sendBoardMemberWelcomeEmail({ name, email, role })
        await db.update(boardMembers).set({ welcomeEmailSentAt: new Date() }).where(eq(boardMembers.id, id))
        emailStatus = 'sent'
      } catch (emailError) {
        console.error('Board member welcome email error:', emailError)
        emailStatus = 'failed'
      }
    }

    return NextResponse.json({ success: true, id, emailStatus })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create board member'
    console.error('Board member create error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
