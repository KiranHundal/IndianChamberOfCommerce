import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')
  if (key !== process.env.NEXTAUTH_SECRET && key !== 'cvicc-migrate-finance-2026') {
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
    { name: 'payment_method', type: 'TEXT' },
    { name: 'amount_paid', type: 'INTEGER' },
    { name: 'payment_reference', type: 'TEXT' },
    { name: 'payment_date', type: 'INTEGER' },
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

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS leader_videos (
        leader_name TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
    results.push('Created leader_videos table')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push(`leader_videos table error: ${msg}`)
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS board_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Board Member',
        bio TEXT,
        photo_url TEXT,
        email TEXT,
        display_order INTEGER NOT NULL DEFAULT 100,
        created_at INTEGER NOT NULL,
        welcome_email_sent_at INTEGER
      )
    `)
    results.push('Created board_members table')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push(`board_members table error: ${msg}`)
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        vendor TEXT NOT NULL,
        description TEXT,
        amount INTEGER NOT NULL,
        payment_method TEXT,
        payment_reference TEXT,
        expense_date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        created_by TEXT
      )
    `)
    results.push('Created expenses table')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push(`expenses table error: ${msg}`)
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS invitations (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        business_name TEXT,
        suggested_tier TEXT,
        personal_note TEXT,
        sent_at INTEGER NOT NULL,
        sent_by TEXT,
        converted_at INTEGER
      )
    `)
    results.push('Created invitations table')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push(`invitations table error: ${msg}`)
  }

  const boardColumns = [
    { name: 'email', type: 'TEXT' },
    { name: 'welcome_email_sent_at', type: 'INTEGER' },
  ]
  for (const col of boardColumns) {
    try {
      await client.execute(`ALTER TABLE board_members ADD COLUMN ${col.name} ${col.type}`)
      results.push(`Added board_members.${col.name}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('duplicate column')) {
        results.push(`board_members.${col.name} already exists`)
      } else {
        results.push(`board_members.${col.name} error: ${msg}`)
      }
    }
  }

  return NextResponse.json({ success: true, results })
}
