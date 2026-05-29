import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="relative min-h-screen bg-navy-900 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="font-label text-label tracking-label uppercase text-accent mb-4">
          Error 404
        </p>

        <h1 className="font-display text-[8rem] md:text-[10rem] font-light leading-none text-white/10">
          404
        </h1>

        <h2 className="font-display text-3xl md:text-4xl font-light text-white -mt-4 mb-4">
          Page Not Found
        </h2>

        <p className="text-white/50 text-base leading-relaxed mb-10">
          The page you are looking for may have been moved, removed, or never
          existed. Let us help you find your way back.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-accent text-white rounded-sm px-7 py-3.5 font-label text-label tracking-label uppercase transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(184,150,12,0.6)] hover:-translate-y-0.5"
        >
          Back to Homepage
        </Link>
      </div>
    </section>
  )
}
