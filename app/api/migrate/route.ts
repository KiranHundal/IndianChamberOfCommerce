import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('key') !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const results: string[] = []

  try {
    await client.execute('ALTER TABLE members ADD COLUMN membership_number TEXT UNIQUE')
    results.push('Added membership_number column')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('duplicate column')) {
      results.push('membership_number column already exists')
    } else {
      results.push(`membership_number error: ${msg}`)
    }
  }

  return NextResponse.json({ success: true, results })
}
