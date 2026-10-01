import { db } from './db'
import { sql } from 'drizzle-orm'

let ensured = false

// Persisted migration marker — a tiny table that lets us run "do this
// one specific thing once, ever" statements that need to overwrite data
// (not just add it). The guard is baked into each UPDATE as a correlated
// subquery, so everything flows through db.run() (db.get isn't supported
// on this libsql adapter — it silently returns undefined and that
// previously made the whole marker check a no-op).
async function ensureMigrationsTable() {
  await tryRun(`CREATE TABLE IF NOT EXISTS app_migrations (
    name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  )`)
}

async function runOnceUpdate(migrationName: string, updateSql: string) {
  await tryRun(`
    ${updateSql.trim().replace(/;?\s*$/, '')}
      AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE name = '${migrationName}')
  `)
}

async function markMigrationApplied(name: string) {
  await tryRun(`INSERT OR IGNORE INTO app_migrations (name, applied_at) VALUES ('${name}', strftime('%s', 'now'))`)
}

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

// One-time backfill: classify known exec/officer names so the public
// Board Members grid stops showing them. New rows default to 'board'.
async function categorize(category: 'executive' | 'officer', nameLike: string) {
  await tryRun(`
    UPDATE board_members
    SET category = '${category}'
    WHERE category = 'board'
      AND lower(trim(name)) LIKE '${nameLike}'
  `)
}

