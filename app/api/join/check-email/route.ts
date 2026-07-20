import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({ interval: 60_000, limit: 20 })

export async function POST(req: NextRequest) {
  const { success } = limiter(req)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required.' }, { status: 400 })
    }

    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.email, email.toLowerCase()))
      .limit(1)

    return NextResponse.json({ exists: existing.length > 0 })
  } catch (error) {
    console.error('Check-email error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
