import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { asc } from 'drizzle-orm'

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

  const rows = await db.select().from(members).orderBy(asc(members.membershipNumber))

  const headers = [
    'Membership #',
    'Name',
    'Email',
    'Phone',
    'Business Name',
    'City',
    'Sector',
    'Tier',
    'Status',
    'Role',
    'Amount Paid',
    'Payment Method',
    'Payment Reference',
    'Payment Date',
    'Approved Date',
    'Created Date',
  ]

  const lines = [headers.map(csvEscape).join(',')]
  for (const m of rows) {
    lines.push([
      m.membershipNumber || '',
      m.name,
      m.email,
      m.phone || '',
      m.businessName || '',
      m.city || '',
      m.sector || '',
      m.membershipTier,
      m.status,
      m.role,
      m.amountPaid || '',
      m.paymentMethod || '',
      m.paymentReference || '',
      m.paymentDate ? new Date(m.paymentDate).toISOString().slice(0, 10) : '',
      m.approvedAt ? new Date(m.approvedAt).toISOString().slice(0, 10) : '',
      m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : '',
    ].map(csvEscape).join(','))
  }

  const csv = lines.join('\n')
  const filename = `cvicc-members-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
