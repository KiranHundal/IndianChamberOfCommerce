import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, expenses, invitations, squarePayments, boardMembers } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Period = 'week' | 'month' | 'quarter' | 'ytd' | 'all'

function periodStart(period: Period): Date | null {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 6)
      return start
    case 'month':
      start.setDate(start.getDate() - 29)
      return start
    case 'quarter':
      start.setDate(start.getDate() - 89)
      return start
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1)
    case 'all':
      return null
  }
}

// Previous period of the same length ending just before periodStart.
// "This month" (last 30d) → "Prior month" (30d before that). "YTD" →
// full previous calendar year. "All time" → no comparison window.
function priorPeriodRange(period: Period): { start: Date; end: Date } | null {
  const now = new Date()
  const curStart = periodStart(period)
  if (!curStart || period === 'all') return null
  if (period === 'ytd') {
    const start = new Date(now.getFullYear() - 1, 0, 1)
    const end = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59)
    return { start, end }
  }
  const lengthMs = now.getTime() - curStart.getTime()
  const end = new Date(curStart.getTime() - 1)
  const start = new Date(end.getTime() - lengthMs)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

function dayLabel(key: string): string {
  const [y, m, d] = key.split('-')
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

function fillMonthBuckets(start: Date, end: Date): string[] {
  const buckets: string[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const stop = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur.getTime() <= stop.getTime()) {
    buckets.push(monthKey(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return buckets
}

function fillDayBuckets(start: Date, end: Date): string[] {
  const buckets: string[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const stop = new Date(end)
  stop.setHours(0, 0, 0, 0)
  while (cur.getTime() <= stop.getTime()) {
    buckets.push(dayKey(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return buckets
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  const role = user?.role
  if (!user || (role !== 'admin' && role !== 'moderator' && role !== 'reviewer')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const periodParam = (url.searchParams.get('period') || 'ytd').toLowerCase() as Period
  const validPeriods: Period[] = ['week', 'month', 'quarter', 'ytd', 'all']
  const period: Period = validPeriods.includes(periodParam) ? periodParam : 'ytd'

  const [allMembers, allPayments, allExpenseRows, allInvitations, allBoard] = await Promise.all([
    db.select().from(members).catch(() => []),
    db.select().from(squarePayments).orderBy(desc(squarePayments.paidAt)).catch(() => []),
    db.select().from(expenses).orderBy(desc(expenses.expenseDate)).catch(() => []),
    db.select().from(invitations).orderBy(desc(invitations.sentAt)).catch(() => []),
    db.select().from(boardMembers).catch(() => []),
  ])

  const allExpensesLive = allExpenseRows.filter((e) => !e.deletedAt)

  const start = periodStart(period)
  const now = new Date()

  const inRange = (d: Date | string | number | null | undefined): boolean => {
    if (!d) return false
    const t = new Date(d).getTime()
    if (isNaN(t)) return false
    if (start && t < start.getTime()) return false
    return t <= now.getTime() + 86400_000
  }

  // ---------- Tier breakdown (donut) ----------
  // Only paying members (approved, non-staff) that fall inside the period
  // based on their payment or approval date.
  const nonStaff = allMembers.filter((m) => m.role !== 'admin' && m.role !== 'moderator' && m.role !== 'reviewer')
  const approvedInRange = nonStaff.filter((m) => {
    if (m.status !== 'approved') return false
    if (!start) return true
    const ref = m.paymentDate || m.approvedAt || m.createdAt
    return ref ? inRange(ref) : false
  })
  const individualCount = approvedInRange.filter((m) => m.membershipTier === 'individual').length
  const corporateCount = approvedInRange.filter((m) => m.membershipTier === 'corporate').length

  const tierBreakdown = [
    { name: 'Individual', value: individualCount, color: '#D4A830' },
    { name: 'Corporate', value: corporateCount, color: '#1E3A5F' },
  ]

  // ---------- Status breakdown (donut) ----------
  const statusBreakdown = [
    { name: 'Approved', value: nonStaff.filter((m) => m.status === 'approved').length, color: '#059669' },
    { name: 'Pending', value: nonStaff.filter((m) => m.status === 'pending' && ((m.amountPaid && m.amountPaid > 0) || m.paymentMethod)).length, color: '#F59E0B' },
    { name: 'Unpaid', value: nonStaff.filter((m) => m.status === 'pending' && !((m.amountPaid && m.amountPaid > 0) || m.paymentMethod)).length, color: '#DC2626' },
    { name: 'Rejected', value: nonStaff.filter((m) => m.status === 'rejected').length, color: '#6B7280' },
    { name: 'Deactivated', value: nonStaff.filter((m) => m.status === 'deactivated').length, color: '#9CA3AF' },
  ].filter((s) => s.value > 0)

  // ---------- Monthly revenue trend (bar) ----------
  // Include Square payments + verified offline members. Group by month or day
  // depending on period width — short periods get day buckets, long ones months.
  const useDays = period === 'week' || period === 'month'
  const rangeStart = start || (allPayments.length > 0 ? new Date(Math.min(...allPayments.map((p) => new Date(p.paidAt).getTime()))) : new Date(now.getFullYear(), 0, 1))
  const buckets = useDays ? fillDayBuckets(rangeStart, now) : fillMonthBuckets(rangeStart, now)

  const revenueByBucket: Record<string, number> = {}
  const paymentsByBucket: Record<string, number> = {}
  for (const b of buckets) {
    revenueByBucket[b] = 0
    paymentsByBucket[b] = 0
  }

  // Skip Square payments matched to deactivated/rejected members —
  // those represent refunded transactions and don't count as revenue.
  const skippedMemberIds = new Set(
    allMembers.filter((m) => m.status === 'deactivated' || m.status === 'rejected').map((m) => m.id)
  )
  for (const p of allPayments) {
    if (p.status !== 'COMPLETED') continue
    if (!p.paidAt) continue
    const paid = new Date(p.paidAt)
    if (!inRange(paid)) continue
    if (p.matchedMemberId && skippedMemberIds.has(p.matchedMemberId)) continue
    const key = useDays ? dayKey(paid) : monthKey(paid)
    if (!(key in revenueByBucket)) continue
    revenueByBucket[key] += (p.amountCents - p.refundedCents) / 100
    paymentsByBucket[key] += 1
  }

  // Layer in offline paid members (approved OR pending with payment
  // evidence; any role, including staff). amountPaid > 0 wins; tier
  // floor only when a paymentMethod was recorded but the amount wasn't.
  // Pending-with-payment counts so money sitting in the chamber's
  // account while awaiting approval shows up in revenue — the user's
  // explicit rule: don't drop any penny we've received.
  // Role is NOT a filter — moderators/reviewer paying their own dues
  // count. The Members KPI headcount still uses nonStaff for "Paying
  // members"; revenue counts every penny regardless of sender.
  for (const m of allMembers) {
    if (m.status !== 'approved' && m.status !== 'pending') continue
    if (m.paymentMethod === 'square') continue // Square ledger already counted it
    const hasAmount = m.amountPaid != null && m.amountPaid > 0
    const hasMethod = !!m.paymentMethod && m.paymentMethod !== 'square'
    if (!hasAmount && !hasMethod) continue // no payment evidence — don't count
    const ref = m.paymentDate || m.approvedAt || m.createdAt
    if (!ref) continue
    const dt = new Date(ref)
    if (!inRange(dt)) continue
    const key = useDays ? dayKey(dt) : monthKey(dt)
    if (!(key in revenueByBucket)) continue
    const dollars = hasAmount
      ? m.amountPaid!
      : m.membershipTier === 'corporate' ? 395 : 95
    revenueByBucket[key] += dollars
    paymentsByBucket[key] += 1
  }

  const revenueTrend = buckets.map((k) => ({
    bucket: k,
    label: useDays ? dayLabel(k) : monthLabel(k),
    revenue: Math.round(revenueByBucket[k] * 100) / 100,
    payments: paymentsByBucket[k],
  }))

  // ---------- New members per period ----------
  const newMembersByBucket: Record<string, number> = {}
  for (const b of buckets) newMembersByBucket[b] = 0
  for (const m of nonStaff) {
    if (m.status !== 'approved') continue
    const ref = m.paymentDate || m.approvedAt || m.createdAt
    if (!ref) continue
    const dt = new Date(ref)
    if (!inRange(dt)) continue
    const key = useDays ? dayKey(dt) : monthKey(dt)
    if (key in newMembersByBucket) newMembersByBucket[key] += 1
  }
  const newMembersTrend = buckets.map((k) => ({
    bucket: k,
    label: useDays ? dayLabel(k) : monthLabel(k),
    count: newMembersByBucket[k],
  }))

  // ---------- Attribution — who brought in which members ----------
  // Invitations table records sentBy (the admin's email) and convertedAt.
  // A member is attributed to sender X if there's an invitations row for
  // their email with sentBy=X (regardless of convertedAt — we consider a
  // member "converted" if a matching row exists AND the member's account
  // now exists in the members table).
  const memberEmails = new Set(nonStaff.map((m) => m.email.toLowerCase()))
  const staffNames = new Map<string, string>()
  for (const m of allMembers) {
    staffNames.set(m.email.toLowerCase(), m.name)
  }

  const attributionMap: Record<string, { converted: number; sent: number; label: string }> = {}
  for (const inv of allInvitations) {
    const senderRaw = (inv.sentBy || 'unknown').toLowerCase()
    const sender = senderRaw.trim() || 'unknown'
    if (!attributionMap[sender]) {
      attributionMap[sender] = {
        converted: 0,
        sent: 0,
        label: staffNames.get(sender) || sender,
      }
    }
    // Count invitation within range if sentAt is in range
    if (inv.sentAt && inRange(inv.sentAt)) {
      attributionMap[sender].sent += 1
    }
    // Count conversion if the invited email is now a member
    if (memberEmails.has(inv.email.toLowerCase())) {
      const [mem] = nonStaff.filter((m) => m.email.toLowerCase() === inv.email.toLowerCase())
      const ref = mem?.paymentDate || mem?.approvedAt || mem?.createdAt
      if (ref && inRange(ref)) {
        attributionMap[sender].converted += 1
      }
    }
  }
  const attribution = Object.entries(attributionMap)
    .map(([sender, data]) => ({ sender, ...data }))
    .filter((r) => r.sent > 0 || r.converted > 0)
    .sort((a, b) => b.converted - a.converted)

  // ---------- Board-member referrals (who brought in whom) ----------
  // Approved-only, matching the New Members KPI. Attributing a pending
  // or unpaid signup to a board sponsor is premature — they may never
  // pay, might get rejected, or might have the wrong referrer that an
  // admin / moderator still needs to correct. Once a member is approved,
  // their attribution is locked in and the donut counts them.
  const boardIdToName = new Map(allBoard.map((b) => [b.id, b.name]))
  const boardReferralMap: Record<string, { boardMemberId: string; boardMemberName: string; count: number; revenue: number }> = {}
  let unattributedCount = 0
  let unattributedRevenue = 0

  // Revenue accounting mirrors the KPI's Revenue tile so the two numbers
  // reconcile exactly:
  //   - Square-paid members: use the Square ledger net (amount − refunds),
  //     not members.amountPaid (which can drift after a refund)
  //   - Offline members: use members.amountPaid as recorded
  //   - Orphan Square payments (no matched member): credit to Unreferred,
  //     since the chamber banked that money even if nobody is attributed
  const squareNetByMember = new Map<string, number>()
  let orphanSquareRevenue = 0
  for (const p of allPayments) {
    if (p.status !== 'COMPLETED') continue
    if (!p.paidAt) continue
    if (!inRange(new Date(p.paidAt))) continue
    // Skip payments matched to deactivated/rejected members (refunded).
    if (p.matchedMemberId && skippedMemberIds.has(p.matchedMemberId)) continue
    const net = (p.amountCents - p.refundedCents) / 100
    if (p.matchedMemberId) {
      squareNetByMember.set(p.matchedMemberId, (squareNetByMember.get(p.matchedMemberId) || 0) + net)
    } else {
      orphanSquareRevenue += net
    }
  }

  for (const m of allMembers) {
    // Approved or pending-with-payment both count — money the chamber
    // received should attribute to a sponsor regardless of whether the
    // approval button has been clicked yet.
    if (m.status !== 'approved' && m.status !== 'pending') continue
    const ref = m.paymentDate || m.approvedAt || m.createdAt
    if (!ref) continue
    if (!inRange(ref)) continue
    let dollars = 0
    if (squareNetByMember.has(m.id)) {
      dollars = squareNetByMember.get(m.id) || 0
    } else if (m.paymentMethod !== 'square') {
      // Offline branch — amountPaid wins when > 0; tier floor only
      // when a paymentMethod was recorded but the amount wasn't.
      // Pending rows with no payment evidence contribute $0.
      const hasAmount = m.amountPaid != null && m.amountPaid > 0
      const hasMethod = !!m.paymentMethod
      if (hasAmount) dollars = m.amountPaid!
      else if (hasMethod) dollars = m.membershipTier === 'corporate' ? 395 : 95
    }
    if (dollars === 0) continue // nothing to attribute
    if (!m.referredBy) {
      unattributedCount += 1
      unattributedRevenue += dollars
      continue
    }
    const key = m.referredBy
    if (!boardReferralMap[key]) {
      boardReferralMap[key] = {
        boardMemberId: key,
        boardMemberName: boardIdToName.get(key) || 'Unknown',
        count: 0,
        revenue: 0,
      }
    }
    boardReferralMap[key].count += 1
    boardReferralMap[key].revenue += dollars
  }
  // Orphan Square payments stay in their own bucket — surfaced in the
  // donut as its own legend row so the user can see them distinctly
  // from "unreferred members." Revenue total across all rows still
  // ties out to the KPI exactly: board slices + Unreferred + Orphan
  // Square payments = total chamber revenue.
  const orphanSquarePayments = allPayments.filter((p) => {
    if (p.status !== 'COMPLETED') return false
    if (!p.paidAt) return false
    if (!inRange(new Date(p.paidAt))) return false
    return !p.matchedMemberId
  }).length
  const boardReferrals = Object.values(boardReferralMap).sort((a, b) => b.revenue - a.revenue || b.count - a.count)

  // ---------- KPI totals inside period ----------
  const totalRevenue = revenueTrend.reduce((s, r) => s + r.revenue, 0)
  const totalNewMembers = newMembersTrend.reduce((s, r) => s + r.count, 0)
  const totalPayments = revenueTrend.reduce((s, r) => s + r.payments, 0)
  const loggedExpenseTotal = allExpensesLive
    .filter((e) => inRange(e.expenseDate))
    .reduce((s, e) => s + e.amount, 0)
  // Square processing fees are synthetic — they don't live in the expenses
  // table, they're the sum of feeCents on COMPLETED Square payments in the
  // range. The Expenses page shows them as a "Payment Processing (Square)"
  // row, so Overview has to include them too or the two pages disagree.
  const squareFeeTotal = allPayments
    .filter((p) => p.status === 'COMPLETED' && p.paidAt && inRange(p.paidAt))
    .reduce((s, p) => s + p.feeCents, 0) / 100
  const totalExpenses = Math.round((loggedExpenseTotal + squareFeeTotal) * 100) / 100

  // ---------- Prior period comparison for delta ----------
  // Same period length ending just before the current one, so we can render
  // "+3 vs last month" style deltas next to KPIs.
  const prior = priorPeriodRange(period)
  const priorNewMembers = prior
    ? nonStaff.filter((m) => {
        if (m.status !== 'approved') return false
        const ref = m.paymentDate || m.approvedAt || m.createdAt
        if (!ref) return false
        const t = new Date(ref).getTime()
        return t >= prior.start.getTime() && t <= prior.end.getTime()
      }).length
    : null
  const priorRevenue = prior
    ? Math.round(
        (allPayments
          .filter((p) => p.status === 'COMPLETED' && p.paidAt)
          .reduce((s, p) => {
            const t = new Date(p.paidAt).getTime()
            if (t < prior.start.getTime() || t > prior.end.getTime()) return s
            return s + (p.amountCents - p.refundedCents) / 100
          }, 0)) * 100
      ) / 100
    : null

  return NextResponse.json({
    period,
    rangeStart: start ? start.toISOString() : null,
    rangeEnd: now.toISOString(),
    kpis: {
      revenue: Math.round(totalRevenue * 100) / 100,
      newMembers: totalNewMembers,
      payments: totalPayments,
      expenses: totalExpenses,
      net: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    },
    prior: {
      newMembers: priorNewMembers,
      revenue: priorRevenue,
    },
    tierBreakdown,
    statusBreakdown,
    revenueTrend,
    newMembersTrend,
    attribution,
    boardReferrals,
    unattributedCount,
    unattributedRevenue,
    orphanSquarePayments,
    orphanSquareRevenue,
    bucketSize: useDays ? 'day' : 'month',
  })
}
