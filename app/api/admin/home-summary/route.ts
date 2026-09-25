import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, expenses, invitations, squarePayments, squareSync, events, eventRsvps } from '@/lib/schema'
import { desc, isNull, and, gte, eq } from 'drizzle-orm'
import { ensureEventsSchema } from '@/lib/ensure-events-schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  const role = user?.role
  if (!user || (role !== 'admin' && role !== 'moderator' && role !== 'reviewer')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [allMembers, allExpenseRows, allInvitations, allSquarePayments, lastSync] = await Promise.all([
    db.select().from(members).catch(() => []),
    // Fetch a wider window than we need so filtering out soft-deleted rows
    // still leaves the latest live ones for "recent activity".
    db.select().from(expenses).orderBy(desc(expenses.createdAt)).limit(50).catch(() => []),
    db.select().from(invitations).orderBy(desc(invitations.sentAt)).limit(20).catch(() => []),
    db.select().from(squarePayments).where(isNull(squarePayments.matchedMemberId)).catch(() => []),
    db.select().from(squareSync).orderBy(desc(squareSync.startedAt)).limit(1).catch(() => []),
  ])
  // Soft-deleted expenses are hidden from totals and activity — they still
  // live in the DB for audit but shouldn't affect Expenses YTD or Net Position.
  const allExpenses = allExpenseRows.filter((e) => !e.deletedAt)

  const OFFLINE_METHODS = ['check', 'zelle', 'cash', 'other']

  function inferredAmount(m: typeof allMembers[number]): number {
    if (m.role === 'admin' || m.role === 'moderator' || m.role === 'reviewer') return 0
    if (m.amountPaid && m.amountPaid > 0) return m.amountPaid
    if (m.status !== 'approved') return 0
    return m.membershipTier === 'corporate' ? 395 : 95
  }

  const squareLinkedMemberIds = new Set<string>()
  const completedSquare = await db.select().from(squarePayments).catch(() => [])
  for (const p of completedSquare) {
    if (p.matchedMemberId) squareLinkedMemberIds.add(p.matchedMemberId)
  }

  const hasSquareReceipt = (m: typeof allMembers[number]) =>
    squareLinkedMemberIds.has(m.id) || m.paymentMethod === 'square'

  // Revenue
  const squareGross = completedSquare
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amountCents - p.refundedCents) / 100, 0)
  const verifiedOffline = allMembers.reduce((sum, m) => {
    if (m.role === 'admin' || m.role === 'moderator' || m.role === 'reviewer') return sum
    if (hasSquareReceipt(m)) return sum
    if (!m.paymentMethod || !OFFLINE_METHODS.includes(m.paymentMethod)) return sum
    return sum + inferredAmount(m)
  }, 0)
  const revenueYtd = Math.round((squareGross + verifiedOffline) * 100) / 100

  // Expenses
  const squareFees =
    completedSquare
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.feeCents, 0) / 100
  const loggedExpensesTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0)
  const expensesYtd = Math.round((loggedExpensesTotal + squareFees) * 100) / 100

  // Alerts
  const nonStaffMembers = allMembers.filter((m) => m.role !== 'admin' && m.role !== 'moderator')
  const isUnpaid = (m: typeof allMembers[number]) =>
    m.status === 'pending' && !((m.amountPaid && m.amountPaid > 0) || m.paymentMethod)
  const unpaidMembers = nonStaffMembers.filter(isUnpaid).length
  const pendingMembers = nonStaffMembers.filter((m) => m.status === 'pending' && !isUnpaid(m)).length
  const orphanPayments = allSquarePayments.filter((p) => p.status === 'COMPLETED').length
  const unverifiedApproved = nonStaffMembers.filter(
    (m) => m.status === 'approved' && !hasSquareReceipt(m) && (!m.paymentMethod || !OFFLINE_METHODS.includes(m.paymentMethod))
  ).length

  // Recent activity (last ~10)
  const activityCandidates: Array<{
    id: string
    type: 'payment' | 'expense' | 'invitation' | 'approval'
    title: string
    subtitle: string
    amount: number | null
    at: Date
  }> = []

  // Latest 8 approved members with a payment date
  const approvedByDate = nonStaffMembers
    .filter((m) => m.status === 'approved')
    .sort((a, b) => {
      const ad = a.paymentDate ? new Date(a.paymentDate).getTime() : new Date(a.approvedAt || a.createdAt).getTime()
      const bd = b.paymentDate ? new Date(b.paymentDate).getTime() : new Date(b.approvedAt || b.createdAt).getTime()
      return bd - ad
    })
    .slice(0, 8)
  for (const m of approvedByDate) {
    const amount = m.amountPaid || (m.membershipTier === 'corporate' ? 395 : 95)
    activityCandidates.push({
      id: `member-${m.id}`,
      type: 'payment',
      title: m.name,
      subtitle: `${m.membershipTier === 'corporate' ? 'Corporate' : 'Individual'} · ${m.paymentMethod || 'method n/a'}${m.membershipNumber ? ` · #${m.membershipNumber}` : ''}`,
      amount,
      at: new Date(m.paymentDate || m.approvedAt || m.createdAt),
    })
  }

  // Latest 4 expenses
  for (const e of allExpenses.slice(0, 4)) {
    activityCandidates.push({
      id: `expense-${e.id}`,
      type: 'expense',
      title: e.vendor,
      subtitle: `${e.category}${e.description ? ` · ${e.description}` : ''}`,
      amount: e.amount,
      at: new Date(e.expenseDate),
    })
  }

  // Latest 4 invitations
  for (const i of allInvitations.slice(0, 4)) {
    activityCandidates.push({
      id: `invite-${i.id}`,
      type: 'invitation',
      title: `Invited ${i.name || i.email}`,
      subtitle: i.businessName || i.email,
      amount: null,
      at: new Date(i.sentAt),
    })
  }

  const recentActivity = activityCandidates
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10)
    .map((a) => ({ ...a, at: a.at.toISOString() }))

  // Next event tile — one glance at the closest upcoming published event
  // plus its RSVP count and revenue-so-far.
  let nextEvent: {
    id: string
    slug: string
    title: string
    startAt: string
    location: string | null
    coverImageUrl: string | null
    priceCents: number | null
    capacity: number | null
    rsvpCount: number
    seats: number
    collectedCents: number
  } | null = null
  try {
    await ensureEventsSchema()
    const now = new Date()
    const [ne] = await db
      .select()
      .from(events)
      .where(and(eq(events.published, true), gte(events.startAt, now)))
      .orderBy(events.startAt)
      .limit(1)
    if (ne) {
      const rsvps = await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, ne.id))
      const seats = rsvps.reduce((s, r) => s + 1 + r.guests, 0)
      const collectedCents = rsvps.reduce((s, r) => s + (r.paidAmount || 0), 0)
      nextEvent = {
        id: ne.id,
        slug: ne.slug,
        title: ne.title,
        startAt: new Date(ne.startAt).toISOString(),
        location: ne.location,
        coverImageUrl: ne.coverImageUrl,
        priceCents: ne.priceCents,
        capacity: ne.capacity,
        rsvpCount: rsvps.length,
        seats,
        collectedCents,
      }
    }
  } catch (e) {
    console.error('home-summary next event lookup failed:', e)
  }

  return NextResponse.json({
    role,
    alerts: {
      pendingMembers,
      unpaidMembers,
      orphanPayments,
      unverifiedApproved,
    },
    kpis: {
      revenueYtd,
      expensesYtd,
      netPosition: Math.round((revenueYtd - expensesYtd) * 100) / 100,
      totalMembers: nonStaffMembers.length,
    },
    nextEvent,
    recentActivity,
    lastSync: lastSync[0]
      ? { finishedAt: lastSync[0].finishedAt, status: lastSync[0].status }
      : null,
  })
}
