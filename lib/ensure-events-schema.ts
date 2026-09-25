import { db } from './db'
import { sql } from 'drizzle-orm'

let ensured = false

export async function ensureEventsSchema() {
  if (ensured) return
  await db.run(sql`
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
      published INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      created_by TEXT,
      updated_at INTEGER
    )
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS event_rsvps (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      guests INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id)`)
  ensured = true
}