// SQL string literal escaping — only ' needs doubling in SQLite.
function esc(s: string): string {
  return s.replace(/'/g, "''")
}

async function seedSector(sector: string, nameLike: string) {
  await tryRun(`
    UPDATE board_members
    SET sector = '${esc(sector)}'
    WHERE sector IS NULL
      AND lower(trim(name)) LIKE '${nameLike}'
  `)
}

async function seedBio(bio: string, nameLike: string) {
  // Only fills missing bios so an admin's own text (even if shorter) is
  // never overwritten.
  await tryRun(`
    UPDATE board_members
    SET bio = '${esc(bio)}'
    WHERE (bio IS NULL OR bio = '')
      AND lower(trim(name)) LIKE '${nameLike}'
  `)
}

async function seedRole(role: string, nameLike: string) {
  // Overwrites the default 'Board Member' role so the executive card
  // shows the right title. Admin can still edit afterward.
  await tryRun(`
    UPDATE board_members
    SET role = '${esc(role)}'
    WHERE role = 'Board Member'
      AND lower(trim(name)) LIKE '${nameLike}'
  `)
}

// Only overwrites when the row is still on the default display_order of
// 100 — once an admin has edited the order, we never touch it again.
async function seedDisplayOrder(order: number, nameLike: string) {
  await tryRun(`
    UPDATE board_members
    SET display_order = ${order}
    WHERE display_order = 100
      AND lower(trim(name)) LIKE '${nameLike}'
  `)
}

// Seed a row only when nobody matching exists. The id is deterministic
// so a re-run after a conflict doesn't accidentally create a second row.
async function insertIfMissing(input: {
  seedId: string
  name: string
  role: string
  bio: string
  photoUrl: string
  category: 'executive' | 'officer' | 'board'
  sector: string | null
  displayOrder: number
  nameLike: string
}) {
  const sectorValue = input.sector === null ? 'NULL' : `'${esc(input.sector)}'`
  await tryRun(`
    INSERT INTO board_members (id, name, role, bio, photo_url, category, sector, display_order, created_at)
    SELECT '${esc(input.seedId)}', '${esc(input.name)}', '${esc(input.role)}', '${esc(input.bio)}',
           '${esc(input.photoUrl)}', '${input.category}', ${sectorValue}, ${input.displayOrder},
           strftime('%s', 'now')
    WHERE NOT EXISTS (
      SELECT 1 FROM board_members WHERE lower(trim(name)) LIKE '${input.nameLike}'
    )
  `)
}

export async function ensureBoardHeadshots() {
  if (ensured) return
  try {
    // Category column — safe to re-add; the error is swallowed by tryRun.
    await tryRun(`ALTER TABLE board_members ADD COLUMN category TEXT NOT NULL DEFAULT 'board'`)
    await tryRun(`ALTER TABLE board_members ADD COLUMN sector TEXT`)

    // Seed the four known exec/officer rows if they're not already in the
    // DB. Kiran Hundal was previously hardcoded in mockLeadership only, so
    // she needs an INSERT. The others usually exist already from the
    // admin; the guard means re-runs are safe.
    await insertIfMissing({
      seedId: 'seed-sonia-heer',
      name: 'Sonia Heer',
      role: 'Chairwoman · Founder · Spokeswoman',
      sector: 'Real Estate',
      category: 'executive',
      displayOrder: 1,
      photoUrl: '/headshots/sonia1.png',
      bio: [
        'Sonia Heer is a dynamic entrepreneur.',
        "She serves as the Broker/Owner of Golden State Realty, Founder of Lavish Eventz and Fresno's annual Teeyan Festival, Owner of Spark Media, President of Aasra Foundation, and host of the Rise with Sonia podcast.",
        'As the Chairwoman, Founder, and Spokeswoman of CVICC, Sonia is committed to fostering business growth, cultural connections, and community engagement throughout the Central Valley and beyond.',
        'Passionate about real estate, culture, business, and community impact, she is dedicated to connecting people, empowering entrepreneurs, and creating opportunities that inspire growth.',
        'Building communities. Elevating businesses. Inspiring lives.',
      ].join('\n\n'),
      nameLike: '%sonia%heer%',
    })
    await insertIfMissing({
      seedId: 'seed-surdeep-singh',
      name: 'Dr. Surdeep Singh',
      role: 'President · Founder',
      sector: 'Healthcare',
      category: 'executive',
      displayOrder: 2,
      photoUrl: '/headshots/surdeep1.png',
      bio: [
        'Dr. Surdeep Singh is a dentist, entrepreneur, and community leader with a strong passion for business growth, innovation, and community development.',
        'As Chamber of Commerce President, Dr. Singh is committed to supporting local businesses, strengthening community connections, encouraging collaboration, and creating opportunities for both business owners and community members to grow together.',
      ].join('\n\n'),
      nameLike: '%surdeep%singh%',
    })
    await insertIfMissing({
      seedId: 'seed-rajinder-kumar',
      name: 'Rajinder Kumar',
      role: 'Executive Director · Founder',
      sector: 'Finance',
      category: 'executive',
      displayOrder: 3,
      photoUrl: '/headshots/RajK.jpeg',
      bio: [
        'Rajinder Kumar — CPFA, CRPC, SE-AWMA — is a Financial Advisor and Senior Portfolio Advisor, community advocate, and multilingual literary contributor based in Fresno.',
        'He has personally assisted more than 5,500 Punjabi and Hindi-speaking individuals at the bank and brings decades of community-development experience from his years in Australia.',
      ].join('\n\n'),
      nameLike: '%rajinder%kumar%',
    })
    await insertIfMissing({
      seedId: 'seed-kiran-hundal',
      name: 'Kiran Hundal',
      role: 'Treasurer & Chief Financial Officer',
      sector: null,
      category: 'officer',
      displayOrder: 5,
      photoUrl: '/headshots/KiranH.jpg',
      bio: "Kiran Hundal serves as Treasurer & Chief Financial Officer of CVICC, overseeing the chamber's financial operations, budget planning, and fiscal reporting. Her attention to detail and financial acumen ensure every resource is directed toward member empowerment and community growth.",
      nameLike: '%kiran%hundal%',
    })

    await categorize('executive', '%sonia%heer%')
    await categorize('executive', '%surdeep%singh%')
    await categorize('executive', '%rajinder%kumar%')
    await categorize('officer',   '%kiran%hundal%')

    // Seed roles so the exec cards don't say "Board Member" at the top.
    await seedRole('Chairwoman · Founder · Spokeswoman', '%sonia%heer%')
    await seedRole('President · Founder',                '%surdeep%singh%')
    await seedRole('Executive Director · Founder',       '%rajinder%kumar%')
    await seedRole('Treasurer & Chief Financial Officer', '%kiran%hundal%')

    // Canonical exec order: Sonia (1) → Surdeep (2) → Rajinder (3).
    // Officers follow (Kiran at 5). Only applies when the row is still
    // on the default order of 100, so admin tweaks are preserved.
    await seedDisplayOrder(1, '%sonia%heer%')
    await seedDisplayOrder(2, '%surdeep%singh%')
    await seedDisplayOrder(3, '%rajinder%kumar%')
    await seedDisplayOrder(5, '%kiran%hundal%')

    // One-time hard correction. v1 silently skipped because db.get isn't
    // supported here; v2 moves the "already applied?" check into the SQL
    // itself, so everything runs through db.run().
    await ensureMigrationsTable()
    const EXEC_ORDER_V2 = 'exec_order_v2'
    await runOnceUpdate(EXEC_ORDER_V2,
      `UPDATE board_members SET display_order = 1 WHERE lower(trim(name)) LIKE '%sonia%heer%'`)
    await runOnceUpdate(EXEC_ORDER_V2,
      `UPDATE board_members SET display_order = 2 WHERE lower(trim(name)) LIKE '%surdeep%singh%'`)
    await runOnceUpdate(EXEC_ORDER_V2,
      `UPDATE board_members SET display_order = 3 WHERE lower(trim(name)) LIKE '%rajinder%kumar%'`)
    await runOnceUpdate(EXEC_ORDER_V2,
      `UPDATE board_members SET display_order = 5 WHERE lower(trim(name)) LIKE '%kiran%hundal%'`)
    await markMigrationApplied(EXEC_ORDER_V2)

    // Industry badges.
    await seedSector('Real Estate', '%sonia%heer%')
    await seedSector('Healthcare',  '%surdeep%singh%')
    await seedSector('Finance',     '%rajinder%kumar%')

    // Full bios ported from mockLeadership so the exec cards stop
    // depending on hardcoded content.
    await seedBio([
      'Sonia Heer is a dynamic entrepreneur.',
      "She serves as the Broker/Owner of Golden State Realty, Founder of Lavish Eventz and Fresno's annual Teeyan Festival, Owner of Spark Media, President of Aasra Foundation, and host of the Rise with Sonia podcast.",
      'As the Chairwoman, Founder, and Spokeswoman of CVICC, Sonia is committed to fostering business growth, cultural connections, and community engagement throughout the Central Valley and beyond.',
      'Passionate about real estate, culture, business, and community impact, she is dedicated to connecting people, empowering entrepreneurs, and creating opportunities that inspire growth.',
      'Building communities. Elevating businesses. Inspiring lives.',
    ].join('\n\n'), '%sonia%heer%')

    await seedBio([
      'Dr. Surdeep Singh is a dentist, entrepreneur, and community leader with a strong passion for business growth, innovation, and community development. Born and raised in Punjab, India, he completed his dental education before moving to the United States, where he started from scratch and built his professional journey through hard work, resilience, and determination.',
      'After graduating from an International Dental Program, Dr. Singh began practicing dentistry in the U.S. and later opened his first dental practice in 2022, followed by a second office in 2025. His leadership and commitment to excellence have helped his offices earn recognition through the Fresno Bee Best of Central California People\'s Choice Awards for four consecutive years.',
      'As a business owner, Dr. Singh has focused on bringing growth, opportunity, and advanced innovation to the Central Valley, including the introduction of robotic dental implantology to the local community. His journey reflects the values of entrepreneurship, perseverance, and service.',
      'As Chamber of Commerce President, Dr. Singh is committed to supporting local businesses, strengthening community connections, encouraging collaboration, and creating opportunities for both business owners and community members to grow together. His vision is to lead with integrity, inspire progress, and help build a stronger, more connected Central Valley.',
    ].join('\n\n'), '%surdeep%singh%')

    await seedBio([
      'Rajinder Kumar — CPFA, CRPC, SE-AWMA — is a Financial Advisor and Senior Portfolio Advisor, community advocate, and multilingual literary contributor based in Fresno.',
      'He was born and raised in Punjab and moved to Australia in 2006 as an international student, studying Community Development in Melbourne.',
      'Rajinder relocated to the United States in 2016 and has worked in the financial services industry since then. He has a track record of personally assisting more than 5,500 Punjabi and Hindi-speaking individuals at the bank.',
      'During his time in Australia, Rajinder worked closely with immigrant and refugee communities from various African nations, contributing to community development projects and advocating for issues affecting young migrants, refugees, and international students. He also represented Indian international students through several government and nonprofit organizations and served in advisory capacities connected to the government of Victoria.',
      'In addition to his professional work, Rajinder writes Punjabi poetry and has translated books and literary works between Punjabi, Hindi, and English. His interests include archaeology, history, Punjabi literature, fitness training, hiking, and reading. He also recently learned to read Urdu.',
    ].join('\n\n'), '%rajinder%kumar%')

    await seedBio(
      "Kiran Hundal serves as Treasurer & Chief Financial Officer of CVICC, overseeing the chamber's financial operations, budget planning, and fiscal reporting. Her attention to detail and financial acumen ensure every resource is directed toward member empowerment and community growth.",
      '%kiran%hundal%'
    )

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
