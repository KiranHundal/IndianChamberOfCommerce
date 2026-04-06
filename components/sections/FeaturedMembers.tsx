import Link from "next/link";
import { mockMembers } from "@/lib/mock-data";
import SectionLabel from "@/components/ui/SectionLabel";
import SectionTitle from "@/components/ui/SectionTitle";
import Divider from "@/components/ui/Divider";
import Badge from "@/components/ui/Badge";

const featuredMembers = mockMembers.filter((m) => m.featured);

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export default function FeaturedMembers() {
  return (
    <section className="bg-page-alt py-24">
      <div className="max-w-[75rem] mx-auto px-8">
        <SectionLabel>Our Community</SectionLabel>
        <SectionTitle>Featured Members</SectionTitle>
        <Divider className="mt-4" />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredMembers.map((member) => (
            <div
              key={member._id}
              className="bg-white border border-ivory-200 rounded-lg shadow-card hover:shadow-hover overflow-hidden transition-all duration-300"
            >
              <div className="bg-brand p-5">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-display text-h4 italic text-gold-600">
                  {getInitials(member.name)}
                </div>
                <p className="font-display text-h4 text-white mt-2">
                  {member.name}
                </p>
                <p className="text-small text-white/60">
                  {member.businessName}
                </p>
              </div>

              <div className="p-5">
                <Badge variant="navy">{member.sector.name}</Badge>
                <p className="text-small text-mid mt-3 line-clamp-2">
                  {member.bio}
                </p>
                <p className="text-caption text-hint mt-2">{member.city}</p>
                <Link
                  href={`/members/${member.slug.current}`}
                  className="text-accent text-small font-medium mt-3 inline-block hover:text-gold-900"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
