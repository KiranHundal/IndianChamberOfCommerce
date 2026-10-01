import { db } from './db'
import { sql } from 'drizzle-orm'

let ensured = false

async function tryRun(statement: string) {
  try {
    await db.run(sql.raw(statement))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('ensureBoardHeadshots statement failed:', statement, msg)
  }
}

/**
 * Backfill board_members.photo_url from the shared headshotFor() map in
 * lib/leader-headshots.ts when the row has no photo of its own. Each
 * UPDATE is guarded by `photo_url IS NULL` so it writes once per name
 * and is safe to re-run on every cold start — if an admin later uploads
 * a real photo, the condition stops matching and we never overwrite.
 *
 * LIKE matching is intentionally loose (lower(trim(name)) LIKE '%first%last%')
 * so that "Rajinder Kumar", "Mr. Rajinder Kumar", "Rajinder K Kumar" and
 * "Rajinder Kumar, CPA" all pick up the same /headshots file. That's the
 * same shape headshotFor() uses in-memory, just now persisted to the DB
 * so the admin surface shows the photo too.
 */
async function fill(photoUrl: string, nameLike: string) {
  await tryRun(`
    UPDATE board_members
    SET photo_url = '${photoUrl}'
    WHERE photo_url IS NULL
      AND lower(trim(name)) LIKE '${nameLike}'
  `)
}

// Repoint any rows that previously pointed at a stale placeholder path.
// Separate from `fill()` because this intentionally overwrites a
// non-null photo_url when it matches a known-bad URL.
async function repoint(fromUrl: string, toUrl: string) {
  await tryRun(`UPDATE board_members SET photo_url = '${toUrl}' WHERE photo_url = '${fromUrl}'`)
}

export async function ensureBoardHeadshots() {
  if (ensured) return
  try {
    // Fix anyone my earlier backfill left on the stale placeholder path
    // before we knew the real headshot lived at /headshots/RajK.jpeg.
    await repoint('/headshots/rajinder-kumar.jpg', '/headshots/RajK.jpeg')

    await fill('/headshots/RajK.jpeg',           '%rajinder%kumar%')
    await fill('/headshots/manreet-sandhu.jpg',  '%manreet%sandhu%')
    await fill('/headshots/sonia1.png',          '%sonia%heer%')
    await fill('/headshots/surdeep1.png',        '%surdeep%singh%')
    await fill('/headshots/Roken1.png',          '%roken%bhatt%')
    await fill('/headshots/Akash1.png',          '%akash%sing%')
    await fill('/headshots/KiranH.jpg',          '%kiran%hundal%')
    ensured = true
  } catch (e) {
    console.error('ensureBoardHeadshots fatal:', e)
  }
}
