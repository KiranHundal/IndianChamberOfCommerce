import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, squarePayments } from '@/lib/schema'

export const dynamic = 'force-dynamic'

/**
 * Admin-only diagnostic that surfaces rows likely to cause a drift
 * between Overview Revenue (YTD, Square-ledger-first) and Finances
 * "Sum of amounts shown" (all-time, inferredAmount-based). Returns
 * concrete member rows and Square payment rows the admin can click
 * through and reconcile.
 *
 * No DB writes. No side effects. Read-only, cheap enough to call
 * on demand from the Finances page.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [allMembers, allPayments] = await Promise.all([
    db.select().from(members).catch(() => []),
    db.select().from(squarePayments).catch(() => []),
  ])

  // YTD boundary — Jan 1 of the current year, local midnight. Matches
  // the Overview KPI's periodStart('ytd') logic.
  const now = new Date()
  const ytdStart = new Date(now.getFullYear(), 0, 1)
  const inYtd = (d: Date | null | undefined): boolean => {
    if (!d) return false
    const t = new Date(d).getTime()
    return !isNaN(t) && t >= ytdStart.getTime()
  }

  type MemberRow = typeof allMembers[number]

  // Build a map of memberId → net Square (post-refund) for all COMPLETED
  // payments regardless of date, and a date map for the YTD check.
  type PaymentRow = typeof allPayments[number]
  const squareNetByMember = new Map<string, number>()
  const squareMatchedPayments: PaymentRow[] = []
  for (const p of allPayments) {
    if (p.status !== 'COMPLETED') continue
    if (!p.matchedMemberId) continue
    const net = (p.amountCents - p.refundedCents) / 100
    squareNetByMember.set(p.matchedMemberId, (squareNetByMember.get(p.matchedMemberId) || 0) + net)
    squareMatchedPayments.push(p)
  }

  const isStaff = (m: MemberRow) =>
    m.role === 'admin' || m.role === 'moderator' || m.role === 'reviewer'

  // ----- A. Pre-2026 (pre-YTD) approved members whose revenue is counted
  // by Finances but not by the Overview YTD KPI.
  const preYtdApproved = allMembers
    .filter((m) => !isStaff(m) && m.status === 'approved')
    .filter((m) => {
      const ref = m.paymentDate || m.approvedAt || m.createdAt
      return !inYtd(ref)
    })
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      status: m.status,
      role: m.role,
      membershipTier: m.membershipTier,
      paymentMethod: m.paymentMethod,
      amountPaid: m.amountPaid,
      paymentDate: m.paymentDate,
      approvedAt: m.approvedAt,
      createdAt: m.createdAt,
      note: 'Approved before Jan 1 2026 — counted in Finances all-time sum, excluded from Overview YTD',
    }))

  // ----- B. Members with paymentMethod='square' but NO matching Square
  // ledger row. Finances falls through to amountPaid; Overview's offline
  // loop skips them.
  const squareWithoutLedger = allMembers
    .filter((m) => !isStaff(m) && m.status === 'approved')
    .filter((m) => m.paymentMethod === 'square')
    .filter((m) => !squareNetByMember.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      membershipTier: m.membershipTier,
      paymentMethod: m.paymentMethod,
      amountPaid: m.amountPaid,
      note: 'paymentMethod=square but no matching Square ledger row — Finances counts amountPaid, Overview skips',
    }))

  // ----- C. Square ledger / member amountPaid mismatches (any delta,
  // not just $15) — surfaces refund drift or stale amountPaid rows.
  const squareLedgerDiffs = squareMatchedPayments
    .map((p) => {
      const m = allMembers.find((x) => x.id === p.matchedMemberId)
      if (!m) return null
      const net = (p.amountCents - p.refundedCents) / 100
      const amt = m.amountPaid || 0
      const diff = Math.round((amt - net) * 100) / 100
      if (Math.abs(diff) < 0.01) return null
      return {
        memberId: m.id,
        memberName: m.name,
        memberEmail: m.email,
        amountPaid: m.amountPaid,
        squareNet: net,
        delta: diff,
        paidAt: p.paidAt,
        inYtd: inYtd(p.paidAt),
        refundedCents: p.refundedCents,
        receiptNumber: p.receiptNumber,
      }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)

  // ----- D. Approved rows with amountPaid > 0 but no date column
  // (paymentDate AND approvedAt both null). Overview excludes these
  // (needs a date), Finances still counts them.
  const noDateApproved = allMembers
    .filter((m) => !isStaff(m) && m.status === 'approved')
    .filter((m) => (m.amountPaid || 0) > 0)
    .filter((m) => !m.paymentDate && !m.approvedAt)
    .map((m) => ({
      id: m.id,
      name: m.name,
      amountPaid: m.amountPaid,
      note: 'No paymentDate AND no approvedAt — Overview excludes, Finances counts',
    }))

  // ----- E. Staff rows with amountPaid > 0 (should contribute $0
  // everywhere, confirmed by inferredAmount guard, but surface for
  // review).
  const staffWithAmount = allMembers
    .filter((m) => isStaff(m))
    .filter((m) => (m.amountPaid || 0) > 0)
    .map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      amountPaid: m.amountPaid,
      note: 'Staff row with amountPaid — hard-guarded to $0 everywhere',
    }))

  return NextResponse.json({
    ytdStart: ytdStart.toISOString(),
    now: now.toISOString(),
    sections: {
      preYtdApproved: {
        label: `Approved members with no in-YTD date (${preYtdApproved.length})`,
        rows: preYtdApproved,
        totalAmountPaid: preYtdApproved.reduce((s, r) => s + (r.amountPaid || 0), 0),
      },
      squareWithoutLedger: {
        label: `Marked square but no Square ledger match (${squareWithoutLedger.length})`,
        rows: squareWithoutLedger,
        totalAmountPaid: squareWithoutLedger.reduce((s, r) => s + (r.amountPaid || 0), 0),
      },
      squareLedgerDiffs: {
        label: `members.amountPaid differs from Square ledger net (${squareLedgerDiffs.length})`,
        rows: squareLedgerDiffs,
        totalDelta: Math.round(squareLedgerDiffs.reduce((s, r) => s + r.delta, 0) * 100) / 100,
      },
      noDateApproved: {
        label: `Approved + amountPaid but no date column (${noDateApproved.length})`,
        rows: noDateApproved,
        totalAmountPaid: noDateApproved.reduce((s, r) => s + (r.amountPaid || 0), 0),
      },
      staffWithAmount: {
        label: `Staff rows carrying amountPaid (${staffWithAmount.length})`,
        rows: staffWithAmount,
        totalAmountPaid: staffWithAmount.reduce((s, r) => s + (r.amountPaid || 0), 0),
      },
    },
  })
}

