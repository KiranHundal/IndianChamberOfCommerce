import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

/**
 * Create a pending member row — no payment yet. Used when an admin needs
 * to onboard a prospect whose device blocks the public join form (common
 * for bank / healthcare / government IT policies). After this, admin
 * emails them a Square payment link; the sync + webhook match the
 * payment to this row by email.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown> | undefined)?.role
  if (!session?.user || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      name,
      email,
      phone,
      businessName,
      city,
      sector,
      membershipTier,
      referredBy,
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim()
    const tier = membershipTier === 'corporate' ? 'corporate' : 'individual'

    const existing = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(eq(members.email, normalizedEmail))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `A member with ${normalizedEmail} already exists (${existing[0].name}).` },
        { status: 409 }
      )
    }

    const id = crypto.randomUUID()
    await db.insert(members).values({
      id,
      email: normalizedEmail,
      passwordHash: '',
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : null,
      businessName: businessName ? String(businessName).trim() : null,
      city: city ? String(city).trim() : null,
      sector: sector ? String(sector).trim() : null,
      membershipTier: tier,
      status: 'pending',
      role: 'member',
      referredBy: referredBy || null,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create member.'
    console.error('Add pending member error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
