'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--announcement-height', dismissed ? '0px' : '32px')
  }, [dismissed])

  useEffect(() => {
    document.documentElement.style.setProperty('--announcement-height', '32px')
    return () => {
      document.documentElement.style.setProperty('--announcement-height', '0px')
    }
  }, [])

  if (dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[250] bg-accent" style={{ height: 32 }}>
      <div className="max-w-container mx-auto px-10 py-2 flex items-center justify-center">
        <Link
          href="/join"
          className="font-label text-[0.6rem] sm:text-[0.65rem] tracking-widest uppercase text-white hover:text-white/80 transition-opacity"
        >
          Founding Member Offer — <span className="font-medium">Save $100</span> on Annual Membership
          <span className="hidden sm:inline"> · Limited Spots</span>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
