import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { leaderVideos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { del } from '@vercel/blob'

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

  const rows = await db.select().from(leaderVideos)
  return NextResponse.json({ videos: rows })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leaderName } = await req.json()
  if (!leaderName || typeof leaderName !== 'string') {
    return NextResponse.json({ error: 'leaderName required' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(leaderVideos)
    .where(eq(leaderVideos.leaderName, leaderName))
    .limit(1)

  if (existing) {
    try {
      await del(existing.url)
    } catch {
    }
    await db.delete(leaderVideos).where(eq(leaderVideos.leaderName, leaderName))
  }

  return NextResponse.json({ success: true })
}
