import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Returns the current session user's own board_members row id (null if
 * they're not on the board). Used by /admin/members to scope the Edit
 * button so a moderator only sees it on members they personally referred.
 *
 * Not sensitive — a moderator already knows which board member they are
 * — but gated to admin/moderator so random authenticated members don't
 * hit the lookup.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { email?: string; role?: string } | undefined
  const email = user?.email?.toLowerCase()
  const role = user?.role
  if (!email || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [board] = await db
      .select({ id: boardMembers.id, name: boardMembers.name })
      .from(boardMembers)
      .where(eq(boardMembers.email, email))
      .limit(1)
    return NextResponse.json({
      boardId: board?.id || null,
      boardName: board?.name || null,
    })
  } catch (err) {
    console.error('my-board-id error:', err)
    return NextResponse.json({ boardId: null, boardName: null })
  }
}
