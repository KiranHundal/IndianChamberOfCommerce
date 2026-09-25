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
 * Renewal policy, as set by the board on 2026-09-25:
 *   - Everyone who joined on or before that day renews on 2027-09-01.
 *   - Anyone who joins after that day renews one year after their
 *     approval anniversary (natural cadence).
 *
 * Both statements are written to be safely re-runnable on every cold
 * start — the WHERE clauses stop matching once each row is on-policy.
 */
const POLICY_CUTOFF_DATE = '2026-09-26' // exclusive upper bound on created_at
const POLICY_TARGET_DATE = '2027-09-01' // the standard renewal for the founding cohort

export async function ensureMembersRenewalSchema() {
  if (ensured) return
  try {
    await tryRun(`ALTER TABLE members ADD COLUMN expires_at INTEGER`)
    await tryRun(`ALTER TABLE members ADD COLUMN renewal_reminder_sent_at INTEGER`)

    // Founding-cohort rule: existing approved members lock to Sept 1 2027.
    // Guarded by `expires_at < target` so it won't overwrite a member who
    // later renews forward past that date.
    await tryRun(`
      UPDATE members
      SET expires_at = strftime('%s', '${POLICY_TARGET_DATE}')
      WHERE status = 'approved'
        AND created_at < strftime('%s', '${POLICY_CUTOFF_DATE}')
        AND (expires_at IS NULL OR expires_at < strftime('%s', '${POLICY_TARGET_DATE}'))
    `)

    // Post-cutoff rule: new members get one year from their anniversary,
    // matching the "renew a year after their join date" ask. Only fills
    // NULLs, so nothing that's been renewed via Square gets clobbered.
    await tryRun(`
      UPDATE members
      SET expires_at = strftime('%s',
        datetime(coalesce(payment_date, approved_at, created_at), 'unixepoch', '+1 year')
      )
      WHERE expires_at IS NULL
        AND status = 'approved'
        AND created_at >= strftime('%s', '${POLICY_CUTOFF_DATE}')
        AND (payment_date IS NOT NULL OR approved_at IS NOT NULL)
    `)
    ensured = true
  } catch (e) {
    console.error('ensureMembersRenewalSchema fatal:', e)
  }
}
