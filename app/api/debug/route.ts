import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET() {
  const checks: Record<string, string> = {}

  checks.TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL ? 'set' : 'MISSING'
  checks.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ? 'set' : 'MISSING'
  checks.RESEND_API_KEY = process.env.RESEND_API_KEY ? 'set' : 'MISSING'

  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const result = await client.execute('SELECT COUNT(*) as count FROM members')
    checks.db_connection = 'OK'
    checks.member_count = String(result.rows[0]?.count ?? 0)
  } catch (e) {
    checks.db_connection = 'FAILED'
    checks.db_error = e instanceof Error ? e.message : String(e)
  }

  try {
    const { db } = await import('@/lib/db')
    const { members } = await import('@/lib/schema')
    const rows = await db.select({ id: members.id }).from(members).limit(1)
    checks.drizzle_query = 'OK'
    checks.drizzle_rows = String(rows.length)
  } catch (e) {
    checks.drizzle_query = 'FAILED'
    checks.drizzle_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(checks)
}
