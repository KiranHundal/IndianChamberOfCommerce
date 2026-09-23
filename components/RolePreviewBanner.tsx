'use client'

import { Eye, X } from 'lucide-react'
import { useEffectiveRole } from '@/lib/use-effective-role'

const ROLE_LABELS: Record<string, string> = {
  moderator: 'Moderator (finance team)',
  reviewer: 'Reviewer (approves/denies members only)',
}

export default function RolePreviewBanner() {
  const { isPreviewing, preview, setPreview, exitPreview } = useEffectiveRole()

  if (!isPreviewing || !preview) return null

  return (
    <div className="sticky top-0 z-40 bg-navy-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <Eye className="w-4 h-4 text-gold-400 flex-shrink-0" />
        <p className="text-[0.7rem] tracking-widest uppercase font-label flex-1 min-w-0">
          Previewing as <span className="text-gold-400 font-semibold">{ROLE_LABELS[preview] || preview}</span>
        </p>
        <div className="flex gap-2">
          {preview !== 'moderator' && (
            <button
              onClick={() => setPreview('moderator')}
              className="text-[0.6rem] tracking-widest uppercase font-label bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded"
            >
              Switch to Moderator
            </button>
          )}
          {preview !== 'reviewer' && (
            <button
              onClick={() => setPreview('reviewer')}
              className="text-[0.6rem] tracking-widest uppercase font-label bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded"
            >
              Switch to Reviewer
            </button>
          )}
          <button
            onClick={exitPreview}
            className="inline-flex items-center gap-1 text-[0.6rem] tracking-widest uppercase font-label bg-gold-400 text-navy-900 hover:bg-gold-500 px-2.5 py-1 rounded"
          >
            <X className="w-3 h-3" />
            Exit Preview
          </button>
        </div>
      </div>
    </div>
  )
}
