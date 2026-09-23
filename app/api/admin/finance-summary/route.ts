import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, expenses, invitations, squarePayments, squareSync } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { nameSimilarity } from '@/lib/name-match'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
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
  const allSquarePayments = await db
    .select()
    .from(squarePayments)
    .orderBy(desc(squarePayments.paidAt))
    .catch(() => [] as (typeof squarePayments.$inferSelect)[])
  const [lastSyncRow] = await db
    .select()
    .from(squareSync)
    .orderBy(desc(squareSync.startedAt))
    .limit(1)
    .catch(() => [] as (typeof squareSync.$inferSelect)[])

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

  // Members that ARE linked to a Square payment — their money is already in
  // squareGross (below), so we mustn't double-count their inferred amount.
  const squareLinkedMemberIds = new Set(
    allSquarePayments.map((p) => p.matchedMemberId).filter((id): id is string => Boolean(id))
  )

  const OFFLINE_METHODS = ['check', 'zelle', 'cash', 'other']

  // "Has Square receipt" is now STRICT — the member must actually appear in
  // the Square payments table. Records that just have paymentMethod='square'
  // in our DB but no matching Square payment are treated as unverified, so
  // they surface as the missing-from-Square rows in the members list.
  const hasSquareReceipt = (m: typeof allMembers[number]) =>
    squareLinkedMemberIds.has(m.id)

  // Verified offline revenue: members WITHOUT a Square receipt, WITH an
  // explicit offline payment method (check / Zelle / cash / other).
  const verifiedOfflineRevenue = allMembers.reduce((sum, m) => {
    if (m.role === 'admin' || m.role === 'moderator') return sum
    if (hasSquareReceipt(m)) return sum
    if (!m.paymentMethod || !OFFLINE_METHODS.includes(m.paymentMethod)) return sum
    return sum + inferredAmount(m)
  }, 0)

  // Unverified: members with no Square receipt AND no explicit offline method.
  // These might be applicants who never actually paid, or paid via Square
  // with an email that doesn't match Square's record. Kept out of the grand
  // total until you reconcile them.
  const unverifiedMembers = allMembers.filter((m) => {
    if (m.role === 'admin' || m.role === 'moderator') return false
    if (hasSquareReceipt(m)) return false
    if (m.paymentMethod && OFFLINE_METHODS.includes(m.paymentMethod)) return false
    return inferredAmount(m) > 0
  })
  const unverifiedRevenue = unverifiedMembers.reduce((sum, m) => sum + inferredAmount(m), 0)

  const revenueByMethod = allMembers.reduce<Record<string, number>>((acc, m) => {
    if (m.role === 'admin' || m.role === 'moderator') return acc
    if (hasSquareReceipt(m)) return acc // Square counted separately
    const method = m.paymentMethod
    if (!method || !OFFLINE_METHODS.includes(method)) return acc
    const amount = inferredAmount(m)
    if (amount === 0) return acc
    acc[method] = (acc[method] || 0) + amount
    return acc
  }, {})

  // Square processing fees — prefer real data from synced Square payments,
  // fall back to estimate (2.9% + $0.30) when no sync has happened yet.
  const hasSquareData = allSquarePayments.length > 0

  let squareGross = 0
  let estimatedSquareFees = 0
  let squareTransactionCount = 0
  let squareFeesAreReal = false

  if (hasSquareData) {
    const completed = allSquarePayments.filter((p) => p.status === 'COMPLETED')
    squareTransactionCount = completed.length
    squareGross = completed.reduce((sum, p) => sum + (p.amountCents - p.refundedCents) / 100, 0)
    estimatedSquareFees = Math.round(completed.reduce((sum, p) => sum + p.feeCents, 0)) / 100
    squareFeesAreReal = true
  } else {
    const SQUARE_FEE_RATE = 0.029
    const SQUARE_FEE_FIXED = 0.30
    const squareTransactions = allMembers.filter((m) => {
      if (m.role === 'admin' || m.role === 'moderator') return false
      const amount = inferredAmount(m)
      if (amount <= 0) return false
      const method = m.paymentMethod || 'square'
      return method === 'square'
    })
    squareTransactionCount = squareTransactions.length
    squareGross = squareTransactions.reduce((sum, m) => sum + inferredAmount(m), 0)
    estimatedSquareFees = Math.round(
      squareTransactions.reduce((sum, m) => sum + inferredAmount(m) * SQUARE_FEE_RATE + SQUARE_FEE_FIXED, 0) * 100
    ) / 100
  }

  estimatedSquareFees = Math.round(estimatedSquareFees * 100) / 100
  squareGross = Math.round(squareGross * 100) / 100

  // Total revenue = Square (authoritative from Square API) + verified offline
  // Unverified members are NOT included — they're shown separately for
  // reconciliation because we're not sure they actually paid.
  const revenueTracked = Math.round((squareGross + verifiedOfflineRevenue) * 100) / 100
  if (squareGross > 0) revenueByMethod['square'] = squareGross

  const netRevenue = Math.round((revenueTracked - estimatedSquareFees) * 100) / 100

  // For each orphan, suggest the most likely member by name/email similarity.
  // Only consider non-staff members that don't already have method='square' recorded.
  const eligibleMembersForMatch = allMembers.filter((m) =>
    m.role !== 'admin' && m.role !== 'moderator' && (m.paymentMethod == null || m.paymentMethod !== 'square')
  )

  const squareOrphans = allSquarePayments
    .filter((p) => !p.matchedMemberId && p.status === 'COMPLETED')
    .map((p) => {
      let bestMatch: { id: string; name: string; email: string; membershipNumber: string | null; businessName: string | null; score: number } | null = null
      for (const m of eligibleMembersForMatch) {
        const score = nameSimilarity(p.buyerName, p.buyerEmail, m.name, m.businessName, m.email)
        if (score > (bestMatch?.score || 0)) {
          bestMatch = {
            id: m.id,
            name: m.name,
            email: m.email,
            membershipNumber: m.membershipNumber,
            businessName: m.businessName,
            score,
          }
        }
      }
      return {
        id: p.id,
        amountCents: p.amountCents,
        feeCents: p.feeCents,
        buyerEmail: p.buyerEmail,
        buyerName: p.buyerName,
        paidAt: p.paidAt,
        receiptUrl: p.receiptUrl,
        receiptNumber: p.receiptNumber,
        cardBrand: p.cardBrand,
        last4: p.last4,
        suggestedMatch: bestMatch && bestMatch.score >= 0.4 ? bestMatch : null,
      }
    })

  const loggedExpensesTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0)
  const expensesByCategory = allExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  // Fold estimated Square fees into the expenses view as a virtual category
  // so they're visible in Total Expenses / breakdown, not just in the waterfall.
  const SQUARE_FEE_CATEGORY = 'Payment Processing (Square)'
  if (estimatedSquareFees > 0) {
    expensesByCategory[SQUARE_FEE_CATEGORY] =
      (expensesByCategory[SQUARE_FEE_CATEGORY] || 0) + estimatedSquareFees
  }
  const totalExpenses = loggedExpensesTotal + estimatedSquareFees

  // Build a "recent" list that surfaces the Square fees line at the top
  // as a synthetic entry (not stored in DB — computed from members table).
  const recentExpenses: Array<{
    id: string
    category: string
    vendor: string
    description: string | null
    amount: number
    paymentMethod: string | null
    paymentReference: string | null
    expenseDate: string | number | Date
    isSynthetic?: boolean
  }> = []

  if (estimatedSquareFees > 0) {
    recentExpenses.push({
      id: 'synthetic-square-fees',
      category: SQUARE_FEE_CATEGORY,
      vendor: 'Square',
      description: `${squareFeesAreReal ? 'Actual fees synced from Square' : 'Estimated at 2.9% + $0.30 per transaction'} across ${squareTransactionCount} Square payments.`,
      amount: estimatedSquareFees,
      paymentMethod: 'auto-deducted',
      paymentReference: null,
      expenseDate: new Date(),
      isSynthetic: true,
    })
  }
  recentExpenses.push(...allExpenses.slice(0, 10))

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
        hasSquareReceipt: hasSquareReceipt(m),
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
      squareTransactionCount,
      estimatedSquareFees,
      squareFeesAreReal,
      net: netRevenue,
      verifiedOffline: Math.round(verifiedOfflineRevenue * 100) / 100,
      verifiedOfflineMemberCount: allMembers.filter(
        (m) => m.role !== 'admin' && m.role !== 'moderator' && !hasSquareReceipt(m) && m.paymentMethod && OFFLINE_METHODS.includes(m.paymentMethod)
      ).length,
      unverified: Math.round(unverifiedRevenue * 100) / 100,
      unverifiedMemberCount: unverifiedMembers.length,
    },
    square: {
      lastSync: lastSyncRow || null,
      totalPayments: allSquarePayments.length,
      orphans: squareOrphans,
      orphanCount: squareOrphans.length,
      allPayments: allSquarePayments
        .filter((p) => p.status === 'COMPLETED')
        .map((p) => {
          const matched = p.matchedMemberId ? allMembers.find((m) => m.id === p.matchedMemberId) : null
          return {
            id: p.id,
            amountCents: p.amountCents,
            feeCents: p.feeCents,
            refundedCents: p.refundedCents,
            buyerEmail: p.buyerEmail,
            buyerName: p.buyerName,
            paidAt: p.paidAt,
            receiptUrl: p.receiptUrl,
            receiptNumber: p.receiptNumber,
            cardBrand: p.cardBrand,
            last4: p.last4,
            matched: !!matched,
            matchedMemberName: matched?.name || null,
            matchedMembershipNumber: matched?.membershipNumber || null,
            matchedMemberEmail: matched?.email || null,
          }
        }),
    },
    expenses: {
      total: Math.round(totalExpenses * 100) / 100,
      logged: Math.round(loggedExpensesTotal * 100) / 100,
      byCategory: expensesByCategory,
      recent: recentExpenses,
    },
    invitations: {
      sent: invitationsSent,
      converted: invitationsConverted,
      recent: allInvitations.slice(0, 10),
    },
    memberList,
    netPosition: Math.round((revenueTracked - totalExpenses) * 100) / 100,
  })
}
