import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET() {
  const checks: Record<string, unknown> = {}

  checks.TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL ? 'set' : 'MISSING'
  checks.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ? 'set' : 'MISSING'
  checks.RESEND_API_KEY = process.env.RESEND_API_KEY ? 'set' : 'MISSING'

  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    const schema = await client.execute('PRAGMA table_info(members)')
    checks.table_schema = schema.rows

    const count = await client.execute('SELECT COUNT(*) as count FROM members')
    checks.member_count = count.rows[0]?.count

    const testId = 'test-' + Date.now()
    try {
      await client.execute({
        sql: 'INSERT INTO members (id, email, password_hash, name, membership_tier, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [testId, `test-${Date.now()}@test.com`, null, 'Test', 'individual', 'pending', 'member', Date.now()],
      })
      checks.raw_insert = 'OK'
      await client.execute({ sql: 'DELETE FROM members WHERE id = ?', args: [testId] })
      checks.cleanup = 'OK'
    } catch (e) {
      checks.raw_insert = 'FAILED'
      checks.raw_insert_error = e instanceof Error ? e.message : String(e)
    }
  } catch (e) {
    checks.db_connection = 'FAILED'
    checks.db_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(checks)
}
