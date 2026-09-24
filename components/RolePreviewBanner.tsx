'use client'

import { Shield, Eye } from 'lucide-react'
import { useEffectiveRole } from '@/lib/use-effective-role'

/**
 * Role switcher for real admins. Three pills, always visible on every
 * /admin route. Clicking "Admin" resets to full admin view; clicking
 * Moderator / Reviewer previews that role's UI (client-side only). Hidden
 * for non-admin users so they don't see admin controls.
 */
export default function RolePreviewBanner() {
  const { canPreview, effectiveRole, setPreview, exitPreview } = useEffectiveRole()

  if (!canPreview) return null

  const activeIsAdmin = effectiveRole === 'admin'
  const activeIsModerator = effectiveRole === 'moderator'
  const activeIsReviewer = effectiveRole === 'reviewer'

  return (
    <div className="sticky top-0 z-40 bg-navy-900 border-b border-navy-800">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-gold-400">
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[0.6rem] font-label tracking-widest uppercase">View As</span>
        </div>
        <div className="flex gap-1.5 flex-wrap flex-1">
          <button
            onClick={exitPreview}
            className={`inline-flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase font-label px-3 py-1.5 rounded transition-all ${
              activeIsAdmin
                ? 'bg-gold-400 text-navy-900 font-semibold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Shield className="w-3 h-3" />
            Admin
          </button>
          <button
            onClick={() => setPreview('moderator')}
            className={`inline-flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase font-label px-3 py-1.5 rounded transition-all ${
              activeIsModerator
                ? 'bg-gold-400 text-navy-900 font-semibold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Shield className="w-3 h-3" />
            Moderator
          </button>
          <button
            onClick={() => setPreview('reviewer')}
            className={`inline-flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase font-label px-3 py-1.5 rounded transition-all ${
              activeIsReviewer
                ? 'bg-gold-400 text-navy-900 font-semibold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Shield className="w-3 h-3" />
            Reviewer
          </button>
        </div>
        {!activeIsAdmin && (
          <span className="text-[0.6rem] font-label tracking-widest uppercase text-gold-400 whitespace-nowrap">
            Preview only — full admin server-side
          </span>
        )}
      </div>
    </div>
  )
}
