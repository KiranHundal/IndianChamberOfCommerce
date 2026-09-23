import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { invitations } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { sendMembershipInvitationEmail } from '@/lib/email'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await db.select().from(invitations).orderBy(desc(invitations.sentAt))
  return NextResponse.json({ invitations: rows })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { email, name, businessName, suggestedTier, personalNote, fromName } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    const tier = ['individual', 'corporate'].includes(suggestedTier) ? suggestedTier : null

    try {
      await sendMembershipInvitationEmail({
        email: email.toLowerCase(),
        name: name || null,
        businessName: businessName || null,
        suggestedTier: tier,
        personalNote: personalNote || null,
        fromName: fromName || null,
      })
    } catch (e) {
      console.error('Invitation email error:', e)
      return NextResponse.json({ error: 'Failed to send invitation email.' }, { status: 500 })
    }

    const id = crypto.randomUUID()
    await db.insert(invitations).values({
      id,
      email: email.toLowerCase(),
      name: name || null,
      businessName: businessName || null,
      suggestedTier: tier,
      personalNote: personalNote || null,
      sentAt: new Date(),
      sentBy: session.user?.email || null,
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Invitation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send invitation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
