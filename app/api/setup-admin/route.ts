import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@libsql/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('key') !== 'cvicc-admin-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = url.searchParams.get('email')
  const password = url.searchParams.get('password')
  const name = url.searchParams.get('name')

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'email, password, and name are required' }, { status: 400 })
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    const existing = await client.execute({ sql: 'SELECT id FROM members WHERE email = ?', args: [email.toLowerCase()] })
    if (existing.rows.length > 0) {
      const passwordHash = await bcrypt.hash(password, 12)
      await client.execute({
        sql: 'UPDATE members SET password_hash = ?, role = ?, status = ? WHERE email = ?',
        args: [passwordHash, 'admin', 'approved', email.toLowerCase()],
      })
      return NextResponse.json({ success: true, message: 'Existing record updated to admin' })
    }

    const id = crypto.randomUUID()
    const passwordHash = await bcrypt.hash(password, 12)
    await client.execute({
      sql: 'INSERT INTO members (id, email, password_hash, name, membership_tier, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, email.toLowerCase(), passwordHash, name, 'individual', 'approved', 'admin', Date.now()],
    })

    return NextResponse.json({ success: true, message: 'Admin account created' })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
