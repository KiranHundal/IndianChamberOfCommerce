import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses, squarePayments } from '@/lib/schema'
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

  const [allExpenseRows, allPayments] = await Promise.all([
    db.select().from(expenses).orderBy(desc(expenses.expenseDate)),
    db.select().from(squarePayments),
  ])
  // Soft-deleted expenses are excluded from the CSV — the treasurer's
  // export should reflect live position only.
  const loggedExpenses = allExpenseRows.filter((e) => !e.deletedAt)

  const squareFees = allPayments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.feeCents, 0) / 100

  const headers = [
    'Date',
    'Category',
    'Vendor',
    'Description',
    'Amount ($)',
    'Payment Method',
    'Reference',
    'Created By',
    'Logged At',
  ]

  const lines = [headers.map(csvEscape).join(',')]
  for (const e of loggedExpenses) {
    lines.push([
      e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '',
      e.category,
      e.vendor,
      e.description || '',
      (e.amount).toFixed(2),
      e.paymentMethod || '',
      e.paymentReference || '',
      e.createdBy || '',
      e.createdAt ? new Date(e.createdAt).toISOString() : '',
    ].map(csvEscape).join(','))
  }

  // Add synthetic Square fees line at the top for total visibility
  if (squareFees > 0) {
    lines.push([
      new Date().toISOString().slice(0, 10),
      'Payment Processing (Square)',
      'Square',
      `Estimated fees on ${allPayments.filter((p) => p.status === 'COMPLETED').length} Square payments`,
      squareFees.toFixed(2),
      'auto-deducted',
      '',
      'system',
      '',
    ].map(csvEscape).join(','))
  }

  const csv = lines.join('\n')
  const filename = `cvicc-expenses-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
