import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.activationToken, token))
      .limit(1)

    if (!member) {
      return NextResponse.json({ error: 'Invalid or expired activation link.' }, { status: 400 })
    }

    if (member.status !== 'approved') {
      return NextResponse.json({ error: 'Your membership has not been approved yet.' }, { status: 400 })
    }

    if (member.passwordHash) {
      return NextResponse.json({ error: 'Account already created. Please sign in.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db
      .update(members)
      .set({ passwordHash, activationToken: null })
      .where(eq(members.id, member.id))

    return NextResponse.json({ success: true, message: 'Account created successfully. You can now sign in.' })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
