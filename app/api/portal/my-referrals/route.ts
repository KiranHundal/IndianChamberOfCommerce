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
      paymentMethod: members.paymentMethod,
      approvedAt: members.approvedAt,
      createdAt: members.createdAt,
    }).from(members).where(eq(members.referredBy, board.id))

    // Surface approved members AND pending-with-payment (money in the
    // chamber's account, awaiting admin approval). Rejected and
    // deactivated rows stay hidden — those were refunded.
    const approved = referredMembers.filter((m) => {
      if (m.status === 'rejected' || m.status === 'deactivated') return false
      if (m.status === 'approved') return true
      if (m.status === 'pending') {
        const hasAmount = m.amountPaid != null && m.amountPaid > 0
        const hasMethod = !!m.paymentMethod
        return hasAmount || hasMethod
      }
      return false
    })
    approved.sort((a, b) => {
      const ad = a.approvedAt ? new Date(a.approvedAt).getTime() : new Date(a.createdAt).getTime()
      const bd = b.approvedAt ? new Date(b.approvedAt).getTime() : new Date(b.createdAt).getTime()
      return bd - ad
    })

    // Revenue brought in — only count payments actually received.
    // amountPaid wins when > 0 (members can pay any amount). Tier
    // floor only kicks in when a paymentMethod was logged but the
    // amount wasn't — approved rows with no payment evidence at all
    // contribute $0 (status alone doesn't mean money arrived).
    const totalRevenue = approved.reduce((sum, m) => {
      let dollars = 0
      if (m.amountPaid && m.amountPaid > 0) dollars = m.amountPaid
      else if (m.paymentMethod) dollars = m.membershipTier === 'corporate' ? 395 : 95
      return sum + dollars
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
          amountPaid: m.amountPaid && m.amountPaid > 0
            ? m.amountPaid
            : m.paymentMethod
              ? (m.membershipTier === 'corporate' ? 395 : 95)
              : 0,
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
