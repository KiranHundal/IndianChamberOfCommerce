import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both current and new passwords are required.' }, { status: 400 })
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 })
  }

  const email = session.user.email.toLowerCase()
  const [member] = await db.select().from(members).where(eq(members.email, email)).limit(1)

  if (!member || !member.passwordHash) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, member.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await db.update(members).set({ passwordHash: newHash }).where(eq(members.email, email))

  return NextResponse.json({ success: true, message: 'Password updated successfully.' })
}
