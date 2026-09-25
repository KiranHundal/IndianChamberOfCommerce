import { db } from './db'
import { sql } from 'drizzle-orm'

let ensured = false

async function tryRun(statement: string) {
  try {
    await db.run(sql.raw(statement))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/duplicate column|already exists/i.test(msg)) return
    console.error('ensureMembersSchema statement failed:', statement, msg)
  }
}

/**
 * Add renewal columns and backfill expiresAt for existing approved
 * members. Existing rows get an anniversary date derived from their
 * paymentDate (or approvedAt, or createdAt) plus one year — good enough
 * to seed the renewal pipeline without touching Turso by hand.
 */
export async function ensureMembersRenewalSchema() {
  if (ensured) return
  try {
    await tryRun(`ALTER TABLE members ADD COLUMN expires_at INTEGER`)
    await tryRun(`ALTER TABLE members ADD COLUMN renewal_reminder_sent_at INTEGER`)
    // Backfill: only rows where expires_at IS NULL and the member is on
    // an approved anniversary. Uses SQLite's datetime math on the seconds
    // int (Drizzle stores timestamps as unix seconds).
    await tryRun(`
      UPDATE members
      SET expires_at =
        strftime('%s',
          datetime(coalesce(payment_date, approved_at, created_at), 'unixepoch', '+1 year')
        )
      WHERE expires_at IS NULL
        AND status = 'approved'
        AND (payment_date IS NOT NULL OR approved_at IS NOT NULL)
    `)
    ensured = true
  } catch (e) {
    console.error('ensureMembersRenewalSchema fatal:', e)
  }
}
