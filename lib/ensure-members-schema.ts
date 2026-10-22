import { db } from './db'
import { sql } from 'drizzle-orm'
import { applyEmailCorrections } from './seed-email-corrections'

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

    // One-time seed: Steve G. Luna (VP, Mechanics Bank). His corporate
    // bank-issued device blocked the public join form; we're creating his
    // record manually so the Square payment he receives via email links
    // to a real member row. INSERT OR IGNORE handles both the email
    // UNIQUE and the id PRIMARY KEY constraints — safe to re-run.
    try {
      await db.run(sql.raw(`
        INSERT OR IGNORE INTO members
          (id, email, name, phone, business_name, city, sector, membership_tier, status, role, created_at)
        VALUES (
          'seed-steve-luna-mechanics',
          'stephen_luna@mechanicsbank.com',
          'Steve G. Luna',
          '209-793-1900',
          'Mechanics Bank',
          'Fresno',
          'Finance',
          'corporate',
          'pending',
          'member',
          CAST(strftime('%s', 'now') AS INTEGER)
        )
      `))
      console.log('ensureMembersRenewalSchema: Steve Luna seed row ensured')
    } catch (e) {
      // Explicit so the real cause shows up in Vercel logs if the row
      // still doesn't materialize.
      console.error('Steve Luna seed INSERT failed:', e instanceof Error ? e.message : e)
    }

    ensured = true

    // One-off: SMS Construction and Manreet Ladhar share the same email
    // in the source data. Original seed kept Manreet's row and dropped
    // SMS Construction via INSERT OR IGNORE. The admin's intent is one
    // row: Manreet Ladhar as the contact person, SMS Construction as
    // the business, paid $395 by check (SMS's payment). Guarded by a
    // migration marker so it only applies once.
    await tryRun(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        name TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `)
    await tryRun(`
      UPDATE members
      SET
        business_name = 'SMS Construction',
        sector = 'Construction',
        payment_method = 'check',
        payment_reference = '[seed:chamber-batch-v1 ref:sonia merged:sms-construction]'
      WHERE email = 'manreetladhar@gmail.com'
        AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE name = 'manreet_sms_merge_v1')
    `)
    await tryRun(`
      INSERT OR IGNORE INTO app_migrations (name, applied_at)
      VALUES ('manreet_sms_merge_v1', CAST(strftime('%s', 'now') AS INTEGER))
    `)

    // Raja Rani Indian Banquet is a duplicate of Raja Rani Cuisine —
    // same business, counted twice in the source data. Delete the
    // Banquet row. Idempotent: once gone, the WHERE stops matching,
    // and if an admin edited the email away from the placeholder we
    // won't touch it either.
    await tryRun(`
      DELETE FROM members
      WHERE email = 'cb-raja-rani-banquet@noemail.cvicc.org'
    `)

    // Email corrections for placeholder rows from the chamber batch —
    // runs AFTER the main schema work. Each UPDATE is idempotent (only
    // matches rows still on the placeholder email), so re-runs are
    // no-ops and admin-edited rows are never clobbered.
    await applyEmailCorrections()
  } catch (e) {
    console.error('ensureMembersRenewalSchema fatal:', e)
  }
}
