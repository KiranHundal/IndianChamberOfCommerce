'use client'

import { useEffect, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import type { Leadership } from '@/lib/types'

interface Props {
  leader: Leadership
}

interface BioBlock {
  children?: Array<{ text?: string }>
}

export default function LeaderBioButton({ leader }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const paragraphs = (leader.bio as unknown as BioBlock[])
    .map((block) => block.children?.[0]?.text || '')
    .filter(Boolean)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 text-accent hover:text-gold-900 font-label text-[0.65rem] tracking-widest uppercase transition-colors"
      >
        Read Bio
        <ArrowRight className="w-3 h-3" strokeWidth={2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[400] bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`bio-title-${leader._id}`}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-5 right-5 text-mid hover:text-brand transition-colors z-10"
              aria-label="Close bio"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8 sm:p-10">
              <h3
                id={`bio-title-${leader._id}`}
                className="font-display text-h3 text-brand pr-8"
              >
                {leader.name}
              </h3>
              <p className="font-label text-label tracking-widest uppercase text-brand/70 mt-2">
                {leader.role}
              </p>
              {leader.sector && (
                <p className="text-small text-mid mt-1">{leader.sector.name}</p>
              )}
              <div className="mt-6 space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-body text-charcoal leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
