import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, boardMembers } from '@/lib/schema'
import { eq, isNull } from 'drizzle-orm'

/**
 * ONE-TIME TEMPORARY SEED for testing the board-referrer chart.
 *
 * Distribution — of every non-staff member without a referredBy set:
 *   - 60% attributed to Sonia Heer
 *   - 10% attributed to Surdeep Singh (Dr.)
 *   - remaining 30% split roughly evenly among the other board members
 *
 * This is idempotent — it only touches members with referredBy == null,
 * so a second run over the same DB is a no-op. Once real referral data
 * exists the endpoint should be deleted; the /admin UI never links to it.
 *
 * Randomness note: workflow scripts can't call Math.random, but this is
 * a plain Next.js route (not a workflow) so Math.random is fine and this
 * only runs once when the admin visits it.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/^dr\.?\s+/, '').trim()
}

async function runSeed() {
  const [allBoard, unattributed] = await Promise.all([
    db.select().from(boardMembers),
    db
      .select()
      .from(members)
      .where(isNull(members.referredBy))
      .catch(() => []),
  ])

  const nonStaff = unattributed.filter((m) => m.role !== 'admin' && m.role !== 'moderator' && m.role !== 'reviewer')

  const sonia = allBoard.find((b) => normalize(b.name) === 'sonia heer')
  const surdeep = allBoard.find((b) => normalize(b.name) === 'surdeep singh')
  const others = allBoard.filter((b) => b.id !== sonia?.id && b.id !== surdeep?.id)

  if (!sonia) return NextResponse.json({ error: 'Sonia Heer not found in board_members.' }, { status: 400 })
  if (!surdeep) return NextResponse.json({ error: 'Surdeep Singh not found in board_members.' }, { status: 400 })
  if (others.length === 0) return NextResponse.json({ error: 'No other board members to distribute the remaining share to.' }, { status: 400 })

  const total = nonStaff.length
  const soniaTarget = Math.round(total * 0.6)
  const surdeepTarget = Math.round(total * 0.1)
  // Anything left goes to the rest, split evenly.

  // Fisher-Yates shuffle so the picks aren't ordered by created_at.
  const shuffled = [...nonStaff]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const results: string[] = []
  let idx = 0
  let soniaCount = 0
  let surdeepCount = 0
  const otherCounts = new Map<string, number>()
  for (const b of others) otherCounts.set(b.id, 0)

  for (const m of shuffled) {
    let boardId: string
    let boardName: string
    if (idx < soniaTarget) {
      boardId = sonia.id
      boardName = sonia.name
      soniaCount += 1
    } else if (idx < soniaTarget + surdeepTarget) {
      boardId = surdeep.id
      boardName = surdeep.name
      surdeepCount += 1
    } else {
      const b = others[Math.floor(Math.random() * others.length)]
      boardId = b.id
      boardName = b.name
      otherCounts.set(b.id, (otherCounts.get(b.id) || 0) + 1)
    }
    await db.update(members).set({ referredBy: boardId }).where(eq(members.id, m.id))
    idx += 1
    results.push(`${m.name} → ${boardName}`)
  }

  const summary: Record<string, number> = {
    [sonia.name]: soniaCount,
    [surdeep.name]: surdeepCount,
  }
  for (const b of others) {
    summary[b.name] = otherCounts.get(b.id) || 0
  }

  return NextResponse.json({
    success: true,
    totalAttributed: idx,
    summary,
    detailCount: results.length,
    detail: results.slice(0, 100),
  })
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runSeed()
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }
  return runSeed()
}
