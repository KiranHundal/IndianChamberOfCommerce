import Link from "next/link";
import { MapPin } from "lucide-react";
import { mockEvents } from "@/lib/mock-data";
import SectionLabel from "@/components/ui/SectionLabel";
import SectionTitle from "@/components/ui/SectionTitle";
import Divider from "@/components/ui/Divider";

const upcomingEvents = mockEvents.slice(0, 3);

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UpcomingEvents() {
  return (
    <section className="bg-navy-900 py-24">
      <div className="max-w-[75rem] mx-auto px-8">
        <SectionLabel dark>Upcoming</SectionLabel>
        <SectionTitle dark>Upcoming Events</SectionTitle>
        <Divider className="mt-4" />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingEvents.map((event) => (
            <div
              key={event._id}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all duration-300"
            >
              <p className="text-gold-600 font-label text-micro tracking-widest uppercase">
                {formatDate(event.date)}
              </p>
              <h3 className="font-display text-h4 text-white mt-2">
                {event.title}
              </h3>
              <p className="text-small text-white/50 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </p>
              <span className="inline-block mt-3 bg-white/10 text-white/70 rounded-full px-3 py-1 text-micro font-label tracking-label uppercase">
                {event.type}
              </span>
              {event.rsvpUrl ? (
                <Link
                  href={event.rsvpUrl}
                  className="text-gold-600 text-small font-medium mt-3 inline-block hover:text-gold-400 ml-3"
                >
                  RSVP
                </Link>
              ) : (
                <span className="text-gold-600 text-small font-medium mt-3 inline-block ml-3">
                  RSVP
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/events"
            className="text-white/70 border border-white/20 rounded-sm px-6 py-3 font-label text-label tracking-label uppercase hover:text-white hover:border-white/40 transition-all"
          >
            View All Events &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
