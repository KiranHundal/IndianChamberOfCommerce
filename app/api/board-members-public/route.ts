import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { boardMembers } from '@/lib/schema'
import { asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Public list of board members for the "Who brought you in?" dropdown on
 * the /join form and the admin Log Offline Payment modal. Only exposes
 * id, name, role — no emails or bios.
 */
export async function GET() {
  try {
    const rows = await db
      .select({
        id: boardMembers.id,
        name: boardMembers.name,
        role: boardMembers.role,
      })
      .from(boardMembers)
      .orderBy(asc(boardMembers.displayOrder))
    return NextResponse.json({ boardMembers: rows })
  } catch (err) {
    console.error('board-members-public error:', err)
    return NextResponse.json({ boardMembers: [] })
  }
}
