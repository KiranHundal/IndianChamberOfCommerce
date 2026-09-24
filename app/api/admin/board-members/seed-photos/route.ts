import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'

/**
 * One-time seed: back-fills board_members.photo_url from the same headshot
 * paths the public /about/leadership page uses, so the admin UI stops
 * showing placeholder icons next to everyone but the one member who was
 * added manually with an upload.
 *
 * Idempotent — running twice is safe. A row that already has a photoUrl
 * is left alone (we don't overwrite manually uploaded images with the
 * public site's version).
 *
 * Match key is name-based, and we also try the last name so "R. Sidhu
 * Buttar" and "Rajpreet Buttar" and similar variants get matched.
 */
const PHOTOS: Array<{ names: string[]; photoUrl: string }> = [
  { names: ['sonia heer'], photoUrl: '/headshots/sonia1.png' },
  { names: ['dr. surdeep singh', 'surdeep singh'], photoUrl: '/headshots/surdeep1.png' },
  { names: ['rajinder kumar'], photoUrl: '/headshots/rajinder-kumar.jpg' },
  { names: ['kiran hundal'], photoUrl: '/headshots/KiranH.jpg' },
  { names: ['roken bhatt'], photoUrl: '/headshots/Roken1.png' },
  { names: ['manreet sandhu', 'manreet singh sandhu'], photoUrl: '/headshots/manreet-sandhu.jpg' },
  { names: ['akash singal', 'akash singhal'], photoUrl: '/headshots/Akash1.png' },
]

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

async function runSeed() {
  const rows = await db.select().from(boardMembers)
  const results: string[] = []

  for (const row of rows) {
    const rowName = row.name.toLowerCase().trim()
    const match = PHOTOS.find((p) => p.names.some((n) => n === rowName))
    if (!match) {
      results.push(`no-photo-for: ${row.name}`)
      continue
    }
    if (row.photoUrl) {
      if (row.photoUrl === match.photoUrl) {
        results.push(`already-set: ${row.name}`)
      } else {
        results.push(`kept-existing: ${row.name} (has ${row.photoUrl}, would set ${match.photoUrl})`)
      }
      continue
    }
    await db.update(boardMembers).set({ photoUrl: match.photoUrl }).where(eq(boardMembers.id, row.id))
    results.push(`updated: ${row.name} → ${match.photoUrl}`)
  }

  return NextResponse.json({ success: true, results })
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
