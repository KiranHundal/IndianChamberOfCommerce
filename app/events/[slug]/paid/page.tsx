import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { db } from '@/lib/db'
import { events, eventRsvps } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'
import { sendEventRsvpConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export default async function EventPaidPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { rsvpId?: string; orderId?: string; transactionId?: string }
}) {
  const rsvpId = searchParams.rsvpId
  let confirmed = false
  let title = ''

  if (rsvpId) {
    try {
      await ensureEventsSchema()
      const [event] = await db.select().from(events).where(eq(events.slug, params.slug)).limit(1)
      if (event) {
        title = event.title
        const [rsvp] = await db.select().from(eventRsvps).where(and(eq(eventRsvps.id, rsvpId), eq(eventRsvps.eventId, event.id))).limit(1)
        if (rsvp) {
          // Mark tentatively paid on the redirect. A follow-up sync from
          // the Square Payments endpoint reconciles the exact amount and
          // fee — see /api/admin/square/sync.
          if (!rsvp.paidAt) {
            const paid = 1 + (rsvp.guests || 0)
            const perTicket = rsvp.payMode === 'door' ? (event.priceCents ?? 0) + 500 : (event.priceCents ?? 0)
            const totalCents = perTicket * paid
            await db
              .update(eventRsvps)
              .set({
                paidAt: new Date(),
                paidAmount: totalCents,
                paymentMethod: 'square',
                paymentReference: searchParams.transactionId || searchParams.orderId || rsvp.squareOrderId || null,
                squareOrderId: searchParams.orderId || rsvp.squareOrderId,
              })
              .where(eq(eventRsvps.id, rsvpId))

            // Confirmation email was withheld before the redirect — send
            // it now that payment came back.
            try {
              await sendEventRsvpConfirmationEmail({
                to: rsvp.email,
                name: rsvp.name,
                guests: rsvp.guests,
                event: {
                  slug: event.slug,
                  title: event.title,
                  location: event.location,
                  address: event.address,
                  startAt: new Date(event.startAt),
                  endAt: event.endAt ? new Date(event.endAt) : null,
                  priceCents: perTicket,
                },
              })
            } catch (e) {
              console.error('Post-payment confirmation email failed:', e)
            }
          }
          confirmed = true
        }
      }
    } catch (e) {
      console.error('Payment confirmation page error:', e)
    }
  }

  return (
    <section className="bg-page-bg min-h-[60vh] flex items-center py-24">
      <div className="max-w-xl mx-auto px-8 text-center">
        {confirmed ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-6" />
            <h1 className="font-display text-3xl md:text-4xl text-brand mb-4">Payment received</h1>
            <p className="text-mid leading-relaxed mb-6">
              Your seat at <span className="text-brand font-medium">{title}</span> is confirmed. We&apos;ve emailed you the receipt and details — check your inbox in a minute.
            </p>
          </>
        ) : (
          <>
            <Clock className="w-14 h-14 text-gold-500 mx-auto mb-6" />
            <h1 className="font-display text-3xl md:text-4xl text-brand mb-4">Almost there</h1>
            <p className="text-mid leading-relaxed mb-6">
              If you were charged, your seat is being confirmed. It can take a moment for Square to notify us — refresh this page shortly or check your email for the receipt.
            </p>
          </>
        )}
        <Link href="/events" className="inline-flex items-center gap-2 font-label text-label tracking-label uppercase text-accent hover:text-gold-900 transition-colors">
          Back to events
        </Link>
      </div>
    </section>
  )
}
