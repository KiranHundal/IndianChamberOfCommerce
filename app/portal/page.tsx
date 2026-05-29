'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent } from 'react'
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
  CalendarDays,
  Pencil,
  X,
  Save,
  Award,
  RefreshCw,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

interface MemberProfile {
  id: string
  name: string
  email: string
  phone: string | null
  businessName: string | null
  city: string | null
  sector: string | null
  membershipTier: string
  status: string
  role: string
  membershipNumber: string | null
  createdAt: string | null
  approvedAt: string | null
  renewalDate: string | null
}

const tierLabels: Record<string, string> = {
  individual: 'Individual Membership',
  corporate: 'Corporate Membership',
}

const tierPrices: Record<string, string> = {
  individual: '$95/year',
  corporate: '$395/year',
}

const tierBenefits: Record<string, string[]> = {
  individual: [
    'Business directory listing',
    'Access to all networking events',
    'Mentorship program eligibility',
    'Monthly newsletter & updates',
    'Voting rights at general meetings',
  ],
  corporate: [
    'Business directory listing',
    'Access to all networking events',
    'Mentorship program eligibility',
    'Monthly newsletter & updates',
    'Voting rights at general meetings',
    'Featured directory placement',
    'Logo on partners page',
    'Priority event sponsorship access',
    'Up to 5 employee profiles',
    'Social media promotion',
  ],
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Pending Approval', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  approved: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  deactivated: { label: 'Deactivated', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: XCircle },
}

