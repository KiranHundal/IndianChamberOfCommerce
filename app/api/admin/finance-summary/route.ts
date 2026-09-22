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

  const approvedMembers = allMembers.filter((m) => m.status === 'approved')
  const pendingMembers = allMembers.filter((m) => m.status === 'pending')
  const individualCount = approvedMembers.filter((m) => m.membershipTier === 'individual').length
  const corporateCount = approvedMembers.filter((m) => m.membershipTier === 'corporate').length

  // Estimate amount for members that don't have amountPaid explicitly set
  // (older records from before manual payment tracking was added).
  // Uses founding-member pricing: $95 individual, $395 corporate.
  function inferredAmount(m: typeof allMembers[number]): number {
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

  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0)
  const expensesByCategory = allExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const invitationsSent = allInvitations.length
  const invitedEmails = new Set(allInvitations.map((i) => i.email.toLowerCase()))
  const invitationsConverted = allMembers.filter((m) => invitedEmails.has(m.email.toLowerCase())).length

  const memberList = allMembers
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      businessName: m.businessName,
      membershipTier: m.membershipTier,
      status: m.status,
      membershipNumber: m.membershipNumber,
      paymentMethod: m.paymentMethod,
      amountPaid: m.amountPaid,
      inferredAmount: inferredAmount(m),
      isEstimated: !m.amountPaid || m.amountPaid <= 0,
      paymentReference: m.paymentReference,
      paymentDate: m.paymentDate,
      createdAt: m.createdAt,
    }))
    .sort((a, b) => {
      const aDate = a.paymentDate ? new Date(a.paymentDate).getTime() : new Date(a.createdAt).getTime()
      const bDate = b.paymentDate ? new Date(b.paymentDate).getTime() : new Date(b.createdAt).getTime()
      return bDate - aDate
    })

  return NextResponse.json({
    memberCount: {
      total: allMembers.length,
      approved: approvedMembers.length,
      pending: pendingMembers.length,
      individual: individualCount,
      corporate: corporateCount,
    },
    revenue: {
      tracked: revenueTracked,
      byMethod: revenueByMethod,
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
    netPosition: revenueTracked - totalExpenses,
  })
}
