import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = (session?.user as { email?: string } | undefined)?.email?.toLowerCase()
  if (!email) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    // Referrals only exist for board members — regular members are
    // referred BY someone, not FROM. Match by email.
    const [board] = await db.select().from(boardMembers).where(eq(boardMembers.email, email)).limit(1)
    if (!board) return NextResponse.json({ isBoardMember: false, referrals: [], count: 0 })

    const referredMembers = await db.select({
      id: members.id,
      name: members.name,
      email: members.email,
      phone: members.phone,
      businessName: members.businessName,
      city: members.city,
      sector: members.sector,
      membershipTier: members.membershipTier,
      status: members.status,
      amountPaid: members.amountPaid,
      approvedAt: members.approvedAt,
      createdAt: members.createdAt,
    }).from(members).where(eq(members.referredBy, board.id))

    // Only surface approved members. Pending applicants can be a noisy
    // vanity metric before the admin has a chance to review them.
    const approved = referredMembers.filter((m) => m.status === 'approved')
    approved.sort((a, b) => {
      const ad = a.approvedAt ? new Date(a.approvedAt).getTime() : new Date(a.createdAt).getTime()
      const bd = b.approvedAt ? new Date(b.approvedAt).getTime() : new Date(b.createdAt).getTime()
      return bd - ad
    })

    // Revenue brought in = actual money banked. We use amountPaid as
    // recorded; we don't fall back to the tier price because members
    // can pay any amount — a $200 contribution isn't magically $395
    // just because the member row is on the corporate tier. Rows with
    // amountPaid still unset contribute $0, which is honest.
    const totalRevenue = approved.reduce((sum, m) => {
      return sum + (m.amountPaid && m.amountPaid > 0 ? m.amountPaid : 0)
    }, 0)

    return NextResponse.json({
      isBoardMember: true,
      boardName: board.name,
      count: approved.length,
      revenue: totalRevenue,
      referrals: approved.map((m) => {
        const isPlaceholder = m.email.toLowerCase().endsWith('@noemail.cvicc.org')
        return {
          id: m.id,
          name: m.name,
          email: isPlaceholder ? '' : m.email,
          phone: m.phone,
          businessName: m.businessName,
          city: m.city,
          sector: m.sector,
          membershipTier: m.membershipTier,
          amountPaid: m.amountPaid && m.amountPaid > 0 ? m.amountPaid : 0,
          approvedAt: m.approvedAt,
          needsEmail: isPlaceholder,
        }
      }),
    })
  } catch (e) {
    console.error('portal my-referrals error:', e)
    return NextResponse.json({ isBoardMember: false, referrals: [], count: 0 })
  }
}
