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
    await client.execute('ALTER TABLE members ADD COLUMN activation_token TEXT')
    results.push('Added activation_token column')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('duplicate column')) {
      results.push('activation_token column already exists')
    } else {
      results.push(`activation_token error: ${msg}`)
    }
  }

  try {
    await client.execute("UPDATE members SET password_hash = 'LEGACY' WHERE password_hash IS NOT NULL AND password_hash != ''")
    results.push('Existing members preserved')
  } catch {
    results.push('No existing members to update')
  }

  return NextResponse.json({ success: true, results })
}
