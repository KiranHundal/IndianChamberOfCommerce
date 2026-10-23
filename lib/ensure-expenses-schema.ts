import { db } from './db'
import { sql } from 'drizzle-orm'

let ensured = false

async function tryRun(statement: string) {
  try {
    await db.run(sql.raw(statement))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/duplicate column|already exists/i.test(msg)) return
    console.error('ensureExpensesSchema statement failed:', statement, msg)
  }
}

/**
 * Idempotent ALTER TABLE for the expenses table. Adds columns introduced
 * after the initial deploy. Safe to re-run on every cold start.
 *
 * Columns added:
 *   - receipt_url (text, nullable): Vercel Blob URL of the uploaded
 *     receipt image, attached via the OCR flow on /admin/expenses.
 */
export async function ensureExpensesSchema() {
  if (ensured) return
  try {
    await tryRun(`ALTER TABLE expenses ADD COLUMN receipt_url TEXT`)
    ensured = true
  } catch (e) {
    console.error('ensureExpensesSchema fatal:', e)
  }
}
