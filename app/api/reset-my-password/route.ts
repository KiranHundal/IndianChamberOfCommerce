import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const ALLOWED_EMAIL = 'kiran.farmers@gmail.com'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  const newPassword = searchParams.get('password')

  if (key !== 'cvicc-reset-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters. Pass it as ?password=xxx' }, { status: 400 })
  }

  const [member] = await db
    .select({ id: members.id, email: members.email })
    .from(members)
    .where(eq(members.email, ALLOWED_EMAIL))
    .limit(1)

  if (!member) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await db.update(members).set({ passwordHash: hash }).where(eq(members.email, ALLOWED_EMAIL))

  return NextResponse.json({ success: true, message: `Password reset for ${ALLOWED_EMAIL}. You can now log in.` })
}
