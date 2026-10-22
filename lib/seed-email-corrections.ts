import { db } from './db'
import { sql } from 'drizzle-orm'

/**
 * Post-import corrections for chamber-batch rows. Each row maps a
 * placeholder email (the key) to the real contact fields we got from
 * the member later. Only fields present on an entry get updated —
 * `undefined` is skipped so a correction can touch just the email,
 * just the phone, or both.
 *
 * All UPDATEs are scoped to WHERE email = <placeholder>. Once a
 * correction runs successfully the placeholder is gone, so the WHERE
 * stops matching and re-runs are no-ops. If the admin later edits
 * contact details via the UI, we never overwrite because the
 * placeholder email isn't there anymore.
 */

interface Correction {
  email?: string
  phone?: string
  businessName?: string
  city?: string
  sector?: string
}

const CORRECTIONS: Record<string, Correction> = {
  // placeholder address → corrections
  'cb-gulab@noemail.cvicc.org': {
    email: 'bluegulab23@gmail.com',
  },
  'cb-chatore@noemail.cvicc.org': {
    email: 'chatore.fresno@gmail.com',
    phone: '+1-559-570-2309',
    city: 'Fresno',
  },
}

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

export async function applyEmailCorrections(): Promise<void> {
  for (const [placeholder, c] of Object.entries(CORRECTIONS)) {
    const sets: string[] = []
    if (c.email) sets.push(`email = '${esc(c.email.toLowerCase())}'`)
    if (c.phone) sets.push(`phone = '${esc(c.phone)}'`)
    if (c.businessName) sets.push(`business_name = '${esc(c.businessName)}'`)
    if (c.city) sets.push(`city = '${esc(c.city)}'`)
    if (c.sector) sets.push(`sector = '${esc(c.sector)}'`)
    if (c.email) {
      sets.push(`payment_reference = REPLACE(payment_reference, ' · [NEEDS EMAIL]', '')`)
    }
    if (sets.length === 0) continue

    try {
      await db.run(sql.raw(`
        UPDATE members
        SET ${sets.join(', ')}
        WHERE email = '${esc(placeholder)}'
      `))
    } catch (e) {
      console.error(`applyEmailCorrections: failed for ${placeholder}:`, e instanceof Error ? e.message : e)
    }
  }
}
