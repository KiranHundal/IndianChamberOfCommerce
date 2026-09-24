import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, expenses, squarePayments } from '@/lib/schema'

function money(cents: number): string {
  const dollars = cents / 100
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}
function dollars(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

const OFFLINE_METHODS = ['check', 'zelle', 'cash', 'other']

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 })
  }

  const [allMembers, allExpenseRows, allPayments] = await Promise.all([
    db.select().from(members),
    db.select().from(expenses),
    db.select().from(squarePayments),
  ])
  // Soft-deleted expenses stay in the audit DB but are excluded from the
  // Treasurer's Report — the board is signing off on live position.
  const allExpenses = allExpenseRows.filter((e) => !e.deletedAt)

  const squareLinkedMemberIds = new Set<string>()
  for (const p of allPayments) {
    if (p.matchedMemberId) squareLinkedMemberIds.add(p.matchedMemberId)
  }
  const hasSquareReceipt = (m: typeof allMembers[number]) =>
    squareLinkedMemberIds.has(m.id) || m.paymentMethod === 'square'

  function inferredAmount(m: typeof allMembers[number]): number {
    if (m.role === 'admin' || m.role === 'moderator' || m.role === 'reviewer') return 0
    if (m.amountPaid && m.amountPaid > 0) return m.amountPaid
    if (m.status !== 'approved') return 0
    return m.membershipTier === 'corporate' ? 395 : 95
  }

  const completedSquare = allPayments.filter((p) => p.status === 'COMPLETED')
  const squareGrossCents = completedSquare.reduce((s, p) => s + (p.amountCents - p.refundedCents), 0)
  const squareFeesCents = completedSquare.reduce((s, p) => s + p.feeCents, 0)
  const squareGross = squareGrossCents / 100
  const squareFees = squareFeesCents / 100

  const verifiedOffline = allMembers.reduce((sum, m) => {
    if (m.role === 'admin' || m.role === 'moderator' || m.role === 'reviewer') return sum
    if (hasSquareReceipt(m)) return sum
    if (!m.paymentMethod || !OFFLINE_METHODS.includes(m.paymentMethod)) return sum
    return sum + inferredAmount(m)
  }, 0)

  const grossRevenue = squareGross + verifiedOffline
  const loggedExpenses = allExpenses.reduce((s, e) => s + e.amount, 0)
  const totalExpenses = loggedExpenses + squareFees
  const netPosition = grossRevenue - totalExpenses

  const nonStaff = allMembers.filter((m) => m.role !== 'admin' && m.role !== 'moderator')
  const approved = nonStaff.filter((m) => m.status === 'approved')
  const individual = approved.filter((m) => m.membershipTier === 'individual').length
  const corporate = approved.filter((m) => m.membershipTier === 'corporate').length

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `<!doctype html>
<html><head>
  <meta charset="utf-8" />
  <title>CVICC Treasurer's Report — ${today}</title>
  <style>
    @page { size: letter; margin: 0.6in; }
    * { box-sizing: border-box; }
    html, body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E3A5F; background: #fff; margin: 0; padding: 0; }
    body { padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 3px solid #D4A830; padding-bottom: 20px; margin-bottom: 32px; }
    .label { color: #D4A830; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px; }
    h1 { font-size: 28px; font-weight: 300; margin: 0 0 4px; }
    .subtitle { color: #5A6A7A; font-size: 13px; margin: 0; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0 32px; }
    .kpi { background: #FAFAF7; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px; }
    .kpi.dark { background: #1E3A5F; color: #fff; border-color: #1E3A5F; }
    .kpi-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #D4A830; margin: 0 0 6px; }
    .kpi-value { font-size: 28px; font-weight: 300; margin: 0; }
    .kpi-sub { font-size: 11px; color: #5A6A7A; margin: 4px 0 0; }
    .section { margin: 32px 0; }
    .section h2 { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #D4A830; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; color: #5A6A7A; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; padding: 8px 12px; border-bottom: 2px solid #1E3A5F; }
    td { padding: 8px 12px; border-bottom: 1px solid #EDE6D3; }
    td.money { text-align: right; font-family: 'Helvetica Neue', Arial, sans-serif; }
    tr.total td { border-top: 2px solid #1E3A5F; border-bottom: none; font-weight: 600; padding-top: 12px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #EDE6D3; color: #5A6A7A; font-size: 10px; text-align: center; }
    .print-btn { position: fixed; top: 16px; right: 16px; background: #D4A830; color: #fff; padding: 10px 20px; border: none; border-radius: 4px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; z-index: 100; }
    @media print { .print-btn { display: none; } body { padding: 0; } }
  </style>
</head><body>
  <button class="print-btn" onclick="window.print()">Save as PDF</button>
  <div class="header">
    <p class="label">Central Valley Indian Chamber of Commerce</p>
    <h1>Treasurer&rsquo;s Report</h1>
    <p class="subtitle">As of ${today}</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <p class="kpi-label">Gross Revenue</p>
      <p class="kpi-value">${dollars(grossRevenue)}</p>
      <p class="kpi-sub">Square + verified offline payments</p>
    </div>
    <div class="kpi">
      <p class="kpi-label">Total Expenses</p>
      <p class="kpi-value">${dollars(totalExpenses)}</p>
      <p class="kpi-sub">${dollars(loggedExpenses)} logged + ${dollars(squareFees)} Square fees</p>
    </div>
    <div class="kpi dark">
      <p class="kpi-label">Net Position</p>
      <p class="kpi-value">${dollars(netPosition)}</p>
      <p class="kpi-sub" style="color:rgba(255,255,255,0.5);">Gross − Total Expenses</p>
    </div>
    <div class="kpi">
      <p class="kpi-label">Approved Members</p>
      <p class="kpi-value">${approved.length}</p>
      <p class="kpi-sub">${individual} individual · ${corporate} corporate</p>
    </div>
  </div>

  <div class="section">
    <h2>Revenue Detail</h2>
    <table>
      <thead><tr><th>Source</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Square (${completedSquare.length} payments)</td><td class="money">${money(squareGrossCents)}</td></tr>
        <tr><td>Offline verified (check / Zelle / cash / other)</td><td class="money">${dollars(verifiedOffline)}</td></tr>
        <tr class="total"><td>Gross Revenue</td><td class="money">${dollars(grossRevenue)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Expense Detail</h2>
    <table>
      <thead><tr><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Square Processing Fees (${completedSquare.length} txns, ~2.9% + $0.30)</td><td class="money">${money(squareFeesCents)}</td></tr>
        ${allExpenses.length > 0
          ? allExpenses.map((e) => `<tr><td>${escapeHtml(e.category)} · ${escapeHtml(e.vendor)}</td><td class="money">${dollars(e.amount)}</td></tr>`).join('')
          : '<tr><td colspan="2" style="color:#5A6A7A;font-style:italic">No logged expenses to date.</td></tr>'}
        <tr class="total"><td>Total Expenses</td><td class="money">${dollars(totalExpenses)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Net Position</h2>
    <table>
      <tbody>
        <tr><td>Gross Revenue</td><td class="money">${dollars(grossRevenue)}</td></tr>
        <tr><td>− Total Expenses</td><td class="money">−${dollars(totalExpenses)}</td></tr>
        <tr class="total"><td>Net Position</td><td class="money">${dollars(netPosition)}</td></tr>
      </tbody>
    </table>
  </div>

  <div style="margin-top:56px;display:grid;grid-template-columns:1fr 1fr;gap:32px;">
    <div>
      <p style="font-size:12px;margin:0 0 40px;">Respectfully submitted,</p>
      <div style="border-top:1px solid #1E3A5F;padding-top:8px;">
        <p style="font-weight:600;margin:0;">Kiran Hundal</p>
        <p style="font-size:10px;color:#5A6A7A;margin:2px 0 0;">Treasurer &amp; Chief Financial Officer</p>
      </div>
    </div>
    <div>
      <p style="font-size:12px;margin:0 0 40px;">Date: ${today}</p>
      <div style="border-top:1px solid #1E3A5F;padding-top:8px;">
        <p style="font-weight:600;margin:0;">Reviewed by the Executive Committee</p>
        <p style="font-size:10px;color:#5A6A7A;margin:2px 0 0;">Central Valley Indian Chamber of Commerce</p>
      </div>
    </div>
  </div>

  <div class="footer">
    Central Valley Indian Chamber of Commerce, Inc. · 4610 W Jacquelyn Ave, Fresno, CA 93722
  </div>

  <script>
    // Auto-open print dialog on load
    if (typeof window !== 'undefined') {
      setTimeout(() => window.print(), 400);
    }
  </script>
</body></html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
