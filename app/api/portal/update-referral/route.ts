import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'

/**
 * Board-member endpoint: edit a member they personally brought in.
 *
 * Scoping is strict — session email must match a board_members row,
 * and that board member must be recorded on `members.referred_by` of
 * the target row. No way for a board member to touch someone else's
 * referrals, their own self-row, or any admin/moderator account.
 *
 * Writable fields: name, email, phone, business_name, city, sector.
 * Deliberately NOT writable: status, membership_tier, amount_paid,
 * payment_*, role, referred_by, membership_number — those stay admin-
 * only to prevent a board member from quietly upgrading a referral to
 * corporate or reassigning attribution.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionEmail = (session?.user as { email?: string } | undefined)?.email?.toLowerCase()
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    memberId?: string
    name?: string
    email?: string
    phone?: string
    businessName?: string
    city?: string
    sector?: string
  }
  const { memberId } = body
  if (!memberId) {
    return NextResponse.json({ error: 'Missing memberId.' }, { status: 400 })
  }

  // Session email must map to a board_members row.
  const [board] = await db
    .select()
    .from(boardMembers)
    .where(eq(boardMembers.email, sessionEmail))
    .limit(1)
  if (!board) {
    return NextResponse.json({ error: 'Only board members can edit referrals.' }, { status: 403 })
  }

  // Target must have been referred by this board member.
  const [target] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!target) {
    return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  }
  if (target.referredBy !== board.id) {
    return NextResponse.json({ error: 'You can only edit members you personally referred.' }, { status: 403 })
  }

  const updates: Partial<typeof members.$inferInsert> = {}

  if (typeof body.name === 'string') {
    const trimmed = body.name.trim()
    if (!trimmed) return NextResponse.json({ error: 'Name cannot be blank.' }, { status: 400 })
    updates.name = trimmed
  }

  if (typeof body.email === 'string') {
    const emailTrimmed = body.email.trim().toLowerCase()
    if (!emailTrimmed) return NextResponse.json({ error: 'Email cannot be blank.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (emailTrimmed !== target.email.toLowerCase()) {
      const existing = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.email, emailTrimmed))
        .limit(1)
      if (existing.length > 0) {
        return NextResponse.json({ error: 'That email is already on another member.' }, { status: 409 })
      }
      updates.email = emailTrimmed
    }
  }

  if (typeof body.phone === 'string') {
    const t = body.phone.trim()
    updates.phone = t === '' ? null : t
  }
  if (typeof body.businessName === 'string') {
    const t = body.businessName.trim()
    updates.businessName = t === '' ? null : t
  }
  if (typeof body.city === 'string') {
    const t = body.city.trim()
    updates.city = t === '' ? null : t
  }
  if (typeof body.sector === 'string') {
    const t = body.sector.trim()
    updates.sector = t === '' ? null : t
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  // If an email was supplied, strip the "[NEEDS EMAIL]" marker and any
  // placeholder reference text so the row stops showing as flagged.
  if (updates.email && target.paymentReference?.includes('[NEEDS EMAIL]')) {
    updates.paymentReference = target.paymentReference.replace(' · [NEEDS EMAIL]', '')
  }

  await db.update(members).set(updates).where(eq(members.id, memberId))
  return NextResponse.json({ success: true })
}
