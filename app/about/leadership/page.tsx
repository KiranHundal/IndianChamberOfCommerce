import type { Metadata } from "next";
import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import Divider from "@/components/ui/Divider";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Badge from "@/components/ui/Badge";
import LeaderVideo from "@/components/leadership/LeaderVideo";
import { db } from "@/lib/db";
import { leaderVideos, boardMembers as boardMembersTable } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { ensureBoardHeadshots } from "@/lib/ensure-board-headshots";

export const revalidate = 60;

interface DisplayBoardMember {
  key: string;
  name: string;
  role: string;
  photoUrl: string;
  isPlaceholder: boolean;
  displayOrder: number;
}

interface DisplayLeader {
  key: string;
  name: string;
  role: string;
  sector: string | null;
  bio: string | null;
  photoUrl: string;
}

// Split a bio text block into paragraphs. Admins type bios in the
// board-members form as plain text with blank lines between paragraphs.
function bioParagraphs(bio: string | null): string[] {
  if (!bio) return [];
  return bio.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export const metadata: Metadata = {
  title: "Board of Directors — CVICC",
  description:
    "Meet the Board of Directors of the Central Valley Indian Chamber of Commerce — the leaders guiding our mission.",
};

// Headshot URLs live in lib/leader-headshots.ts so /admin/board-members and
// /admin/team can render the same photos when a board_members row has no
// photoUrl of its own. See headshotFor() there for the normalization rules.
import { headshotFor } from "@/lib/leader-headshots";

const HEADSHOT_POSITION: Record<string, string> = {
  "Sonia Heer": "center 10%",
  "Dr. Surdeep Singh": "center 10%",
  "Rajinder Kumar": "center 10%",
  "Roken Bhatt": "center 20%",
  "Akash Singal": "center 10%",
  "Kiran Hundal": "center 10%",
};

// Board transforms applied via CSS media query (lg+) in globals.css

// Every section (execs / officers / board) now reads from board_members,
// classified by the `category` column. Admin promotes/demotes anyone from
// /admin/board-members with no code change.

// Normalize a leader's name to loose "first last" so videos keyed under
// "Dr. Surdeep Singh" still match a board_members row named "Surdeep
// Singh" (and vice versa). Same spirit as the headshots lib.
function videoKey(name: string): string {
  const tokens = name
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter((t) => !["dr", "mr", "mrs", "ms", "prof", "jr", "sr"].includes(t))
  if (tokens.length <= 2) return tokens.join(" ")
  return `${tokens[0]} ${tokens[tokens.length - 1]}`
}

async function getVideoMap(): Promise<Map<string, string>> {
  try {
    const rows = await db.select().from(leaderVideos)
    const map = new Map<string, string>()
    for (const r of rows) {
      // Keep both the raw name key (back-compat) and the normalized one.
      map.set(r.leaderName, r.url)
      map.set(videoKey(r.leaderName), r.url)
    }
    return map
  } catch {
    return new Map()
  }
}

// Resolve a video URL for a leader by exact name OR normalized match.
function videoFor(videoMap: Map<string, string>, name: string): string | undefined {
  return videoMap.get(name) || videoMap.get(videoKey(name))
}

async function getAllRows() {
  try {
    // One-time backfill: adds `category` + `sector` columns, backfills
    // headshots, roles, sectors and bios for the four known exec/officer
    // names. Idempotent after the first pass.
    await ensureBoardHeadshots()
    return await db.select().from(boardMembersTable).orderBy(asc(boardMembersTable.displayOrder))
  } catch {
    return []
  }
}

function toDisplayLeader(r: typeof boardMembersTable.$inferSelect): DisplayLeader {
  return {
    key: `db-${r.id}`,
    name: r.name,
    role: r.role,
    sector: r.sector,
    bio: r.bio,
    photoUrl: r.photoUrl || headshotFor(r.name) || "/headshots/placeholder.jpg",
  };
}

function toDisplayBoard(r: typeof boardMembersTable.$inferSelect): DisplayBoardMember {
  return {
    key: `db-${r.id}`,
    name: r.name,
    role: r.role,
    photoUrl: r.photoUrl || headshotFor(r.name) || "/headshots/placeholder.jpg",
    isPlaceholder: !r.photoUrl && !headshotFor(r.name),
    displayOrder: r.displayOrder,
  };
}

export default async function LeadershipPage() {
  const videoMap = await getVideoMap();
  const rows = await getAllRows();

  const executives: DisplayLeader[] = rows
    .filter((r) => r.category === "executive")
    .map(toDisplayLeader);
  const officers: DisplayLeader[] = rows
    .filter((r) => r.category === "officer")
    .map(toDisplayLeader);
  const allBoardMembers: DisplayBoardMember[] = rows
    .filter((r) => (r.category || "board") === "board")
    .map(toDisplayBoard)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return (
    <>
      {/* Slim title band — magazine-section-header pattern. Height is
          intentionally bounded so the first exec card peeks above the
          fold on any laptop/Dell. Decorative chrome removed. */}
      <section className="bg-navy-900 py-10 md:py-12 lg:py-14 text-center">
        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>Board of Directors</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <h1 className="font-display text-4xl md:text-5xl font-light text-white mt-3 leading-tight">
              Our Leadership
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      {/* Executive Leadership — hidden when no exec rows exist */}
      {executives.length > 0 && (
      <section className="bg-page-bg pt-12 md:pt-16 pb-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-10 md:mb-14">
            <AnimatedSection>
              <h2 className="font-label text-label tracking-widest uppercase text-brand">Executive Leadership</h2>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <p className="text-mid text-body max-w-2xl mx-auto mt-4 leading-relaxed">
                A board of dedicated professionals who volunteer their time, expertise, and passion to serve the Indian-American business community of the Central Valley.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={2}>
              <Divider className="mx-auto mt-6" />
            </AnimatedSection>
          </div>

          <div className="space-y-10">
            {executives.map((leader, i) => {
              const paras = bioParagraphs(leader.bio);
              return (
              <AnimatedSection key={leader.key} delay={i + 2}>
                <div className="leadership-card bg-white border border-ivory-200 rounded-xl overflow-hidden flex flex-col md:flex-row relative">
                  <div className="card-image relative w-full md:w-56 lg:w-64 xl:w-72 h-80 md:h-auto md:min-h-[20rem] flex-shrink-0 overflow-hidden">
                    <Image
                      src={leader.photoUrl}
                      alt={leader.name}
                      fill
                      className="object-cover"
                      style={{
                        objectPosition:
                          HEADSHOT_POSITION[leader.name] || "center top",
                      }}
                    />
                    <div className="md:hidden card-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
                    <div className="md:hidden card-name absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6">
                      <h3 className="font-display text-h3 text-white drop-shadow-lg">
                        {leader.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 md:p-10 flex flex-col flex-1">
                    <h3 className="hidden md:block font-display text-h3 text-brand">
                      {leader.name}
                    </h3>
                    <p className="font-label text-[0.65rem] tracking-widest uppercase text-brand/70 md:mt-2">
                      {leader.role}
                    </p>
                    {leader.sector && (
                      <Badge variant="navy" className="mt-3 self-start">
                        {leader.sector}
                      </Badge>
                    )}
                    {paras.length > 0 && (
                      <div className="space-y-3 mt-5">
                        {paras.map((p, idx) => (
                          <p key={idx} className="text-small text-mid leading-relaxed">{p}</p>
                        ))}
                      </div>
                    )}
                    {videoFor(videoMap, leader.name) && (
                      <LeaderVideo url={videoFor(videoMap, leader.name)!} name={leader.name} className="mt-6" />
                    )}
                  </div>

                  <div className="gold-accent-line" />
                </div>
              </AnimatedSection>
            );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Officers — hidden when no officer rows exist */}
      {officers.length > 0 && (
      <section className="bg-page-alt py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <AnimatedSection>
              <h2 className="font-label text-label tracking-widest uppercase text-brand">Officers</h2>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <Divider className="mx-auto mt-4" />
            </AnimatedSection>
          </div>

          <div className="flex justify-center">
            {officers.map((leader, i) => {
              const paras = bioParagraphs(leader.bio);
              return (
              <AnimatedSection key={leader.key} delay={i + 2}>
                <div className="officer-card bg-white border border-ivory-200 rounded-xl overflow-hidden flex flex-row min-h-[12rem] w-[28rem] max-w-full relative">
                  <div className="card-image relative w-48 flex-shrink-0 overflow-hidden">
                    <Image
                      src={leader.photoUrl}
                      alt={leader.name}
                      fill
                      className="object-cover transition-transform duration-700"
                      style={{
                        objectPosition:
                          HEADSHOT_POSITION[leader.name] || "center top",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                  </div>

                  <div className="p-6 flex flex-col justify-center">
                    <h3 className="font-display text-h3 text-brand">
                      {leader.name}
                    </h3>
                    <p className="font-label text-[0.625rem] tracking-widest uppercase text-brand/70 mt-2">
                      {leader.role}
                    </p>
                    {paras.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {paras.map((p, idx) => (
                          <p key={idx} className="text-small text-mid leading-relaxed">{p}</p>
                        ))}
                      </div>
                    )}
                    {videoFor(videoMap, leader.name) && (
                      <LeaderVideo url={videoFor(videoMap, leader.name)!} name={leader.name} className="mt-4" />
                    )}
                  </div>

                  <div className="gold-accent-line" />
                </div>
              </AnimatedSection>
            );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Board Members */}
      <section className="bg-page-bg py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <AnimatedSection>
              <h2 className="font-label text-label tracking-widest uppercase text-brand">Board Members</h2>
            </AnimatedSection>
            <AnimatedSection delay={1}>
              <Divider className="mx-auto mt-4" />
            </AnimatedSection>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {allBoardMembers.map((member, i) => (
              <AnimatedSection key={member.key} delay={i + 2}>
                <div className="board-card bg-white border border-ivory-200 rounded-xl overflow-hidden flex flex-col h-full relative">
                  <div className={`card-image relative overflow-hidden flex-shrink-0 ${member.isPlaceholder ? "h-44 sm:h-48 lg:h-52 bg-navy-800" : "h-48 sm:h-52 lg:h-52"}`}>
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      fill
                      unoptimized={member.photoUrl.startsWith("http")}
                      className={`transition-transform duration-700 board-member-img ${member.isPlaceholder ? "object-contain p-4" : "object-cover"}`}
                      data-member={member.name}
                      style={{
                        objectPosition: member.isPlaceholder
                          ? "center center"
                          : HEADSHOT_POSITION[member.name] || "center top",
                      }}
                    />
                    <div className="card-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
                    <div className="card-name absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                      <h3 className="font-display text-[1rem] sm:text-h4 text-white drop-shadow-lg leading-tight">
                        {member.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <p className="font-label text-[0.5rem] sm:text-[0.625rem] tracking-widest uppercase text-brand/70">
                      {member.role}
                    </p>
                  </div>

                  <div className="gold-accent-line" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Board CTA */}
      <section className="bg-navy-900 py-20 relative overflow-hidden">
        <div className="absolute top-6 right-6 w-16 h-16 border-t border-r border-gold-600/25 corner-bracket corner-bracket-tr" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l border-gold-600/25 corner-bracket corner-bracket-bl" />

        <div className="max-w-3xl mx-auto px-8 text-center">
          <AnimatedSection>
            <SectionLabel dark>Get Involved</SectionLabel>
            <h2 className="font-display text-h2 text-white mt-4">
              Interested in serving on the board?
            </h2>
            <p className="text-body text-white/55 mt-4 max-w-xl mx-auto">
              CVICC welcomes nominations from dedicated professionals who want
              to give back to the Indian-American business community. Board
              elections are held annually at the General Membership Meeting.
            </p>
            <a
              href="/contact"
              className="cta-button-glow inline-block mt-8 bg-accent text-white rounded-sm px-8 py-3.5 font-label text-label tracking-label uppercase"
            >
              Contact Us
            </a>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
