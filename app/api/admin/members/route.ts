import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq, desc, isNotNull, count } from 'drizzle-orm'
import { sendMemberApprovedEmail } from '@/lib/email'

async function getNextMembershipNumber(): Promise<string> {
  const [latest] = await db
    .select({ membershipNumber: members.membershipNumber })
    .from(members)
    .where(isNotNull(members.membershipNumber))
    .orderBy(desc(members.membershipNumber))
    .limit(1)

  const lastNum = latest?.membershipNumber ? parseInt(latest.membershipNumber, 10) : 0
  return String(lastNum + 1).padStart(4, '0')
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown> | undefined)?.role
  if (!session?.user || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)))

  const [totalResult] = await db.select({ count: count() }).from(members)
  const total = totalResult.count

  const allMembers = await db.select().from(members).limit(limit).offset((page - 1) * limit)
  return NextResponse.json({ members: allMembers, page, limit, total })
}

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
      paymentMethod,
      amountPaid,
      paymentReference,
      paymentDate,
      sendEmail,
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (!paymentMethod || !['check', 'zelle', 'cash', 'other'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Payment method must be check, zelle, cash, or other.' }, { status: 400 })
    }
    const amount = parseInt(String(amountPaid), 10)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount paid must be a positive number.' }, { status: 400 })
    }
    const tier = membershipTier === 'corporate' ? 'corporate' : 'individual'

    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.email, email.toLowerCase()))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A member with this email already exists.' }, { status: 409 })
    }

    const membershipNumber = await getNextMembershipNumber()
    const id = crypto.randomUUID()
    const now = new Date()
    const parsedPaymentDate = paymentDate ? new Date(paymentDate) : now

    await db.insert(members).values({
      id,
      email: email.toLowerCase(),
      passwordHash: '',
      name,
      phone: phone || null,
      businessName: businessName || null,
      city: city || null,
      sector: sector || null,
      membershipTier: tier,
      status: 'approved',
      role: 'member',
      membershipNumber,
      createdAt: now,
      approvedAt: now,
      paymentMethod,
      amountPaid: amount,
      paymentReference: paymentReference || null,
      paymentDate: isNaN(parsedPaymentDate.getTime()) ? now : parsedPaymentDate,
    })

    let emailStatus: 'sent' | 'failed' | 'skipped' = 'skipped'
    if (sendEmail) {
      try {
        await sendMemberApprovedEmail({
          name,
          email: email.toLowerCase(),
          membershipTier: tier,
          membershipNumber,
        })
        emailStatus = 'sent'
      } catch (e) {
        console.error('Manual payment approval email error:', e)
        emailStatus = 'failed'
      }
    }

    return NextResponse.json({
      success: true,
      id,
      membershipNumber,
      emailStatus,
    })
  } catch (error) {
    console.error('Manual payment error:', error)
    const message = error instanceof Error ? error.message : 'Failed to log payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown> | undefined)?.role
  if (!session?.user || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId, action } = await req.json()

  if (!memberId || !action) {
    return NextResponse.json({ error: 'Missing memberId or action' }, { status: 400 })
  }

  if (action === 'approve') {
    const membershipNumber = await getNextMembershipNumber()

    await db.update(members).set({
      status: 'approved',
      approvedAt: new Date(),
      membershipNumber,
    }).where(eq(members.id, memberId))

    const [approved] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
    let emailFailed = false
    if (approved) {
      try {
        await sendMemberApprovedEmail({
          name: approved.name,
          email: approved.email,
          membershipTier: approved.membershipTier,
          membershipNumber,
        })
      } catch (emailError) {
        console.error('Approval email error:', emailError)
        emailFailed = true
      }
    }

    return NextResponse.json({ success: true, message: `Member approved. Membership #${membershipNumber}`, emailFailed })
  }

  if (action === 'reject') {
    await db.update(members).set({ status: 'rejected' }).where(eq(members.id, memberId))
    return NextResponse.json({ success: true, message: 'Member rejected.' })
  }

  if (action === 'deactivate') {
    if ((session.user as Record<string, unknown>).role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can deactivate members.' }, { status: 403 })
    }
    await db.update(members).set({ status: 'deactivated', deactivatedAt: new Date() }).where(eq(members.id, memberId))
    return NextResponse.json({ success: true, message: 'Member deactivated.' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
