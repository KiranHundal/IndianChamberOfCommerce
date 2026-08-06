'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Play, X } from 'lucide-react'

interface Props {
  quote: string
  name: string
  title: string
  credential: string
  image: string
  videoUrl?: string
}

export default function TestimonialCard({ quote, name, title, credential, image, videoUrl }: Props) {
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

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header: photo + name */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold-600/30">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover object-top"
            />
          </div>
          <div>
            <p className="font-display text-[1rem] text-white">{name}</p>
            <p className="font-label text-[0.55rem] tracking-widest uppercase text-gold-600/80 mt-0.5">
              {title}
            </p>
            {credential && (
              <p className="text-[0.7rem] text-white/40 mt-0.5">
                {credential}
              </p>
            )}
          </div>
        </div>

        {/* Video thumbnail (if uploaded) */}
        {videoUrl && (
          <button
            onClick={() => setOpen(true)}
            className="group relative mt-6 aspect-video rounded-lg overflow-hidden bg-navy-800 border border-white/10 hover:border-gold-600/40 transition-all"
            aria-label={`Play video from ${name}`}
          >
            <video
              src={videoUrl}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-accent/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
              <span className="font-label text-[0.6rem] tracking-widest uppercase text-white/90 bg-navy-900/60 backdrop-blur-sm px-2 py-1 rounded-sm">
                Watch Message
              </span>
            </div>
          </button>
        )}

        {/* Quote */}
        <div className="flex-1 relative mt-6">
          <span className="font-display text-[4rem] leading-none text-gold-600/20 absolute -top-2 -left-1">&ldquo;</span>
          <p className="text-body text-white/70 leading-relaxed pt-8 italic">
            {quote}
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {open && videoUrl && (
        <div
          className="fixed inset-0 z-[500] bg-navy-900/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Video message from ${name}`}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors flex items-center gap-1.5 font-label text-[0.7rem] tracking-widest uppercase"
              aria-label="Close video"
            >
              Close
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-xl overflow-hidden bg-black shadow-hover">
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[80vh]"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="font-display text-h4 text-white">{name}</p>
              <p className="font-label text-[0.65rem] tracking-widest uppercase text-gold-600/80 mt-1">
                {title}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
