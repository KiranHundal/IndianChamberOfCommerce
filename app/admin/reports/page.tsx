'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Users, DollarSign, Receipt, ExternalLink } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

interface Summary {
  gross: number
  net: number
  fees: number
  memberCount: number
  paymentCount: number
}

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance-summary')
      if (res.ok) {
        const data = await res.json()
        setSummary({
          gross: data.revenue.tracked,
          net: data.revenue.net,
          fees: data.revenue.estimatedSquareFees,
          memberCount: data.memberCount.approved,
          paymentCount: data.revenue.squareTransactionCount,
        })
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const user = session?.user as Record<string, unknown>
      if (user?.role !== 'admin') {
        router.push('/admin')
        return
      }
      fetchSummary()
    }
  }, [status, session, router, fetchSummary])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <section className="bg-navy-900 py-24 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />
        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>Admin</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">Reports &amp; Exports</SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-16">
        <div className="max-w-4xl mx-auto px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-mid hover:text-brand font-label text-[0.65rem] tracking-widest uppercase mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Admin
          </Link>

          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-ivory-200 rounded-xl p-4">
                <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Gross Revenue</p>
                <p className="font-display text-h4 text-brand mt-1">{money(summary.gross)}</p>
              </div>
              <div className="bg-white border border-ivory-200 rounded-xl p-4">
                <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Net Revenue</p>
                <p className="font-display text-h4 text-brand mt-1">{money(summary.net)}</p>
              </div>
              <div className="bg-white border border-ivory-200 rounded-xl p-4">
                <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Members</p>
                <p className="font-display text-h4 text-brand mt-1">{summary.memberCount}</p>
              </div>
              <div className="bg-white border border-ivory-200 rounded-xl p-4">
                <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/60">Payments</p>
                <p className="font-display text-h4 text-brand mt-1">{summary.paymentCount}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-accent" />
                <h3 className="font-display text-h4 text-brand">Treasurer&rsquo;s Report</h3>
              </div>
              <p className="text-small text-mid mb-4">
                Board-ready PDF with gross revenue, Square fees, expenses, and net position. Signed off as Treasurer &amp; CFO.
              </p>
              <Link
                href="/api/admin/reports/treasurer.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-gold-900 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </Link>
            </div>

            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="font-display text-h4 text-brand">Members CSV</h3>
              </div>
              <p className="text-small text-mid mb-4">
                Full member list — name, email, business, tier, status, payment info. For your own records or a CPA handoff.
              </p>
              <Link
                href="/api/admin/reports/members.csv"
                className="inline-flex items-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:border-accent/40 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                Download CSV
              </Link>
            </div>

            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5 text-accent" />
                <h3 className="font-display text-h4 text-brand">Square Payments CSV</h3>
              </div>
              <p className="text-small text-mid mb-4">
                Every completed Square payment — amount, fee, buyer, receipt number, matched member. Great for reconciling with your Square statements.
              </p>
              <Link
                href="/api/admin/reports/payments.csv"
                className="inline-flex items-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:border-accent/40 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                Download CSV
              </Link>
            </div>

            <div className="bg-white border border-ivory-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Receipt className="w-5 h-5 text-accent" />
                <h3 className="font-display text-h4 text-brand">Expenses CSV</h3>
              </div>
              <p className="text-small text-mid mb-4">
                Everything logged in Finances → Expenses, plus estimated Square fees.
              </p>
              <Link
                href="/api/admin/reports/expenses.csv"
                className="inline-flex items-center gap-2 bg-white border border-ivory-200 text-brand font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:border-accent/40 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                Download CSV
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-navy-50 border border-navy-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-accent" />
              <p className="font-label text-[0.65rem] tracking-widest uppercase text-brand">Also useful</p>
            </div>
            <p className="text-small text-mid">
              Head over to <Link href="/admin/finances" className="text-accent hover:underline">Finances</Link> for live filtering,
              reconciliation, and to add offline payments or expenses.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
