import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureMembersRenewalSchema } from '@/lib/ensure-members-schema'

export const dynamic = 'force-dynamic'

/**
 * Square redirects here after a completed renewal checkout. We
 * tentatively extend expires_at by one year on the redirect; the
 * Square webhook (and manual sync as a backfill) will then reconcile
 * the actual paidAmount/paymentDate/paymentMethod authoritatively.
 */
export default async function RenewalPaidPage({
  searchParams,
}: {
  searchParams: { memberId?: string }
}) {
  const memberId = searchParams.memberId
  let confirmed = false
  let name = ''
  let newExpiry: Date | null = null

  if (memberId) {
    try {
      await ensureMembersRenewalSchema()
      const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
      if (m) {
        name = m.name
        // Push expiration forward: from whichever is later, current
        // expiresAt or today. Avoids penalizing early renewers.
        const now = new Date()
        const base = m.expiresAt && new Date(m.expiresAt) > now ? new Date(m.expiresAt) : now
        const bumped = new Date(base)
        bumped.setFullYear(bumped.getFullYear() + 1)
        newExpiry = bumped
        await db.update(members).set({
          expiresAt: bumped,
          paymentDate: now,
          renewalReminderSentAt: null,
        }).where(eq(members.id, memberId))
        confirmed = true
      }
    } catch (e) {
      console.error('Renewal confirmation page error:', e)
    }
  }

  return (
    <section className="bg-page-bg min-h-[60vh] flex items-center py-24">
      <div className="max-w-xl mx-auto px-8 text-center">
        {confirmed ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-6" />
            <h1 className="font-display text-3xl md:text-4xl text-brand mb-4">Renewal received</h1>
            <p className="text-mid leading-relaxed mb-2">
              Thank you{name ? `, ${name.split(' ')[0]}` : ''}. Your CVICC membership is active for another year.
            </p>
            {newExpiry && (
              <p className="text-mid leading-relaxed mb-6">
                Next renewal on <span className="text-brand font-medium">{newExpiry.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>.
              </p>
            )}
          </>
        ) : (
          <>
            <Clock className="w-14 h-14 text-gold-500 mx-auto mb-6" />
            <h1 className="font-display text-3xl md:text-4xl text-brand mb-4">Almost there</h1>
            <p className="text-mid leading-relaxed mb-6">
              If Square charged you, your renewal will settle in a moment. Refresh your portal shortly or watch your email for the receipt.
            </p>
          </>
        )}
        <Link href="/portal" className="inline-flex items-center gap-2 font-label text-label tracking-label uppercase text-accent hover:text-gold-900 transition-colors">
          Back to my portal
        </Link>
      </div>
    </section>
  )
}
