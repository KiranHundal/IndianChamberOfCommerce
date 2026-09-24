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
    const { email, name, businessName, suggestedTier, personalNote, fromName, fromDesignation, fromEmail, fromReplyTo, textOnly, subjectOverride, bodyOverride } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    // Send-From is a whitelist — only the 3 addresses verified in Resend
    // (info, sonia, raj). Anything else including a typo silently fails at
    // Resend, so reject early with a clear message. Blank means info@.
    const ALLOWED_SENDERS = new Set([
      'info@indianchamberofcommerce.org',
      'sonia@indianchamberofcommerce.org',
      'raj@indianchamberofcommerce.org',
    ])
    if (fromEmail && typeof fromEmail === 'string' && fromEmail.trim()) {
      const trimmed = fromEmail.trim().toLowerCase()
      if (!ALLOWED_SENDERS.has(trimmed)) {
        return NextResponse.json(
          {
            error: `"Send From" must be one of the verified addresses: info@, sonia@, or raj@indianchamberofcommerce.org. You entered: ${fromEmail}`,
          },
          { status: 400 }
        )
      }
    }
    const tier = ['individual', 'corporate'].includes(suggestedTier) ? suggestedTier : null

    try {
      const result = await sendMembershipInvitationEmail({
        email: email.toLowerCase(),
        name: name || null,
        businessName: businessName || null,
        suggestedTier: tier,
        personalNote: personalNote || null,
        fromName: fromName || null,
        fromDesignation: fromDesignation || null,
        fromEmail: fromEmail || null,
        fromReplyTo: fromReplyTo || null,
        textOnly: !!textOnly,
        subjectOverride: subjectOverride || null,
        bodyOverride: bodyOverride || null,
      })
      // Resend returns { data, error } on the response body. A 2xx HTTP can
      // still carry a delivery error inside (unverified domain, bad address,
      // rate limit) — surface that so admins actually see what went wrong.
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        console.error('Resend delivery error:', result.error)
        const err = result.error as { name?: string; message?: string; statusCode?: number }
        return NextResponse.json(
          {
            error: `Email provider rejected the send: ${err.message || err.name || 'unknown'}. Common cause: the FROM domain isn't verified in Resend, or the free tier only allows delivery to the account owner's address.`,
            resend: err,
          },
          { status: 502 }
        )
      }
    } catch (e) {
      console.error('Invitation email throw:', e)
      const msg = e instanceof Error ? e.message : 'Unknown error'
      return NextResponse.json({ error: `Failed to send invitation email: ${msg}` }, { status: 500 })
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
