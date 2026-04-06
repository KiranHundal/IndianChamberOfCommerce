import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";

export default function JoinCTA() {
  return (
    <section className="bg-navy-900 py-24 text-center relative overflow-hidden">
      {/* Corner marks */}
      <div className="absolute top-9 right-9 w-20 h-20 border-t border-r border-gold-600/25" />
      <div className="absolute bottom-9 left-9 w-20 h-20 border-b border-l border-gold-600/25" />

      <div className="relative z-10 max-w-2xl mx-auto px-8">
        <SectionLabel dark>Become a Member</SectionLabel>

        <h2 className="font-display text-h1 md:text-display font-light text-white mt-4">
          Join the Central Valley&rsquo;s Premier Indian Business Network
        </h2>

        <p className="font-body text-body text-white/55 mt-4">
          Connect with over 200 Indian-American business owners, access
          exclusive events, mentorship programs, and grow your business with the
          support of a thriving community.
        </p>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link
            href="/membership"
            className="bg-accent text-white rounded-sm px-6 py-3 font-label text-label tracking-label uppercase hover:bg-gold-900 transition-all"
          >
            Apply for Membership
          </Link>
          <Link
            href="/contact"
            className="text-white/70 border border-white/20 rounded-sm px-6 py-3 font-label text-label tracking-label uppercase hover:text-white hover:border-white/40 transition-all"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
