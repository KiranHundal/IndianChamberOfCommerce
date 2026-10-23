import bcrypt from 'bcryptjs'
import { db } from './db'
import { sql, eq } from 'drizzle-orm'
import { members } from './schema'
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

/**
 * Permanent superusers (Kiran Hundal, Treasurer/CFO & site operator).
 *
 * Two accounts, both role=admin:
 *   - hundalkiran6@gmail.com   (primary)
 *   - kiran.farmers@gmail.com  (secondary)
 *
 * This seed guarantees Kiran can always sign in with admin role, even if
 * a row gets deleted or a role gets accidentally downgraded. Safe to
 * re-run on every cold start:
 *   - Row absent → insert with role=admin, status=approved, bcrypt(bootstrap)
 *   - Row present, role != admin → promote to admin, keep approved
 *   - Row present, admin → no-op (password untouched unless the one-time
 *     rebootstrap marker below hasn't been applied yet)
 *
 * Password handling: the bootstrap password `AdminKiran` is set at INSERT
 * time, PLUS once-per-database via a migration marker so existing rows
 * (e.g. previously seeded with an older bootstrap value) get the current
 * password applied. After the marker is recorded, subsequent cold starts
 * leave existing passwords alone — so once Kiran changes his password
 * from /portal, this seed can never clobber it.
 *
 * BOOTSTRAP_SUPERUSER_PASSWORD env var overrides the hardcoded value
 * when present. Change there to rotate without editing this file.
 */
const SUPERUSERS = [
  { id: 'seed-superuser-kiran-hundal', email: 'hundalkiran6@gmail.com', name: 'Kiranjot Hundal' },
  { id: 'seed-superuser-kiran-farmers', email: 'kiran.farmers@gmail.com', name: 'Kiran Hundal' },
]
const SUPERUSER_DEFAULT_PASSWORD = 'AdminKiran'
// Bump the suffix if you ever want to force another one-time password
// rebootstrap across both superuser rows.
const PASSWORD_REBOOTSTRAP_MARKER = 'superuser_pw_rebootstrap_adminkiran_v1'

/**
 * Board moderators (all 7 CVICC 2026 board members minus Kiran who is
 * admin and Gigi who is reviewer). Idempotent cold-start seed:
 *   - Row absent → insert with role=moderator, status=approved, no password
 *     (admin can later /admin/members → Set Temp Password to issue credentials)
 *   - Row present with role=admin or reviewer → LEFT ALONE (never downgraded)
 *   - Row present with role=member → promoted to moderator
 *   - Row already moderator → no-op
 *
 * Mirrors app/api/admin/team/seed-finance-moderators/route.ts for Sonia,
 * Roken, Surdeep, Rajinder (safe to re-apply) and extends it to the three
 * remaining board members (Akash, Manreet, R. Sidhu Buttar).
 */
const BOARD_MODERATORS = [
  { name: 'Sonia Heer', email: 'sonniaheer@yahoo.com' },
  { name: 'Dr. Surdeep Singh', email: 'dentist.singh95@gmail.com' },
  { name: 'Rajinder Kumar', email: 'rk.aususa@gmail.com' },
  { name: 'Roken Bhatt', email: 'roken@bhattcpa.org' },
  { name: 'Akash Singhal', email: 'akashsingel@gmail.com' },
  { name: 'Manreet Singh Sandhu', email: 'manreet.singh.sandhu@gmail.com' },
  { name: 'R. Sidhu Buttar', email: 'rsidhu.buttar@gmail.com' },
]

async function ensureBoardModerators() {
  try {
    for (const b of BOARD_MODERATORS) {
      const email = b.email.toLowerCase().trim()
      const [existing] = await db
        .select()
        .from(members)
        .where(eq(members.email, email))
        .limit(1)

      if (!existing) {
        await db.insert(members).values({
          id: `seed-moderator-${email.replace(/[^a-z0-9]/g, '-')}`,
          email,
          passwordHash: '',
          name: b.name,
          membershipTier: 'individual',
          status: 'approved',
          role: 'moderator',
          createdAt: new Date(),
          approvedAt: new Date(),
        })
        console.log(`ensureBoardModerators: created ${email} as moderator`)
        continue
      }

      // Never downgrade admin or reviewer. Promote member → moderator.
      if (existing.role === 'admin' || existing.role === 'reviewer' || existing.role === 'moderator') continue
      await db
        .update(members)
        .set({ role: 'moderator', status: 'approved', approvedAt: existing.approvedAt || new Date() })
        .where(eq(members.id, existing.id))
      console.log(`ensureBoardModerators: promoted ${email} to moderator`)
    }
  } catch (e) {
    console.error('ensureBoardModerators failed:', e instanceof Error ? e.message : e)
  }
}

