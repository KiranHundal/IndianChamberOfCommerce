import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";

export default function Hero() {
  return (
    <section className="min-h-screen bg-navy-900 relative overflow-hidden flex items-center">
      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,150,12,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(58,106,175,0.12),transparent_60%)]" />

      {/* Corner marks */}
      <div className="absolute top-9 right-9 w-20 h-20 border-t border-r border-gold-600/25" />
      <div className="absolute bottom-9 left-9 w-20 h-20 border-b border-l border-gold-600/25" />

      {/* Content */}
      <div className="relative z-10 max-w-[75rem] mx-auto px-8 py-32">
        <SectionLabel dark>Central Valley Indian Chamber of Commerce</SectionLabel>

        <h1 className="font-display text-hero-sm md:text-hero-md lg:text-hero font-light text-white mt-6">
          Building Indian
          <br />
          <em className="italic text-gold-600">Business Leadership</em>
          <br />
          in the Valley
        </h1>

        <p className="font-body text-body text-white/55 max-w-lg mt-6 leading-relaxed">
          The Central Valley Indian Chamber of Commerce connects, supports, and
          elevates Indian-American businesses across the region through
          networking, mentorship, and advocacy.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/directory"
            className="bg-accent text-white rounded-sm px-6 py-3 font-label text-label tracking-label uppercase hover:bg-gold-900 transition-all"
          >
            Business Directory
          </Link>
          <Link
            href="/events"
            className="text-white/70 border border-white/20 rounded-sm px-6 py-3 font-label text-label tracking-label uppercase hover:text-white hover:border-white/40 transition-all"
          >
            Upcoming Events
          </Link>
        </div>
      </div>

      {/* Decorative gold line */}
      <div className="absolute right-16 top-1/2 -translate-y-1/2 w-px h-48 bg-gold-600/25 hidden lg:block" />
    </section>
  );
}
