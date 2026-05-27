'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  User,
  Building2,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  AlertTriangle,
  CreditCard,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

const tierLabels: Record<string, string> = {
  individual: 'Individual Membership',
  corporate: 'Corporate Membership',
}

const tierPrices: Record<string, string> = {
  individual: '$95/year',
  corporate: '$395/year',
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Pending Approval', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  approved: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  deactivated: { label: 'Deactivated', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: XCircle },
}

export default function PortalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [deactivating, setDeactivating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  if (!session?.user) return null

  const user = session.user as Record<string, unknown>
  const memberStatus = (user.status as string) || 'pending'
  const membershipTier = (user.membershipTier as string) || 'individual'
  const role = (user.role as string) || 'member'
  const statusInfo = statusConfig[memberStatus] || statusConfig.pending
  const StatusIcon = statusInfo.icon

  async function handleDeactivate() {
    setDeactivating(true)
    try {
      const res = await fetch('/api/portal/deactivate', { method: 'POST' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      }
    } catch {
      setDeactivating(false)
    }
  }

  return (
    <>
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30 corner-bracket corner-bracket-tl" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30 corner-bracket corner-bracket-tr" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30 corner-bracket corner-bracket-bl" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30 corner-bracket corner-bracket-br" />

        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>Member Portal</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">
              Welcome, {session.user.name?.split(' ')[0]}
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Membership Status */}
            <AnimatedSection>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 h-full relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-brand">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-label text-label tracking-label uppercase text-brand">
                    Membership Status
                  </h3>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusInfo.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                  <span className={`font-label text-label tracking-label uppercase ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {memberStatus === 'pending' && (
                  <p className="text-small text-mid mt-4">
                    Your membership is being reviewed by an administrator. You&rsquo;ll receive an email once approved.
                  </p>
                )}
                {memberStatus === 'rejected' && (
                  <p className="text-small text-mid mt-4">
                    Your membership application was not approved. Please contact us for more information.
                  </p>
                )}

                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>

            {/* Membership Tier */}
            <AnimatedSection delay={1}>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 h-full relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-accent">
                    {membershipTier === 'corporate' ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <h3 className="font-label text-label tracking-label uppercase text-brand">
                    Membership Tier
                  </h3>
                </div>

                <p className="font-display text-h3 font-light text-brand">
                  {tierLabels[membershipTier] || 'Individual Membership'}
                </p>

                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>

            {/* Account Info */}
            <AnimatedSection delay={2}>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 h-full relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-brand">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-label text-label tracking-label uppercase text-brand">
                    Account
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="font-label text-[0.625rem] tracking-widest uppercase text-hint">Name</p>
                    <p className="text-body text-charcoal">{session.user.name}</p>
                  </div>
                  <div>
                    <p className="font-label text-[0.625rem] tracking-widest uppercase text-hint">Email</p>
                    <p className="text-body text-charcoal">{session.user.email}</p>
                  </div>
                </div>

                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>

            {/* Billing */}
            <AnimatedSection delay={3}>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 h-full relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-accent">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="font-label text-label tracking-label uppercase text-brand">
                    Billing
                  </h3>
                </div>

                <p className="font-display text-h3 font-light text-brand">
                  {tierPrices[membershipTier] || '$95/year'}
                </p>
                <p className="text-small text-mid mt-2">
                  Payments are processed through Square. To manage your billing or update payment info, contact us.
                </p>

                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>
          </div>

          {/* Admin Link */}
          {role === 'admin' && (
            <AnimatedSection delay={4}>
              <div className="mt-8 bg-navy-900 border border-navy-800 rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gold-400" />
                  <span className="font-label text-label tracking-label uppercase text-white">
                    Admin Dashboard
                  </span>
                </div>
                <a
                  href="/admin"
                  className="cta-button-glow bg-accent text-white font-label text-label tracking-label uppercase px-5 py-2 rounded-sm"
                >
                  Manage Members
                </a>
              </div>
            </AnimatedSection>
          )}

          {/* Actions */}
          <AnimatedSection delay={5}>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center justify-center gap-2 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-6 py-3 rounded-sm hover:border-brand/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>

              {memberStatus === 'approved' && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-label text-label tracking-label uppercase px-6 py-3 rounded-sm hover:bg-red-50 transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Deactivate Membership
                </button>
              )}
            </div>
          </AnimatedSection>

          {/* Deactivation Confirmation Modal */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-display text-h4 text-brand">Deactivate Membership?</h3>
                </div>
                <p className="text-body text-mid mb-6">
                  This will deactivate your CVICC membership. You can contact us to reactivate later.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="flex-1 bg-red-600 text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {deactivating ? 'Deactivating...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
