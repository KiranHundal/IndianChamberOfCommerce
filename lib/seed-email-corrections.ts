import { db } from './db'
import { sql } from 'drizzle-orm'

/**
 * Email corrections for members originally inserted with placeholder
 * `cb-<slug>@noemail.cvicc.org` addresses because their real email
 * wasn't collected at the time of the Oct 2026 chamber-batch import.
 *
 * Each entry is idempotent — the WHERE clause only matches rows whose
 * email is still the placeholder, so once an admin edits the row (or
 * this correction runs once), subsequent runs are no-ops. If the admin
 * later edits the email to something else via the UI, this file will
 * never overwrite it.
 *
 * Add new entries as emails come in from the board members.
 */
const CORRECTIONS: Record<string, string> = {
  // placeholder → real email
  'cb-gulab@noemail.cvicc.org': 'bluegulab23@gmail.com',
}

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

export async function applyEmailCorrections(): Promise<void> {
  for (const [placeholder, realEmail] of Object.entries(CORRECTIONS)) {
    try {
      await db.run(sql.raw(`
        UPDATE members
        SET email = '${esc(realEmail.toLowerCase())}',
            payment_reference = REPLACE(payment_reference, ' · [NEEDS EMAIL]', '')
        WHERE email = '${esc(placeholder)}'
      `))
    } catch (e) {
      console.error(`applyEmailCorrections: failed for ${placeholder} → ${realEmail}:`, e instanceof Error ? e.message : e)
    }
  }
}
