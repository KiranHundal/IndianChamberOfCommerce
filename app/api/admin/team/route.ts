import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, boardMembers } from '@/lib/schema'
import { or, eq, isNotNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamRows = await db
    .select()
    .from(members)
    .where(or(eq(members.role, 'admin'), eq(members.role, 'moderator'), eq(members.role, 'reviewer')))

  const boardRows = await db.select().from(boardMembers).where(isNotNull(boardMembers.email))

  const teamEmails = new Set(teamRows.map((m) => m.email.toLowerCase()))

  const grantable = boardRows
    .filter((b) => b.email && !teamEmails.has(b.email.toLowerCase()))
    .map((b) => ({
      id: b.id,
      name: b.name,
      role: b.role,
      email: b.email!,
      photoUrl: b.photoUrl,
    }))

  const team = teamRows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    membershipNumber: m.membershipNumber,
    status: m.status,
    createdAt: m.createdAt,
    approvedAt: m.approvedAt,
  }))

  return NextResponse.json({ team, grantable })
}
