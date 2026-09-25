import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureMembersRenewalSchema } from '@/lib/ensure-members-schema'
import { createRenewalCheckoutLink } from '@/lib/square'

const RENEWAL_AMOUNTS: Record<string, number> = {
  individual: 9500,
  corporate: 39500,
}

export async function POST() {
  const session = await getServerSession(authOptions)
  const email = (session?.user as { email?: string } | undefined)?.email
  if (!email) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    await ensureMembersRenewalSchema()
    const [me] = await db.select().from(members).where(eq(members.email, email.toLowerCase())).limit(1)
    if (!me) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    if (me.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved members can renew.' }, { status: 400 })
    }

    const amountCents = RENEWAL_AMOUNTS[me.membershipTier || 'individual'] ?? RENEWAL_AMOUNTS.individual
    const siteUrl = process.env.NEXTAUTH_URL || 'https://www.indianchamberofcommerce.org'
    const redirect = `${siteUrl}/portal/renew/paid?memberId=${me.id}`

    const link = await createRenewalCheckoutLink({
      memberName: me.name,
      memberEmail: me.email,
      memberId: me.id,
      amountCents,
      redirectUrl: redirect,
    })

    return NextResponse.json({ success: true, paymentUrl: link.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to start renewal.'
    console.error('Renewal error:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
