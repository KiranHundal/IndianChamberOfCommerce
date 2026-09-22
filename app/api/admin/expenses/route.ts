import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses } from '@/lib/schema'
import { desc } from 'drizzle-orm'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await db.select().from(expenses).orderBy(desc(expenses.expenseDate))
  return NextResponse.json({ expenses: rows })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { category, vendor, description, amount, paymentMethod, paymentReference, expenseDate } = body

    if (!category || !vendor) {
      return NextResponse.json({ error: 'Category and vendor are required.' }, { status: 400 })
    }
    const parsedAmount = parseInt(String(amount), 10)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
    }
    const date = expenseDate ? new Date(expenseDate) : new Date()
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date.' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await db.insert(expenses).values({
      id,
      category,
      vendor,
      description: description || null,
      amount: parsedAmount,
      paymentMethod: paymentMethod || null,
      paymentReference: paymentReference || null,
      expenseDate: date,
      createdAt: new Date(),
      createdBy: session.user?.email || null,
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Expense create error:', error)
    const message = error instanceof Error ? error.message : 'Failed to log expense'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
