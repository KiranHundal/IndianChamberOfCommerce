import Image from "next/image";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import { ArrowRight, MapPin } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-navy-900 overflow-hidden flex items-center">
      {/* Cinematic background image with slow zoom */}
      <div className="absolute inset-0 hero-slow-zoom">
        <Image
          src="/background1.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Dark cinematic overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(4,10,30,0.88) 0%, rgba(4,10,30,0.75) 45%, rgba(4,10,30,0.55) 100%)",
        }}
      />

      {/* Film grain for warmth */}
      <div className="absolute inset-0 hero-grain" aria-hidden="true" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(8,16,32,0.55))] pointer-events-none" />

      {/* Corner marks */}
      <div className="absolute top-9 right-9 w-20 h-20 border-t border-r border-gold-600/30 hidden md:block" />
      <div className="absolute bottom-9 left-9 w-20 h-20 border-b border-l border-gold-600/30 hidden md:block" />

      {/* Content */}
      <div className="relative z-10 max-w-[75rem] mx-auto px-8 py-32 w-full">
        <div className="hero-reveal">
          <div className="flex items-center gap-3">
            <SectionLabel dark>Central Valley Indian Chamber of Commerce</SectionLabel>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[0.6875rem] tracking-label uppercase text-white/40 font-label">
              <MapPin className="w-3 h-3" strokeWidth={1.5} />
              Fresno · Kings · Madera · Tulare
            </span>
          </div>

          <h1 className="font-display text-hero-sm md:text-hero-md lg:text-hero font-light text-white mt-8 leading-[0.95]">
            Building Indian
            <br />
            <em className="italic hero-accent-shimmer">Business Leadership</em>
            <br />
            in the Valley
          </h1>

          <p className="font-body text-body md:text-bodyLg text-white/65 max-w-xl mt-8 leading-relaxed">
            A regional network connecting, supporting, and elevating
            Indian-American businesses through mentorship, advocacy, and
            curated events across the Central Valley.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/join"
              className="group relative inline-flex items-center gap-2 bg-accent text-white rounded-sm px-7 py-3.5 font-label text-label tracking-label uppercase overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(184,150,12,0.6)] hover:-translate-y-0.5"
            >
              <span className="relative z-10">Join the Chamber</span>
              <ArrowRight className="relative z-10 w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
              <span className="absolute inset-0 bg-gradient-to-r from-accent via-gold-400 to-accent bg-[length:200%_100%] bg-[position:0%_0] transition-[background-position] duration-700 group-hover:bg-[position:100%_0]" />
            </Link>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-white/80 border border-white/25 rounded-sm px-7 py-3.5 font-label text-label tracking-label uppercase transition-all duration-300 hover:text-white hover:border-white/50 hover:bg-white/[0.04]"
            >
              Learn More
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        <span className="font-label text-[0.625rem] tracking-widest uppercase text-white/30">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent overflow-hidden">
          <div className="hero-scroll-cue w-px h-4 bg-gold-600" />
        </div>
      </div>
    </section>
  );
}
