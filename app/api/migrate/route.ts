import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')
  if (key !== 'cvicc-migrate-2026' && key !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const results: string[] = []

  const columns = [
    { name: 'membership_number', type: 'TEXT' },
    { name: 'approved_at', type: 'INTEGER' },
    { name: 'deactivated_at', type: 'INTEGER' },
  ]

  for (const col of columns) {
    try {
      await client.execute(`ALTER TABLE members ADD COLUMN ${col.name} ${col.type}`)
      results.push(`Added ${col.name} column`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('duplicate column')) {
        results.push(`${col.name} column already exists`)
      } else {
        results.push(`${col.name} error: ${msg}`)
      }
    }
  }

  try {
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_members_membership_number ON members(membership_number)')
    results.push('Created unique index on membership_number')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push(`unique index error: ${msg}`)
  }

  return NextResponse.json({ success: true, results })
}
