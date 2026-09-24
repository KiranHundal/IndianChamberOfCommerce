import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, expenses, invitations, squarePayments } from '@/lib/schema'
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

  const [allMembers, allPayments, allExpenseRows, allInvitations] = await Promise.all([
    db.select().from(members).catch(() => []),
    db.select().from(squarePayments).orderBy(desc(squarePayments.paidAt)).catch(() => []),
    db.select().from(expenses).orderBy(desc(expenses.expenseDate)).catch(() => []),
    db.select().from(invitations).orderBy(desc(invitations.sentAt)).catch(() => []),
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

  for (const p of allPayments) {
    if (p.status !== 'COMPLETED') continue
    if (!p.paidAt) continue
    const paid = new Date(p.paidAt)
    if (!inRange(paid)) continue
    const key = useDays ? dayKey(paid) : monthKey(paid)
    if (!(key in revenueByBucket)) continue
    revenueByBucket[key] += (p.amountCents - p.refundedCents) / 100
    paymentsByBucket[key] += 1
  }

  // Layer in offline verified members by their paymentDate
  for (const m of nonStaff) {
    if (m.status !== 'approved') continue
    if (!m.amountPaid || m.amountPaid <= 0) continue
    if (m.paymentMethod === 'square') continue // already counted via Square payments
    const ref = m.paymentDate || m.approvedAt
    if (!ref) continue
    const dt = new Date(ref)
    if (!inRange(dt)) continue
    const key = useDays ? dayKey(dt) : monthKey(dt)
    if (!(key in revenueByBucket)) continue
    revenueByBucket[key] += m.amountPaid
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

  // ---------- KPI totals inside period ----------
  const totalRevenue = revenueTrend.reduce((s, r) => s + r.revenue, 0)
  const totalNewMembers = newMembersTrend.reduce((s, r) => s + r.count, 0)
  const totalPayments = revenueTrend.reduce((s, r) => s + r.payments, 0)
  const totalExpenses = allExpensesLive
    .filter((e) => inRange(e.expenseDate))
    .reduce((s, e) => s + e.amount, 0)

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
    tierBreakdown,
    statusBreakdown,
    revenueTrend,
    newMembersTrend,
    attribution,
    bucketSize: useDays ? 'day' : 'month',
  })
}
