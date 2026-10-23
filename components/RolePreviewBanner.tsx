'use client'

import { Shield, Eye, X } from 'lucide-react'
import { useEffectiveRole } from '@/lib/use-effective-role'

/**
 * Role switcher for real admins only — hidden for anyone else.
 *
 * When the admin is viewing in their own role (effectiveRole === 'admin'),
 * the full three-pill switcher appears so they can preview Moderator or
 * Reviewer. Once they ARE previewing one of those lower roles, the pills
 * collapse to a thin, unobtrusive exit strip so the preview matches what
 * the real moderator / reviewer would see — no admin-only chrome on the
 * screen while testing. The exit strip stays discreet but reachable.
 */
export default function RolePreviewBanner() {
  const { canPreview, effectiveRole, setPreview, exitPreview } = useEffectiveRole()

  if (!canPreview) return null

  const isPreviewingOther = effectiveRole === 'moderator' || effectiveRole === 'reviewer'

  // z-[300] beats AnnouncementBar (z-[250]) so the control stays clickable
  // instead of being covered by the announcement bar's <Link href="/join">
  // that spans its full width.
  if (isPreviewingOther) {
    return (
      <div className="sticky top-0 z-[300] bg-navy-900/95 border-b border-navy-800">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-end">
          <button
            type="button"
            onClick={exitPreview}
            className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase font-label text-white/60 hover:text-gold-400 transition-colors"
            title="Return to your own admin view"
          >
            <X className="w-3 h-3" />
            Exit preview
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-[300] bg-navy-900 border-b border-navy-800">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-gold-400">
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[0.6rem] font-label tracking-widest uppercase">View As</span>
        </div>
        <div className="flex gap-1.5 flex-wrap flex-1">
          <button
            type="button"
            onClick={exitPreview}
            className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase font-label px-3 py-1.5 rounded bg-gold-400 text-navy-900 font-semibold"
          >
            <Shield className="w-3 h-3" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => setPreview('moderator')}
            className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase font-label px-3 py-1.5 rounded transition-all bg-white/10 text-white hover:bg-white/20"
          >
            <Shield className="w-3 h-3" />
            Moderator
          </button>
          <button
            type="button"
            onClick={() => setPreview('reviewer')}
            className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase font-label px-3 py-1.5 rounded transition-all bg-white/10 text-white hover:bg-white/20"
          >
            <Shield className="w-3 h-3" />
            Reviewer
          </button>
        </div>
      </div>
    </div>
  )
}
