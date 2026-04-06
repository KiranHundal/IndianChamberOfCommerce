import type { Metadata } from 'next'
import Link from 'next/link'
import { mockMembers } from '@/lib/mock-data'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Badge from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Mentorship Program',
  description:
    'Connect with experienced CVICC mentors who can guide you in healthcare, law, hospitality, and more. Our mentorship program pairs established business leaders with aspiring entrepreneurs.',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default function MentorshipPage() {
  const mentors = mockMembers.filter((m) => m.isMentor)

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center">
        <div className="max-w-[75rem] mx-auto px-8">
          <SectionLabel dark>Connect &amp; Grow</SectionLabel>
          <SectionTitle dark className="mt-4">
            Mentorship Program
          </SectionTitle>
          <p className="text-body-lg text-white/60 max-w-2xl mx-auto mt-6">
            Our mentorship program connects aspiring entrepreneurs and growing
            business owners with experienced CVICC members who volunteer their
            time, knowledge, and networks to help others succeed.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-page-bg py-16">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="font-display text-h2 text-brand mb-4">
            How It Works
          </h2>
          <p className="text-body text-mid leading-relaxed">
            CVICC mentors are established business leaders across healthcare,
            law, hospitality, technology, and more. Whether you are launching a
            new venture, scaling an existing business, or navigating a career
            transition, a mentor can provide guidance tailored to your goals.
            Browse our available mentors below and reach out to get started.
          </p>
        </div>
      </section>

      {/* Mentor Grid */}
      <section className="bg-page-bg pb-20">
        <div className="max-w-[75rem] mx-auto px-8">
          <p className="text-small text-mid mb-8">
            {mentors.length} mentors available
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div
                key={mentor._id}
                className="bg-white border border-ivory-200 rounded-lg shadow-card overflow-hidden"
              >
                {/* Card Top */}
                <div className="bg-brand p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-label text-small">
                      {getInitials(mentor.name)}
                    </div>
                    <div>
                      <h3 className="font-display text-h4 text-white">
                        {mentor.name}
                      </h3>
                      <p className="text-small text-white/60">
                        {mentor.businessName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <p className="font-label text-micro tracking-label uppercase text-hint mb-2">
                    Areas of Expertise
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.mentorExpertise.map((area) => (
                      <Badge key={area} variant="gold">
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-small text-mid line-clamp-3">
                    {mentor.bio}
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/members/${mentor.slug.current}`}
                      className="text-accent text-small hover:underline"
                    >
                      Connect &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
