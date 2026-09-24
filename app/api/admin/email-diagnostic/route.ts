import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Resend } from 'resend'

/**
 * Email diagnostic. Reports which env vars are set, what Resend
 * returns when you fire a test message, and (optionally) sends that
 * test to the admin's own address so they can confirm delivery.
 *
 * GET  /api/admin/email-diagnostic          → status only, no send
 * GET  /api/admin/email-diagnostic?send=1   → send a test to your session email
 * GET  /api/admin/email-diagnostic?to=user@example.com → send to a specific address
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string; email?: string } | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Sign in as admin.' }, { status: 401 })
  }

  const url = new URL(req.url)
  const send = url.searchParams.get('send') === '1' || !!url.searchParams.get('to')
  const to = url.searchParams.get('to') || user.email || ''

  const config = {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL || 'info@indianchamberofcommerce.org (fallback default)',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'info@indianchamberofcommerce.org (fallback default)',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      configured: false,
      config,
      message: 'RESEND_API_KEY is not set on this Vercel deployment. No email can be sent from this environment. Add the env var in Vercel → Settings → Environment Variables and redeploy.',
    })
  }

  if (!send) {
    return NextResponse.json({
      configured: true,
      config,
      message: 'RESEND_API_KEY is set. To fire a test send, hit /api/admin/email-diagnostic?send=1 (to your own email) or ?to=someone@example.com.',
    })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'info@indianchamberofcommerce.org'
  const testSubject = `CVICC email diagnostic — ${new Date().toISOString()}`
  const testHtml = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 40px auto;">
      <h2 style="color: #1E3A5F;">CVICC email test</h2>
      <p>If you're reading this, Resend delivery is working from this Vercel deployment to <strong>${to}</strong>.</p>
      <p style="color: #5A6A7A; font-size: 12px;">Sent at ${new Date().toISOString()}. If you're not the intended recipient, ignore this — it was fired by an admin diagnostic.</p>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: `CVICC <${fromEmail}>`,
      to,
      subject: testSubject,
      html: testHtml,
    })
    if (result && 'error' in result && result.error) {
      return NextResponse.json({
        configured: true,
        config,
        sent: false,
        to,
        resendError: result.error,
        interpretation: interpretError(result.error),
      })
    }
    return NextResponse.json({
      configured: true,
      config,
      sent: true,
      to,
      resendData: 'data' in result ? result.data : null,
      message: `Test email queued to ${to}. Check inbox and spam. Delivery to the sender-owner's own address usually works even on the free tier; delivery to other addresses only works if the FROM_EMAIL domain is verified in Resend.`,
    })
  } catch (err) {
    return NextResponse.json({
      configured: true,
      config,
      sent: false,
      to,
      throw: err instanceof Error ? { name: err.name, message: err.message } : String(err),
    })
  }
}

function interpretError(err: unknown): string {
  const e = err as { name?: string; message?: string; statusCode?: number }
  const msg = (e.message || '').toLowerCase()
  const name = (e.name || '').toLowerCase()
  if (msg.includes('domain') || name.includes('domain')) {
    return `The FROM domain isn't verified in Resend. Verify it at resend.com/domains, or change FROM_EMAIL to onboarding@resend.dev (which Resend allows without verification).`
  }
  if (msg.includes('testing') || msg.includes('only send') || e.statusCode === 403) {
    return `Resend's free tier lets you only send to your own account owner's email until a custom domain is verified. Verify the FROM domain in Resend or upgrade the plan.`
  }
  if (e.statusCode === 429) {
    return `Rate limit — wait a minute and retry.`
  }
  return `Uninterpreted Resend error. Full body above.`
}