const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntilRenewal(renewalDate: string | null): number | null {
  if (!renewalDate) return null
  const now = new Date()
  const renewal = new Date(renewalDate)
  const diff = renewal.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function PortalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/portal/profile')
        .then((r) => r.json())
        .then((data) => {
          if (data.id) setProfile(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  if (!session?.user || !profile) return null

  const memberStatus = profile.status || 'pending'
  const membershipTier = profile.membershipTier || 'individual'
  const role = profile.role || 'member'
  const statusInfo = statusConfig[memberStatus] || statusConfig.pending
  const StatusIcon = statusInfo.icon
  const benefits = tierBenefits[membershipTier] || tierBenefits.individual
  const daysLeft = daysUntilRenewal(profile.renewalDate)
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0
  const isExpired = daysLeft !== null && daysLeft <= 0

  async function handleProfileSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = e.currentTarget
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
    const businessName = (form.elements.namedItem('businessName') as HTMLInputElement).value
    const city = (form.elements.namedItem('city') as HTMLInputElement).value
    const sector = (form.elements.namedItem('sector') as HTMLInputElement).value

    try {
      await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, businessName, city, sector }),
      })
      setProfile((p) => (p ? { ...p, phone, businessName, city, sector } : p))
      setEditing(false)
    } catch { /* silent */ }
    setSaving(false)
  }

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
              Welcome, {profile.name?.split(' ')[0]}
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-24">
        <div className="max-w-5xl mx-auto px-8">

          {/* Digital Membership Card */}
          {profile.membershipNumber && memberStatus === 'approved' && (
            <AnimatedSection>
              <div className="bg-gradient-to-br from-navy-900 via-navy-900 to-[#1a2d4a] rounded-2xl p-8 md:p-10 mb-10 relative overflow-hidden">
                <div className="absolute top-6 right-6 w-16 h-16 border-t border-r border-gold-600/20" />
                <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l border-gold-600/20" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-600/5 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  <div>
                    <p className="font-label text-[0.625rem] tracking-[0.25em] uppercase text-gold-400/80">
                      Central Valley Indian Chamber of Commerce
                    </p>
                    <h2 className="font-display text-h2 md:text-display font-light text-white mt-3">
                      {profile.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <span className="inline-flex items-center gap-1.5 text-white/50 text-small">
                        {membershipTier === 'corporate' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        {tierLabels[membershipTier]}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-white/50 text-small">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Member since {formatDate(profile.approvedAt || profile.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="font-label text-[0.625rem] tracking-[0.25em] uppercase text-gold-400/80">
                      Membership No.
                    </p>
                    <p className="font-display text-[2.5rem] md:text-[3rem] font-light text-white tracking-[0.15em] mt-1">
                      {profile.membershipNumber}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Membership Status */}
            <AnimatedSection delay={1}>
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

            {/* Renewal Status */}
            <AnimatedSection delay={2}>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 h-full relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-accent">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h3 className="font-label text-label tracking-label uppercase text-brand">
                    Renewal
                  </h3>
                </div>

                {profile.renewalDate ? (
                  <>
                    <p className="font-display text-h3 font-light text-brand">
                      {formatDate(profile.renewalDate)}
                    </p>
                    <p className="text-small text-mid mt-1">
                      {tierPrices[membershipTier]} &middot;{' '}
                      {isExpired ? (
                        <span className="text-red-600 font-medium">Expired</span>
                      ) : isExpiringSoon ? (
                        <span className="text-amber-600 font-medium">{daysLeft} days remaining</span>
                      ) : (
                        <span className="text-emerald-600">{daysLeft} days remaining</span>
                      )}
                    </p>

                    {(isExpiringSoon || isExpired) && (
                      <a
                        href={membershipTier === 'corporate' ? 'https://square.link/u/9opDARDg' : 'https://square.link/u/Av93qe4Z'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 bg-accent text-white font-label text-label tracking-label uppercase px-5 py-2.5 rounded-sm hover:bg-gold-900 transition-all"
                      >
                        Renew Now
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-body text-mid">Renewal date will appear once your membership is approved.</p>
                )}

                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>

            {/* Profile / Account Info */}
            <AnimatedSection delay={3}>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 h-full relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-brand">
                      <User className="w-5 h-5" />
                    </div>
                    <h3 className="font-label text-label tracking-label uppercase text-brand">
                      Profile
                    </h3>
                  </div>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-accent font-label text-[0.625rem] tracking-widest uppercase hover:text-gold-900 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>

                {editing ? (
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                      <label className="font-label text-[0.6rem] tracking-widest uppercase text-hint block mb-1.5">Phone</label>
                      <input name="phone" type="tel" defaultValue={profile.phone || ''} className={inputClass} placeholder="(555) 123-4567" />
                    </div>
                    <div>
                      <label className="font-label text-[0.6rem] tracking-widest uppercase text-hint block mb-1.5">Business Name</label>
                      <input name="businessName" type="text" defaultValue={profile.businessName || ''} className={inputClass} placeholder="Your business" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-label text-[0.6rem] tracking-widest uppercase text-hint block mb-1.5">City</label>
                        <input name="city" type="text" defaultValue={profile.city || ''} className={inputClass} placeholder="e.g. Fresno" />
                      </div>
                      <div>
                        <label className="font-label text-[0.6rem] tracking-widest uppercase text-hint block mb-1.5">Industry</label>
                        <input name="sector" type="text" defaultValue={profile.sector || ''} className={inputClass} placeholder="e.g. IT" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-accent text-white font-label text-[0.625rem] tracking-widest uppercase px-4 py-2 rounded-sm hover:bg-gold-900 transition-all disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1.5 text-mid font-label text-[0.625rem] tracking-widest uppercase px-4 py-2 border border-ivory-200 rounded-sm hover:border-brand/30 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="font-label text-[0.6rem] tracking-widest uppercase text-hint">Name</p>
                      <p className="text-body text-charcoal">{profile.name}</p>
                    </div>
                    <div>
                      <p className="font-label text-[0.6rem] tracking-widest uppercase text-hint">Email</p>
                      <p className="text-body text-charcoal">{profile.email}</p>
                    </div>
                    {profile.phone && (
                      <div>
                        <p className="font-label text-[0.6rem] tracking-widest uppercase text-hint">Phone</p>
                        <p className="text-body text-charcoal">{profile.phone}</p>
                      </div>
                    )}
                    {profile.businessName && (
                      <div>
                        <p className="font-label text-[0.6rem] tracking-widest uppercase text-hint">Business</p>
                        <p className="text-body text-charcoal">{profile.businessName}</p>
                      </div>
                    )}
                    {(profile.city || profile.sector) && (
                      <div className="flex gap-6">
                        {profile.city && (
                          <div>
                            <p className="font-label text-[0.6rem] tracking-widest uppercase text-hint">City</p>
                            <p className="text-body text-charcoal">{profile.city}</p>
                          </div>
                        )}
                        {profile.sector && (
                          <div>
                            <p className="font-label text-[0.6rem] tracking-widest uppercase text-hint">Industry</p>
                            <p className="text-body text-charcoal">{profile.sector}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>

            {/* Billing */}
            <AnimatedSection delay={4}>
              <div className="leadership-card bg-white border border-ivory-200 rounded-xl p-8 h-full relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-accent">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="font-label text-label tracking-label uppercase text-brand">
                    Billing
                  </h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <p className="font-display text-h3 font-light text-brand">
                    {tierPrices[membershipTier] || '$95/year'}
                  </p>
                  <span className="text-small text-hint">
                    ({tierLabels[membershipTier]})
                  </span>
                </div>
                <p className="text-small text-mid mt-2">
                  Payments are processed through Square. To manage your billing or update payment info, contact us.
                </p>

                <div className="gold-accent-line" />
              </div>
            </AnimatedSection>
          </div>

          {/* Membership Benefits */}
          <AnimatedSection delay={5}>
            <div className="mt-8 leadership-card bg-white border border-ivory-200 rounded-xl p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-accent">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-label text-label tracking-label uppercase text-brand">
                  Your Membership Benefits
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-small text-mid">{benefit}</span>
                  </div>
                ))}
              </div>

              {membershipTier === 'individual' && (
                <div className="mt-6 pt-6 border-t border-ivory-200">
                  <p className="text-small text-mid">
                    Want more benefits?{' '}
                    <a href="/contact" className="text-accent hover:text-gold-900 font-medium transition-colors">
                      Contact us to upgrade to Corporate
                    </a>
                  </p>
                </div>
              )}

              <div className="gold-accent-line" />
            </div>
          </AnimatedSection>

          {/* Admin Link */}
          {role === 'admin' && (
            <AnimatedSection delay={6}>
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
          <AnimatedSection delay={7}>
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
