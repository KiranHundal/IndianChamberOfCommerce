import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import AnimatedSection from "@/components/ui/AnimatedSection";

export default function JoinCTA() {
  return (
    <section className="bg-navy-900 py-28 text-center relative overflow-hidden">
      <div className="absolute top-9 right-9 w-20 h-20 border-t border-r border-gold-600/25 corner-bracket corner-bracket-tr" />
      <div className="absolute bottom-9 left-9 w-20 h-20 border-b border-l border-gold-600/25 corner-bracket corner-bracket-bl" />

      <div className="relative z-10 max-w-2xl mx-auto px-8">
        <AnimatedSection>
          <SectionLabel dark>Become a Member</SectionLabel>
        </AnimatedSection>

        <AnimatedSection delay={1}>
          <h2 className="font-display text-h1 md:text-display font-light text-white mt-4">
            Together, We Connect.
            <br />
            <em className="italic text-gold-600">Empower. Grow.</em>
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={2}>
          <p className="font-body text-body text-white/55 mt-4">
            Join the Central Valley&rsquo;s premier Indian business network.
            Individual memberships starting at{' '}
            <span className="text-gold-400 font-medium">$95/year</span>.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={3}>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link
              href="/join"
              className="cta-button-glow bg-accent text-white rounded-sm px-8 py-3.5 font-label text-label tracking-label uppercase"
            >
              Join Today
            </Link>
            <Link
              href="/contact"
              className="text-white/70 border border-white/20 rounded-sm px-8 py-3.5 font-label text-label tracking-label uppercase hover:text-white hover:border-white/40 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