async function ensureSuperuserAccounts() {
  try {
    const plain = process.env.BOOTSTRAP_SUPERUSER_PASSWORD || SUPERUSER_DEFAULT_PASSWORD
    const passwordHash = await bcrypt.hash(plain, 10)

    for (const u of SUPERUSERS) {
      const [existing] = await db
        .select()
        .from(members)
        .where(eq(members.email, u.email))
        .limit(1)

      if (!existing) {
        await db.insert(members).values({
          id: u.id,
          email: u.email,
          passwordHash,
          name: u.name,
          membershipTier: 'individual',
          status: 'approved',
          role: 'admin',
          createdAt: new Date(),
          approvedAt: new Date(),
        })
        console.log(`ensureSuperuserAccounts: seeded ${u.email} as admin`)
        continue
      }

      if (existing.role !== 'admin' || existing.status !== 'approved') {
        await db
          .update(members)
          .set({ role: 'admin', status: 'approved' })
          .where(eq(members.id, existing.id))
        console.log(`ensureSuperuserAccounts: promoted ${u.email} to admin`)
      }
    }

    // One-time password rebootstrap. Runs exactly once per database
    // (gated by app_migrations) so existing rows that were seeded with
    // an older bootstrap password get the current one applied. After the
    // marker lands, this UPDATE stops matching — Kiran can change his
    // password from /portal and nothing here will clobber it.
    await tryRun(`
      UPDATE members
      SET password_hash = '${passwordHash}'
      WHERE email IN ('${SUPERUSERS.map((s) => s.email).join("','")}')
        AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE name = '${PASSWORD_REBOOTSTRAP_MARKER}')
    `)
    await tryRun(`
      INSERT OR IGNORE INTO app_migrations (name, applied_at)
      VALUES ('${PASSWORD_REBOOTSTRAP_MARKER}', CAST(strftime('%s', 'now') AS INTEGER))
    `)
  } catch (e) {
    console.error('ensureSuperuserAccounts failed:', e instanceof Error ? e.message : e)
  }
}

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

    // Riya Sharma already existed in the members table from her own
    // website signup (she has a real email on that row). The chamber-
    // batch seed added a placeholder duplicate under Akash. Delete the
    // placeholder; the real row stays. If Akash isn't recorded as her
    // referrer on the real row, use "Set Referrer" from /admin/members.
    await tryRun(`
      DELETE FROM members
      WHERE email = 'cb-riya-sharma@noemail.cvicc.org'
    `)

    // One-time duplicate cleanup — Kiran reviewed the "Potential
    // duplicate members" diagnostic on 2026-10-23 and confirmed these
    // four rows are true duplicates to delete, keeping the paired
    // membership on each:
    //
    //   DELETE #1054 FadeHub Inc (buntysarhali@)      KEEP #0044 Baljit Kumar
    //   DELETE #1002 Manreet Ladhar (manreetladhar@)  KEEP #0047 (build@smsconstruction.us)
    //   DELETE #0004 Tushar Patel individual          KEEP #0025 corporate (tier upgrade)
    //   DELETE #1006 Mandeep Sandhu                   KEEP #0012 Sharnjit Sandhu (Kartar Trucking)
    //
    // Each DELETE is guarded by (membership_number AND email) so a row
    // that was edited post-deploy won't match and get accidentally
    // removed. Also unlinks any Square payments matched to these rows
    // first — the smarter sync (name/business fallback match) will
    // re-attach them to the correct kept member on the next sync.
    const DUP_CLEANUP_MARKER = 'dup_cleanup_2026_10_23_v1'
    await tryRun(`
      UPDATE square_payments
      SET matched_member_id = NULL
      WHERE matched_member_id IN (
        SELECT id FROM members
        WHERE (membership_number = '1054' AND email = 'buntysarhali@gmail.com')
           OR (membership_number = '1002' AND email = 'manreetladhar@gmail.com')
           OR (membership_number = '0004' AND email = 'pedierdoc@mac.com')
           OR (membership_number = '1006' AND email = 'msandhu07@yahoo.com')
      )
      AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE name = '${DUP_CLEANUP_MARKER}')
    `)
    await tryRun(`
      DELETE FROM members
      WHERE (
        (membership_number = '1054' AND email = 'buntysarhali@gmail.com')
        OR (membership_number = '1002' AND email = 'manreetladhar@gmail.com')
        OR (membership_number = '0004' AND email = 'pedierdoc@mac.com')
        OR (membership_number = '1006' AND email = 'msandhu07@yahoo.com')
      )
      AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE name = '${DUP_CLEANUP_MARKER}')
    `)
    await tryRun(`
      INSERT OR IGNORE INTO app_migrations (name, applied_at)
      VALUES ('${DUP_CLEANUP_MARKER}', CAST(strftime('%s', 'now') AS INTEGER))
    `)

    // Permanent superuser seed — Kiran Hundal's two emails (Treasurer/CFO).
    // Idempotent: creates missing rows, promotes to admin if downgraded,
    // one-time password rebootstrap via marker, then leaves passwords alone.
    await ensureSuperuserAccounts()

    // Board moderator seed — remaining 2026 board members (excluding Kiran=admin
    // and Gigi=reviewer). Idempotent: never downgrades admin/reviewer, never
    // touches passwords. Admin uses /admin/members → Set Temp Password to
    // actually issue sign-in credentials.
    await ensureBoardModerators()

    // Email corrections for placeholder rows from the chamber batch —
    // runs AFTER the main schema work. Each UPDATE is idempotent (only
    // matches rows still on the placeholder email), so re-runs are
    // no-ops and admin-edited rows are never clobbered.
    await applyEmailCorrections()
  } catch (e) {
    console.error('ensureMembersRenewalSchema fatal:', e)
  }
}
