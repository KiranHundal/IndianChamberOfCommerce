import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, expenses, invitations } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allMembers = await db.select().from(members).catch(() => [])
  const allExpenses = await db
    .select()
    .from(expenses)
    .orderBy(desc(expenses.expenseDate))
    .catch(() => [] as (typeof expenses.$inferSelect)[])
  const allInvitations = await db
    .select()
    .from(invitations)
    .orderBy(desc(invitations.sentAt))
    .catch(() => [] as (typeof invitations.$inferSelect)[])

  const nonStaffMembers = allMembers.filter((m) => m.role !== 'admin' && m.role !== 'moderator')
  const approvedMembers = nonStaffMembers.filter((m) => m.status === 'approved')
  const pendingMembers = nonStaffMembers.filter((m) => m.status === 'pending')
  const individualCount = approvedMembers.filter((m) => m.membershipTier === 'individual').length
  const corporateCount = approvedMembers.filter((m) => m.membershipTier === 'corporate').length

  // Estimate amount for members that don't have amountPaid explicitly set
  // (older records from before manual payment tracking was added).
  // Uses founding-member pricing: $95 individual, $395 corporate.
  // Admin and moderator accounts are staff, not paying members — they never
  // count toward revenue even if they have an amountPaid on record.
  function inferredAmount(m: typeof allMembers[number]): number {
    if (m.role === 'admin' || m.role === 'moderator') return 0
    if (m.amountPaid && m.amountPaid > 0) return m.amountPaid
    if (m.status !== 'approved') return 0
    return m.membershipTier === 'corporate' ? 395 : 95
  }

  const revenueTracked = allMembers.reduce((sum, m) => sum + inferredAmount(m), 0)

  const revenueByMethod = allMembers.reduce<Record<string, number>>((acc, m) => {
    const amount = inferredAmount(m)
    if (amount === 0) return acc
    const key = m.paymentMethod || 'square'
    acc[key] = (acc[key] || 0) + amount
    return acc
  }, {})

  // Square processing fees: 2.9% + $0.30 per transaction on Card/Online payments.
  // Only Square-paid members incur fees; check, Zelle, cash don't.
  const SQUARE_FEE_RATE = 0.029
  const SQUARE_FEE_FIXED = 0.30
  const squareTransactions = allMembers.filter((m) => {
    if (m.role === 'admin' || m.role === 'moderator') return false
    const amount = inferredAmount(m)
    if (amount <= 0) return false
    const method = m.paymentMethod || 'square'
    return method === 'square'
  })
  const squareGross = squareTransactions.reduce((sum, m) => sum + inferredAmount(m), 0)
  const estimatedSquareFees = Math.round(
    squareTransactions.reduce((sum, m) => sum + inferredAmount(m) * SQUARE_FEE_RATE + SQUARE_FEE_FIXED, 0) * 100
  ) / 100
  const netRevenue = Math.round((revenueTracked - estimatedSquareFees) * 100) / 100

  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0)
  const expensesByCategory = allExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const invitationsSent = allInvitations.length
  const invitedEmails = new Set(allInvitations.map((i) => i.email.toLowerCase()))
  const invitationsConverted = allMembers.filter((m) => invitedEmails.has(m.email.toLowerCase())).length

  const memberList = allMembers
    .map((m) => {
      const isStaff = m.role === 'admin' || m.role === 'moderator'
      const amt = inferredAmount(m)
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        businessName: m.businessName,
        membershipTier: m.membershipTier,
        status: m.status,
        role: m.role,
        membershipNumber: m.membershipNumber,
        paymentMethod: m.paymentMethod,
        amountPaid: m.amountPaid,
        inferredAmount: amt,
        isEstimated: !isStaff && (!m.amountPaid || m.amountPaid <= 0) && amt > 0,
        isStaff,
        paymentReference: m.paymentReference,
        paymentDate: m.paymentDate,
        createdAt: m.createdAt,
      }
    })
    .sort((a, b) => {
      const aDate = a.paymentDate ? new Date(a.paymentDate).getTime() : new Date(a.createdAt).getTime()
      const bDate = b.paymentDate ? new Date(b.paymentDate).getTime() : new Date(b.createdAt).getTime()
      return bDate - aDate
    })

  return NextResponse.json({
    memberCount: {
      total: nonStaffMembers.length,
      approved: approvedMembers.length,
      pending: pendingMembers.length,
      individual: individualCount,
      corporate: corporateCount,
    },
    revenue: {
      tracked: revenueTracked,
      byMethod: revenueByMethod,
      squareGross,
      squareTransactionCount: squareTransactions.length,
      estimatedSquareFees,
      net: netRevenue,
    },
    expenses: {
      total: totalExpenses,
      byCategory: expensesByCategory,
      recent: allExpenses.slice(0, 10),
    },
    invitations: {
      sent: invitationsSent,
      converted: invitationsConverted,
      recent: allInvitations.slice(0, 10),
    },
    memberList,
    netPosition: Math.round((netRevenue - totalExpenses) * 100) / 100,
  })
}
