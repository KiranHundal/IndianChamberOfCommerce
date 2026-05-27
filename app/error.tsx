'use client'

import Link from 'next/link'

export default function Error({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <section className="relative min-h-screen bg-navy-900 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="font-label text-label tracking-label uppercase text-accent mb-4">
          Unexpected Error
        </p>

        <h1 className="font-display text-3xl md:text-4xl font-light text-white mb-4">
          Something Went Wrong
        </h1>

        <p className="text-white/50 text-base leading-relaxed mb-10">
          We encountered an unexpected issue. Please try again, or return to the
          homepage if the problem persists.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-accent text-white rounded-sm px-7 py-3.5 font-label text-label tracking-label uppercase transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(184,150,12,0.6)] hover:-translate-y-0.5"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 border border-white/25 rounded-sm px-7 py-3.5 font-label text-label tracking-label uppercase transition-all duration-300 hover:text-white hover:border-white/50 hover:bg-white/[0.04]"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </section>
  )
}
