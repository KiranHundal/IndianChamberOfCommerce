import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [member] = await db
    .select({
      id: members.id,
      name: members.name,
      email: members.email,
      phone: members.phone,
      businessName: members.businessName,
      city: members.city,
      sector: members.sector,
      membershipTier: members.membershipTier,
      status: members.status,
      role: members.role,
      membershipNumber: members.membershipNumber,
      createdAt: members.createdAt,
      approvedAt: members.approvedAt,
    })
    .from(members)
    .where(eq(members.email, session.user.email.toLowerCase()))
    .limit(1)

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const approvedDate = member.approvedAt || member.createdAt
  const renewalDate = approvedDate ? new Date(new Date(approvedDate).getTime() + 365 * 24 * 60 * 60 * 1000) : null

  return NextResponse.json({
    ...member,
    renewalDate: renewalDate?.toISOString() || null,
  })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { phone, businessName, city, sector } = body

  await db
    .update(members)
    .set({
      phone: phone || null,
      businessName: businessName || null,
      city: city || null,
      sector: sector || null,
    })
    .where(eq(members.email, session.user.email.toLowerCase()))

  return NextResponse.json({ success: true })
}
