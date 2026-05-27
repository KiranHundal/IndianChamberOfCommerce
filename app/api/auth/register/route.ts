import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({ interval: 60_000, limit: 5 })

export async function POST(req: NextRequest) {
  const { success } = limiter(req)
  if (!success) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { membershipNumber, password } = body

    if (!membershipNumber || !password) {
      return NextResponse.json({ error: 'Membership number and password are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const paddedNumber = String(membershipNumber).padStart(4, '0')

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.membershipNumber, paddedNumber))
      .limit(1)

    if (!member) {
      return NextResponse.json({ error: 'Invalid membership number.' }, { status: 400 })
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
      .set({ passwordHash })
      .where(eq(members.id, member.id))

    return NextResponse.json({ success: true, message: 'Account created successfully. You can now sign in.' })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
