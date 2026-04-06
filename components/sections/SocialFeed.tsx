import Link from "next/link";
import { Camera } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import SectionTitle from "@/components/ui/SectionTitle";
import Divider from "@/components/ui/Divider";

export default function SocialFeed() {
  return (
    <section className="bg-page-bg py-24">
      <div className="max-w-[75rem] mx-auto px-8">
        <SectionLabel>Social</SectionLabel>
        <SectionTitle>Connect With Us</SectionTitle>
        <Divider className="mt-4" />

        <div className="mt-12 bg-white border border-ivory-200 rounded-lg p-12 text-center">
          <Camera className="w-12 h-12 text-brand mx-auto" />
          <p className="font-display text-h3 text-brand mt-4">
            Follow @cvicc_fresno
          </p>
          <p className="text-body text-mid mt-2">
            Stay up to date with the latest events, member spotlights, and
            community news from the Central Valley Indian Chamber of Commerce.
          </p>
          <Link
            href="https://instagram.com/cvicc_fresno"
            className="inline-block mt-4 bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm hover:bg-gold-900 transition-all"
          >
            Follow on Instagram
          </Link>
        </div>
      </div>
    </section>
  );
}
