import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'cvicc-team-add-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const name = searchParams.get('name')
  const email = searchParams.get('email')?.toLowerCase()
  const password = searchParams.get('password')
  const role = searchParams.get('role') || 'moderator'

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password params required' }, { status: 400 })
  }

  if (role !== 'moderator' && role !== 'admin') {
    return NextResponse.json({ error: 'role must be moderator or admin' }, { status: 400 })
  }

  const [existing] = await db.select({ id: members.id, role: members.role }).from(members).where(eq(members.email, email)).limit(1)

  const passwordHash = await bcrypt.hash(password, 10)

  if (existing) {
    await db.update(members).set({ role, passwordHash, status: 'approved' }).where(eq(members.email, email))
    return NextResponse.json({ success: true, message: `Updated existing account ${email} to ${role} with new password.` })
  }

  await db.insert(members).values({
    id: crypto.randomUUID(),
    email,
    passwordHash,
    name,
    membershipTier: 'individual',
    status: 'approved',
    role,
    createdAt: new Date(),
    approvedAt: new Date(),
  })

  return NextResponse.json({ success: true, message: `Created ${role} account for ${email}.` })
}
