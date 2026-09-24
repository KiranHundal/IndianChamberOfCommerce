'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, FormEvent } from 'react'
import { Plus, Trash2, Loader2, X, Receipt } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'

interface Expense {
  id: string
  category: string
  vendor: string
  description: string | null
  amount: number
  paymentMethod: string | null
  paymentReference: string | null
  expenseDate: string | number
  createdBy: string | null
  isSynthetic?: boolean
}

interface FinanceSummary {
  expenses: {
    total: number
    logged: number
    byCategory: Record<string, number>
    recent: Expense[]
  }
}

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function AdminExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showExpense, setShowExpense] = useState(false)
  const [expenseSaving, setExpenseSaving] = useState(false)
  const [expenseError, setExpenseError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance-summary')
      if (res.ok) setSummary(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string } | undefined)?.role
      if (role !== 'admin' && role !== 'moderator') {
        router.push('/admin')
        return
      }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('openExpense') === '1') setShowExpense(true)
      }
      fetchSummary()
    }
  }, [status, session, router, fetchSummary])

  async function handleExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setExpenseSaving(true)
    setExpenseError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      category: fd.get('category'),
      vendor: fd.get('vendor'),
      description: fd.get('description'),
      amount: fd.get('amount'),
      paymentMethod: fd.get('paymentMethod'),
      paymentReference: fd.get('paymentReference'),
      expenseDate: fd.get('expenseDate'),
    }
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setExpenseError(data.error || 'Failed to log expense.')
      } else {
        setShowExpense(false)
        await fetchSummary()
        setNotice({ type: 'success', text: `Expense of $${payload.amount} logged.` })
      }
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : 'Network error.')
    }
    setExpenseSaving(false)
  }

  async function submitDelete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!deleteTarget) return
    const reason = deleteReason.trim()
    if (reason.length < 3) {
      setDeleteError('Please write a reason (at least 3 characters). This becomes part of the audit trail.')
      return
    }
    setDeletingId(deleteTarget.id)
    setDeleteError('')
    try {
      const res = await fetch(`/api/admin/expenses/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete expense.')
      } else {
        const label = deleteTarget.label
        setDeleteTarget(null)
        setDeleteReason('')
        await fetchSummary()
        setNotice({ type: 'success', text: `Expense deleted (${label}). Reason recorded.` })
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Network error.')
    }
    setDeletingId(null)
  }

  if (status === 'loading' || loading || !summary) {
    return (
      <AdminShell title="Expenses">
        <div className="animate-pulse text-mid text-sm">Loading…</div>
      </AdminShell>
    )
  }

  const rows = summary.expenses.recent
  const loggedRows = rows.filter((e) => !e.isSynthetic)

  const headerActions = (
    <button
      type="button"
      onClick={() => { setExpenseError(''); setShowExpense(true) }}
      className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-gold-900"
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Add Expense</span>
    </button>
  )

  return (
    <AdminShell title="Expenses" actions={headerActions}>
      {notice && (
        <div className={`mb-4 border rounded px-4 py-3 text-sm flex items-start gap-3 ${
          notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-ivory-200 rounded-lg p-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-1">Logged</p>
          <p className="text-2xl font-medium text-brand">{money(summary.expenses.logged)}</p>
          <p className="text-xs text-hint mt-0.5">{loggedRows.length} entries</p>
        </div>
        <div className="bg-white border border-ivory-200 rounded-lg p-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-1">Square fees</p>
          <p className="text-2xl font-medium text-brand">{money(Math.max(0, summary.expenses.total - summary.expenses.logged))}</p>
          <p className="text-xs text-hint mt-0.5">auto-computed</p>
        </div>
        <div className="bg-navy-900 text-white rounded-lg p-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-gold-400 mb-1">Total</p>
          <p className="text-2xl font-medium">{money(summary.expenses.total)}</p>
          <p className="text-xs text-white/50 mt-0.5">Logged + Square fees</p>
        </div>
      </div>

      {/* Expenses table */}
      <div className="bg-white border border-ivory-200 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-10 h-10 text-hint mx-auto mb-3" />
            <p className="text-sm text-mid mb-2">No expenses logged yet.</p>
            <button
              type="button"
              onClick={() => { setExpenseError(''); setShowExpense(true) }}
              className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-2 rounded hover:bg-gold-900"
            >
              <Plus className="w-3.5 h-3.5" />
              Log the first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-page-bg">
                <tr className="text-left border-b border-ivory-200">
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid">Date</th>
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid">Category</th>
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid">Vendor</th>
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid">Description</th>
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid">Method / Ref</th>
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid">Logged By</th>
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid text-right">Amount</th>
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-ivory-200/60 hover:bg-page-bg/50">
                    <td className="px-4 py-2.5 text-xs text-charcoal whitespace-nowrap">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[0.65rem] font-medium ${
                        e.isSynthetic ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-red-50 border border-red-200 text-red-700'
                      }`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-brand">{e.vendor}</td>
                    <td className="px-4 py-2.5 text-xs text-mid max-w-[16rem] truncate">{e.description || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-hint">
                      {e.paymentMethod || '—'}
                      {e.paymentReference && <span className="block truncate">Ref: {e.paymentReference}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {(() => {
                        if (!e.createdBy) return <span className="text-hint italic">unknown</span>
                        const m = e.createdBy.match(/^(.*?)\s*<([^>]+)>\s*$/)
                        if (m) return <><p className="text-mid font-medium truncate">{m[1]}</p><p className="text-hint truncate text-[0.6rem]">{m[2]}</p></>
                        return <p className="text-mid truncate">{e.createdBy}</p>
                      })()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-700 whitespace-nowrap">−{money(e.amount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {e.isSynthetic ? (
                        <span className="text-[0.65rem] text-hint italic">auto</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setDeleteTarget({ id: e.id, label: `${e.vendor} · ${money(e.amount)}` }); setDeleteReason(''); setDeleteError('') }}
                          disabled={deletingId === e.id}
                          className="inline-flex items-center gap-1 text-[0.65rem] text-red-600 hover:text-red-800 disabled:opacity-40"
                        >
                          {deletingId === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand/20 bg-page-bg">
                  <td colSpan={6} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-brand">
                    Total ({rows.length} {rows.length === 1 ? 'entry' : 'entries'})
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-medium text-red-700">−{money(summary.expenses.total)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* By Category strip */}
      {Object.keys(summary.expenses.byCategory).length > 0 && (
        <div className="mt-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-mid mb-2">By category</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.expenses.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <span key={cat} className="inline-flex items-center gap-1.5 bg-white border border-ivory-200 rounded px-3 py-1 text-xs">
                <span className="text-mid">{cat}</span>
                <span className="font-medium text-brand">{money(amt)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense modal */}
      {showExpense && (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4" onClick={() => !expenseSaving && setShowExpense(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-brand">Log expense</h3>
              <button type="button" onClick={() => !expenseSaving && setShowExpense(false)} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleExpense} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Category *</label>
                <input name="category" required placeholder="e.g. Event, Marketing, Office, Insurance" className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Vendor *</label>
                <input name="vendor" required className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Amount ($) *</label>
                <input name="amount" type="number" min="1" step="1" required className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Description</label>
                <input name="description" className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Payment method</label>
                <select name="paymentMethod" defaultValue="" className="w-full border border-ivory-200 rounded px-3 py-2 text-sm">
                  <option value="">—</option>
                  <option value="check">Check</option>
                  <option value="zelle">Zelle</option>
                  <option value="ach">ACH</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Date</label>
                <input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Reference (check #, invoice #, memo)</label>
                <input name="paymentReference" className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              {expenseError && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{expenseError}</div>}
              <div className="md:col-span-2 flex gap-2 pt-1">
                <button type="button" onClick={() => setShowExpense(false)} disabled={expenseSaving} className="flex-1 bg-white border border-ivory-200 text-mid text-xs font-medium px-4 py-2.5 rounded hover:border-brand/30 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={expenseSaving} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-accent text-white text-xs font-medium px-4 py-2.5 rounded hover:bg-gold-900 disabled:opacity-50">
                  {expenseSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : 'Save expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4" onClick={() => deletingId !== deleteTarget.id && setDeleteTarget(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-600" /></div>
                <h3 className="text-lg font-medium text-brand">Delete expense</h3>
              </div>
              <button type="button" onClick={() => deletingId !== deleteTarget.id && setDeleteTarget(null)} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-mid mb-3">Deleting <strong className="text-brand">{deleteTarget.label}</strong>. Please write a reason — this is stored on the record for audit.</p>
            <form onSubmit={submitDelete} className="space-y-3">
              <textarea
                autoFocus
                required
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                maxLength={500}
                placeholder="e.g. Duplicate entry, wrong amount, refunded by vendor…"
                className="w-full border border-ivory-200 rounded px-3 py-2 text-sm"
              />
              <p className="text-[0.65rem] text-hint">{deleteReason.length}/500 · minimum 3</p>
              {deleteError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{deleteError}</div>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={deletingId === deleteTarget.id} className="flex-1 bg-white border border-ivory-200 text-mid text-xs font-medium px-4 py-2.5 rounded hover:border-brand/30 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={deletingId === deleteTarget.id || deleteReason.trim().length < 3} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-600 text-white text-xs font-medium px-4 py-2.5 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {deletingId === deleteTarget.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deleting…</> : <><Trash2 className="w-3.5 h-3.5" />Delete</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
