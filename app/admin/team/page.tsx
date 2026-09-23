'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Video, Users, Shield } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function AdminTeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const user = session?.user as Record<string, unknown>
      if (user?.role !== 'admin') {
        router.push('/admin')
      }
    }
  }, [status, session, router])

  if (status === 'loading') {
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
            <SectionTitle dark className="mt-4">Team &amp; Content</SectionTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/board-members" className="bg-white border border-ivory-200 rounded-xl p-6 hover:border-accent/40 hover:shadow-hover transition-all">
              <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-h4 text-brand">Board Members</h3>
              <p className="text-small text-mid mt-2">
                Add, edit, or remove board members. Upload photos, set roles, send welcome emails.
              </p>
              <p className="text-[0.65rem] text-hint mt-3 tracking-widest uppercase">
                Manage →
              </p>
            </Link>

            <Link href="/admin/videos" className="bg-white border border-ivory-200 rounded-xl p-6 hover:border-accent/40 hover:shadow-hover transition-all">
              <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-h4 text-brand">Leadership Videos</h3>
              <p className="text-small text-mid mt-2">
                Upload or replace video messages for each leader. Shown on the About / Leadership page.
              </p>
              <p className="text-[0.65rem] text-hint mt-3 tracking-widest uppercase">
                Manage →
              </p>
            </Link>

            <Link href="/admin/members?status=all&role=staff" className="bg-white border border-ivory-200 rounded-xl p-6 hover:border-accent/40 hover:shadow-hover transition-all">
              <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-h4 text-brand">Team Accounts</h3>
              <p className="text-small text-mid mt-2">
                Grant admin or moderator access to staff. Moderators can approve members but can&rsquo;t change board content or reports.
              </p>
              <p className="text-[0.65rem] text-hint mt-3 tracking-widest uppercase">
                View team →
              </p>
            </Link>

            <Link href="/admin/finances#invitations" className="bg-white border border-ivory-200 rounded-xl p-6 hover:border-accent/40 hover:shadow-hover transition-all">
              <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-h4 text-brand">Invitations Sent</h3>
              <p className="text-small text-mid mt-2">
                Review invitations sent, who converted, and send new ones. Managed inside Finances.
              </p>
              <p className="text-[0.65rem] text-hint mt-3 tracking-widest uppercase">
                View →
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
