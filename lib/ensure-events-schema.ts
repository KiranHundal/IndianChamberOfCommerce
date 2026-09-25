import { db } from './db'
import { sql } from 'drizzle-orm'

let ensured = false

// Every DDL statement is wrapped so one failure (e.g. "duplicate column
// name" on an ALTER we've already run in this container's Turso replica)
// can't take down the whole init and, with it, the calling route or page.
async function tryRun(statement: string) {
  try {
    await db.run(sql.raw(statement))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Idempotent DDL — expected on already-migrated schemas.
    if (/duplicate column|already exists/i.test(msg)) return
    console.error('ensureEventsSchema statement failed:', statement, msg)
  }
}

export async function ensureEventsSchema() {
  if (ensured) return
  try {
    await tryRun(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        address TEXT,
        start_at INTEGER NOT NULL,
        end_at INTEGER,
        cover_image_url TEXT,
        event_type TEXT NOT NULL DEFAULT 'Networking',
        members_only INTEGER NOT NULL DEFAULT 0,
        rsvp_mode TEXT NOT NULL DEFAULT 'none',
        rsvp_url TEXT,
        capacity INTEGER,
        price_cents INTEGER,
        notify_email TEXT,
        published INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        created_by TEXT,
        updated_at INTEGER
      )
    `)
    await tryRun(`ALTER TABLE events ADD COLUMN price_cents INTEGER`)
    await tryRun(`ALTER TABLE events ADD COLUMN notify_email TEXT`)

    await tryRun(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        guests INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        paid_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `)
    await tryRun(`ALTER TABLE event_rsvps ADD COLUMN paid_at INTEGER`)

    await tryRun(`CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at)`)
    await tryRun(`CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id)`)
    ensured = true
  } catch (e) {
    // Any unexpected error — do not set `ensured`, but do not throw either.
    // The caller decides what to do (render an empty state, surface an
    // error). Rethrowing here would take down the whole page.
    console.error('ensureEventsSchema fatal:', e)
  }
}
