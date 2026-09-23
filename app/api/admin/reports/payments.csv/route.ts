import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { squarePayments, members } from '@/lib/schema'
import { desc } from 'drizzle-orm'

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 })
  }

  const [payments, allMembers] = await Promise.all([
    db.select().from(squarePayments).orderBy(desc(squarePayments.paidAt)),
    db.select().from(members),
  ])
  const memberById = new Map(allMembers.map((m) => [m.id, m]))

  const headers = [
    'Payment ID',
    'Status',
    'Gross ($)',
    'Fee ($)',
    'Refunded ($)',
    'Net ($)',
    'Buyer Name (Square)',
    'Buyer Email (Square)',
    'Card',
    'Last 4',
    'Receipt #',
    'Order ID',
    'Paid At',
    'Matched Member',
    'Membership #',
    'Member Email',
  ]

  const lines = [headers.map(csvEscape).join(',')]
  for (const p of payments) {
    const matched = p.matchedMemberId ? memberById.get(p.matchedMemberId) : null
    const gross = p.amountCents / 100
    const fee = p.feeCents / 100
    const refunded = p.refundedCents / 100
    lines.push([
      p.id,
      p.status,
      gross.toFixed(2),
      fee.toFixed(2),
      refunded.toFixed(2),
      (gross - fee - refunded).toFixed(2),
      p.buyerName || '',
      p.buyerEmail || '',
      p.cardBrand || '',
      p.last4 || '',
      p.receiptNumber || '',
      p.orderId || '',
      p.paidAt ? new Date(p.paidAt).toISOString() : '',
      matched?.name || '',
      matched?.membershipNumber || '',
      matched?.email || '',
    ].map(csvEscape).join(','))
  }

  const csv = lines.join('\n')
  const filename = `cvicc-square-payments-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
