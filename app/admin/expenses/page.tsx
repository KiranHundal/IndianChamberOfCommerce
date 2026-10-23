'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, FormEvent } from 'react'
import { Plus, Trash2, Loader2, X, Receipt, Upload, Paperclip, Sparkles } from 'lucide-react'
import Image from 'next/image'
import AdminShell from '@/components/admin/AdminShell'
import ExportCsvButton from '@/components/admin/ExportCsvButton'
import SortableTh from '@/components/admin/SortableTh'
import { useSortable } from '@/lib/use-sortable'

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
  receiptUrl?: string | null
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
  // Controlled form state so OCR can pre-fill. Blank defaults; populated
  // either by hand or by the receipt-extraction flow.
  type ExpenseForm = {
    category: string
    vendor: string
    amount: string
    description: string
    paymentMethod: string
    expenseDate: string
    paymentReference: string
  }
  const BLANK_FORM = (): ExpenseForm => ({
    category: '',
    vendor: '',
    amount: '',
    description: '',
    paymentMethod: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentReference: '',
  })
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(BLANK_FORM())
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractNotice, setExtractNotice] = useState<string | null>(null)
  const [extractedConfidence, setExtractedConfidence] = useState<Record<string, 'high' | 'medium' | 'low'>>({})

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

  function resetExpenseModal() {
    setExpenseForm(BLANK_FORM())
    setReceiptUrl(null)
    setExtractNotice(null)
    setExtractedConfidence({})
    setExpenseError('')
  }

  async function handleReceiptUpload(file: File) {
    setExtracting(true)
    setExtractNotice(null)
    try {
      const fd = new FormData()
      fd.append('receipt', file)
      const res = await fetch('/api/admin/expenses/extract-receipt', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setExtractNotice(data.error || 'Upload failed.')
      } else {
        setReceiptUrl(data.receiptUrl)
        if (data.extracted) {
          setExpenseForm({
            category: data.extracted.category || '',
            vendor: data.extracted.vendor || '',
            amount: data.extracted.amount ? String(data.extracted.amount) : '',
            description: data.extracted.description || '',
            paymentMethod: data.extracted.paymentMethod || '',
            expenseDate: data.extracted.expenseDate || new Date().toISOString().slice(0, 10),
            paymentReference: '',
          })
          setExtractedConfidence(data.extracted.confidence || {})
          setExtractNotice('Pre-filled from receipt. Review each field — low-confidence values are flagged below the inputs.')
        } else if (data.extractionError) {
          setExtractNotice(`Receipt attached but extraction couldn't complete: ${data.extractionError} Fill the fields manually.`)
        }
      }
    } catch (err) {
      setExtractNotice(err instanceof Error ? err.message : 'Network error.')
    }
    setExtracting(false)
  }

  async function handleExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setExpenseSaving(true)
    setExpenseError('')
    const payload = { ...expenseForm, receiptUrl }
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
        resetExpenseModal()
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

  const rows = summary?.expenses.recent || []
  const loggedRows = rows.filter((e) => !e.isSynthetic)

  const expenseSort = useSortable(rows, {
    date: (e) => e.expenseDate ? new Date(e.expenseDate) : null,
    category: (e) => e.category,
    vendor: (e) => e.vendor,
    description: (e) => e.description || '',
    amount: (e) => e.amount,
    method: (e) => e.paymentMethod || '',
    loggedBy: (e) => e.createdBy || '',
  }, { key: 'date', dir: 'desc' })
  const sortedExpenses = expenseSort.sortedRows

  if (status === 'loading' || loading || !summary) {
    return (
      <AdminShell title="Expenses">
        <div className="animate-pulse text-mid text-sm">Loading…</div>
      </AdminShell>
    )
  }

  const exportColumns = [
    { header: 'Date', get: (e: Expense) => e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '' },
    { header: 'Category', get: (e: Expense) => e.category },
    { header: 'Vendor', get: (e: Expense) => e.vendor },
    { header: 'Description', get: (e: Expense) => e.description || '' },
    { header: 'Amount', get: (e: Expense) => e.amount },
    { header: 'Payment Method', get: (e: Expense) => e.paymentMethod || '' },
    { header: 'Reference', get: (e: Expense) => e.paymentReference || '' },
    { header: 'Logged By', get: (e: Expense) => e.createdBy || '' },
    { header: 'Type', get: (e: Expense) => e.isSynthetic ? 'auto' : 'logged' },
  ]
  const exportFilename = `cvicc-expenses-${new Date().toISOString().slice(0, 10)}.csv`

  const headerActions = (
    <>
      <ExportCsvButton filename={exportFilename} rows={rows} columns={exportColumns} />
      <button
        type="button"
        onClick={() => { setExpenseError(''); setShowExpense(true) }}
        className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-gold-900"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Add Expense</span>
      </button>
    </>
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
                  <SortableTh label="Date" sortKey="date" activeKey={expenseSort.sortKey} dir={expenseSort.sortDir} onToggle={expenseSort.toggleSort} />
                  <SortableTh label="Category" sortKey="category" activeKey={expenseSort.sortKey} dir={expenseSort.sortDir} onToggle={expenseSort.toggleSort} />
                  <SortableTh label="Vendor" sortKey="vendor" activeKey={expenseSort.sortKey} dir={expenseSort.sortDir} onToggle={expenseSort.toggleSort} />
                  <SortableTh label="Description" sortKey="description" activeKey={expenseSort.sortKey} dir={expenseSort.sortDir} onToggle={expenseSort.toggleSort} />
                  <SortableTh label="Method / Ref" sortKey="method" activeKey={expenseSort.sortKey} dir={expenseSort.sortDir} onToggle={expenseSort.toggleSort} />
                  <SortableTh label="Logged By" sortKey="loggedBy" activeKey={expenseSort.sortKey} dir={expenseSort.sortDir} onToggle={expenseSort.toggleSort} />
                  <SortableTh label="Amount" sortKey="amount" activeKey={expenseSort.sortKey} dir={expenseSort.sortDir} onToggle={expenseSort.toggleSort} align="right" />
                  <th className="px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((e) => (
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
                    <td className="px-4 py-2.5 font-medium text-brand">
                      <div className="flex items-center gap-1.5">
                        <span>{e.vendor}</span>
                        {e.receiptUrl && (
                          <a
                            href={e.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View attached receipt"
                            className="text-accent hover:text-gold-900"
                          >
                            <Paperclip className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
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
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-start justify-center p-4 overflow-y-auto" onClick={() => { if (!expenseSaving && !extracting) { setShowExpense(false); resetExpenseModal() } }}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-brand">Log expense</h3>
              <button type="button" onClick={() => { if (!expenseSaving && !extracting) { setShowExpense(false); resetExpenseModal() } }} className="text-mid hover:text-brand"><X className="w-5 h-5" /></button>
            </div>

            {/* Receipt upload / OCR section */}
            <div className="mb-4 rounded-lg border border-dashed border-accent/40 bg-accent/5 p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand">Upload a receipt to auto-fill</p>
                  <p className="text-[0.7rem] text-mid">
                    Image (JPG / PNG / HEIC) or PDF, up to 10 MB. Fields pre-fill from the receipt — you review before saving.
                  </p>
                </div>
                <label className={`inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-2 rounded cursor-pointer hover:bg-gold-900 ${extracting ? 'opacity-50 pointer-events-none' : ''}`}>
                  {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {extracting ? 'Reading…' : 'Upload receipt'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleReceiptUpload(f)
                      e.target.value = ''
                    }}
                    disabled={extracting || expenseSaving}
                  />
                </label>
              </div>
              {receiptUrl && (
                <div className="mt-3 flex items-start gap-3">
                  {/^https?:\/\/.+\.(jpg|jpeg|png|webp|heic|gif)$/i.test(receiptUrl) ? (
                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <Image src={receiptUrl} alt="Receipt preview" width={64} height={64} className="w-16 h-16 object-cover rounded border border-ivory-200" unoptimized />
                    </a>
                  ) : (
                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand hover:text-accent border border-ivory-200 rounded px-2 py-1">
                      <Paperclip className="w-3 h-3" /> View receipt
                    </a>
                  )}
                  <div className="text-[0.7rem] text-mid flex-1 min-w-0">
                    Receipt attached — will be saved with the expense.
                  </div>
                </div>
              )}
              {extractNotice && (
                <div className="mt-3 text-[0.7rem] text-brand bg-white border border-ivory-200 rounded px-3 py-2">
                  {extractNotice}
                </div>
              )}
            </div>

            <form onSubmit={handleExpense} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">
                  Category *{extractedConfidence.category && extractedConfidence.category !== 'high' && <span className="ml-2 text-amber-700 normal-case">⚠ low confidence — double-check</span>}
                </label>
                <input value={expenseForm.category} onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))} required placeholder="e.g. Event, Marketing, Office, Insurance" className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">
                  Vendor *{extractedConfidence.vendor && extractedConfidence.vendor !== 'high' && <span className="ml-2 text-amber-700 normal-case">⚠ check</span>}
                </label>
                <input value={expenseForm.vendor} onChange={(e) => setExpenseForm((f) => ({ ...f, vendor: e.target.value }))} required className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">
                  Amount ($) *{extractedConfidence.amount && extractedConfidence.amount !== 'high' && <span className="ml-2 text-amber-700 normal-case">⚠ check</span>}
                </label>
                <input value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} type="number" min="1" step="1" required className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Description</label>
                <input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Payment method</label>
                <select value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="w-full border border-ivory-200 rounded px-3 py-2 text-sm">
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
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">
                  Date{extractedConfidence.expenseDate && extractedConfidence.expenseDate !== 'high' && <span className="ml-2 text-amber-700 normal-case">⚠ check</span>}
                </label>
                <input value={expenseForm.expenseDate} onChange={(e) => setExpenseForm((f) => ({ ...f, expenseDate: e.target.value }))} type="date" className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[0.65rem] font-medium uppercase tracking-wide text-brand block mb-1">Reference (check #, invoice #, memo)</label>
                <input value={expenseForm.paymentReference} onChange={(e) => setExpenseForm((f) => ({ ...f, paymentReference: e.target.value }))} className="w-full border border-ivory-200 rounded px-3 py-2 text-sm" />
              </div>
              {expenseError && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{expenseError}</div>}
              <div className="md:col-span-2 flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowExpense(false); resetExpenseModal() }} disabled={expenseSaving} className="flex-1 bg-white border border-ivory-200 text-mid text-xs font-medium px-4 py-2.5 rounded hover:border-brand/30 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={expenseSaving || extracting} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-accent text-white text-xs font-medium px-4 py-2.5 rounded hover:bg-gold-900 disabled:opacity-50">
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
