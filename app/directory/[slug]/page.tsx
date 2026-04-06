import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { mockMembers } from '@/lib/mock-data'
import Badge from '@/components/ui/Badge'
import {
  Globe,
  ExternalLink,
  Mail,
  Phone,
  ArrowLeft,
  MapPin,
  Calendar,
} from 'lucide-react'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function findMemberBySlug(slug: string) {
  return mockMembers.find((m) => m.slug.current === slug) || null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const member = findMemberBySlug(slug)
  if (!member) {
    return { title: 'Member Not Found' }
  }
  return {
    title: `${member.name} — ${member.businessName}`,
    description: member.bio,
  }
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const member = findMemberBySlug(slug)

  if (!member) {
    notFound()
  }

  const memberYear = new Date(member.memberSince).getFullYear()

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-small text-white/60 hover:text-white transition-all mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>

          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div>
              <h1 className="font-display text-hero-sm text-white">
                {member.name}
              </h1>
              <p className="text-body-lg text-white/60 mt-2">
                {member.businessName}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="dark">{member.sector.name}</Badge>
                {member.isMentor && <Badge variant="gold">Mentor</Badge>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-page-bg py-16">
        <div className="max-w-3xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left Column - Photo */}
            <div className="md:col-span-1">
              <div className="bg-navy-100 w-full aspect-square rounded-lg flex items-center justify-center">
                <span className="font-display text-hero-sm text-brand/40">
                  {getInitials(member.name)}
                </span>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="md:col-span-2">
              <h2 className="font-display text-h3 text-brand mb-4">About</h2>
              <p className="text-body text-mid leading-relaxed">
                {member.bio}
              </p>

              {/* Location & Member Since */}
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2 text-small text-mid">
                  <MapPin className="w-4 h-4 text-hint" />
                  {member.city}
                </div>
                <div className="flex items-center gap-2 text-small text-mid">
                  <Calendar className="w-4 h-4 text-hint" />
                  Member since {memberYear}
                </div>
              </div>

              {/* Contact Links */}
              <div className="mt-8">
                <h3 className="font-display text-h4 text-brand mb-4">
                  Contact
                </h3>
                <div className="space-y-3">
                  {member.website && (
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-small text-mid hover:text-accent transition-all"
                    >
                      <Globe className="w-4 h-4 text-hint" />
                      {member.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-small text-mid hover:text-accent transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-hint" />
                      LinkedIn Profile
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-3 text-small text-mid hover:text-accent transition-all"
                    >
                      <Mail className="w-4 h-4 text-hint" />
                      {member.email}
                    </a>
                  )}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-3 text-small text-mid hover:text-accent transition-all"
                    >
                      <Phone className="w-4 h-4 text-hint" />
                      {member.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Mentor Expertise */}
              {member.isMentor && member.mentorExpertise.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-h4 text-brand mb-4">
                    Mentor Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.mentorExpertise.map((area) => (
                      <Badge key={area} variant="gold">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
