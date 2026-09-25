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
      businessName: members.businessName,
      membershipTier: members.membershipTier,
      status: members.status,
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

    return NextResponse.json({
      isBoardMember: true,
      boardName: board.name,
      count: approved.length,
      referrals: approved.map((m) => ({
        id: m.id,
        name: m.name,
        businessName: m.businessName,
        membershipTier: m.membershipTier,
        approvedAt: m.approvedAt,
      })),
    })
  } catch (e) {
    console.error('portal my-referrals error:', e)
    return NextResponse.json({ isBoardMember: false, referrals: [], count: 0 })
  }
}
