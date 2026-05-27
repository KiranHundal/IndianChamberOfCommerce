import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendMemberPendingEmail, sendAdminNewApplicationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, businessName, city, sector, membershipTier } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(members)
      .where(eq(members.email, email.toLowerCase()))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'An application with this email already exists.' }, { status: 409 })
    }

    const id = crypto.randomUUID()

    await db.insert(members).values({
      id,
      email: email.toLowerCase(),
      passwordHash: null,
      name,
      phone: phone || null,
      businessName: businessName || null,
      city: city || null,
      sector: sector || null,
      membershipTier: membershipTier || 'individual',
      status: 'pending',
      role: 'member',
      createdAt: new Date(),
    })

    try {
      await sendMemberPendingEmail({ name, email: email.toLowerCase(), membershipTier: membershipTier || 'individual' })
      await sendAdminNewApplicationEmail({
        name,
        email: email.toLowerCase(),
        membershipTier: membershipTier || 'individual',
        phone,
        businessName,
        city,
        sector,
      })
    } catch (emailError) {
      console.error('Email send error:', emailError)
    }

    return NextResponse.json({ success: true, message: 'Application submitted. Pending admin approval.' })
  } catch (error) {
    console.error('Confirm error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
