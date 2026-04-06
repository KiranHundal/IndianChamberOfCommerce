'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SectionLabel from '@/components/ui/SectionLabel'
import Badge from '@/components/ui/Badge'

interface PublicMember {
  name: string
  slug: string
  businessName: string
  sectorName: string
  sectorSlug: string
  city: string
  bio: string
  isMentor: boolean
  mentorExpertise: string[]
  featured: boolean
  memberSince: string
  photoUrl?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function MemberDirectoryInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allMembers, setAllMembers] = useState<PublicMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [mentorOnly, setMentorOnly] = useState(false)

  // Read filters from URL on mount
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const sectors = searchParams.get('sectors')
    const city = searchParams.get('city') || ''
    const mentor = searchParams.get('mentor') === 'true'

    setSearchQuery(q)
    setSelectedSectors(sectors ? sectors.split(',') : [])
    setSelectedCity(city)
    setMentorOnly(mentor)
  }, [searchParams])

  // Fetch members
  useEffect(() => {
    fetch('/members.json')
      .then((r) => r.json())
      .then((data: PublicMember[]) => setAllMembers(data))
  }, [])

  // Sync filters to URL
  const syncURL = useCallback(
    (params: {
      q: string
      sectors: string[]
      city: string
      mentor: boolean
    }) => {
      const sp = new URLSearchParams()
      if (params.q) sp.set('q', params.q)
      if (params.sectors.length) sp.set('sectors', params.sectors.join(','))
      if (params.city) sp.set('city', params.city)
      if (params.mentor) sp.set('mentor', 'true')
      const qs = sp.toString()
      router.push(qs ? `/directory?${qs}` : '/directory', { scroll: false })
    },
    [router]
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    syncURL({ q: value, sectors: selectedSectors, city: selectedCity, mentor: mentorOnly })
  }

  const handleSectorToggle = (sector: string) => {
    const next = selectedSectors.includes(sector)
      ? selectedSectors.filter((s) => s !== sector)
      : [...selectedSectors, sector]
    setSelectedSectors(next)
    syncURL({ q: searchQuery, sectors: next, city: selectedCity, mentor: mentorOnly })
  }

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
    syncURL({ q: searchQuery, sectors: selectedSectors, city: value, mentor: mentorOnly })
  }

  const handleMentorToggle = (value: boolean) => {
    setMentorOnly(value)
    syncURL({ q: searchQuery, sectors: selectedSectors, city: selectedCity, mentor: value })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedSectors([])
    setSelectedCity('')
    setMentorOnly(false)
    router.push('/directory', { scroll: false })
  }

  // Derived data
  const sectors = useMemo(
    () => Array.from(new Set(allMembers.map((m) => m.sectorName))).sort(),
    [allMembers]
  )

  const cities = useMemo(
    () => Array.from(new Set(allMembers.map((m) => m.city))).sort(),
    [allMembers]
  )

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      if (
        searchQuery &&
        !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.businessName.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false
      if (selectedSectors.length && !selectedSectors.includes(m.sectorName))
        return false
      if (selectedCity && m.city !== selectedCity) return false
      if (mentorOnly && !m.isMentor) return false
      return true
    })
  }, [allMembers, searchQuery, selectedSectors, selectedCity, mentorOnly])

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center">
        <div className="max-w-[75rem] mx-auto px-8">
          <SectionLabel dark>Our Members</SectionLabel>
          <h1 className="font-display text-hero-sm md:text-hero-md font-light text-white mt-4">
            Business Directory
          </h1>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-page-bg py-8 sticky top-[72px] z-[100] border-b border-ivory-200">
        <div className="max-w-[75rem] mx-auto px-8">
          <input
            type="text"
            placeholder="Search by name or business..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30"
          />

          {/* Sector Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => handleSectorToggle(s)}
                className={`px-3 py-1.5 rounded-full text-micro font-label tracking-label uppercase border cursor-pointer transition-all ${
                  selectedSectors.includes(s)
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-mid border-ivory-200 hover:border-brand'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* City + Mentor Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="bg-white border border-ivory-200 rounded-md px-3 py-2 text-small font-body text-charcoal"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mentorOnly}
                onChange={(e) => handleMentorToggle(e.target.checked)}
                className="w-4 h-4 rounded border-ivory-200 text-brand focus:ring-brand/30"
              />
              <span className="text-small font-body text-charcoal">
                Mentors only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <section className="bg-page-bg py-12">
        <div className="max-w-[75rem] mx-auto px-8">
          <p className="text-small text-mid mb-6">
            Showing {filteredMembers.length} of {allMembers.length} members
          </p>

          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.slug}
                  className="bg-white border border-ivory-200 rounded-lg shadow-card hover:shadow-hover overflow-hidden transition-all"
                >
                  {/* Card Top */}
                  <div className="bg-brand p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-label text-small">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <h3 className="font-display text-h4 text-white">
                          {member.name}
                        </h3>
                        <p className="text-small text-white/60">
                          {member.businessName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <Badge variant="navy">{member.sectorName}</Badge>
                    <p className="text-small text-mid line-clamp-2 mt-2">
                      {member.bio}
                    </p>
                    <p className="text-caption text-hint mt-2">
                      {member.city}
                    </p>
                    {member.isMentor && (
                      <Badge variant="gold" className="mt-2">
                        Mentor
                      </Badge>
                    )}
                    <div className="mt-3">
                      <Link
                        href={`/directory/${member.slug}`}
                        className="text-accent text-small hover:underline"
                      >
                        View Profile &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-display text-h3 text-brand mb-4">
                No members found
              </p>
              <p className="text-body text-mid mb-6">
                Try adjusting your filters to find what you&apos;re looking for.
              </p>
              <button
                onClick={clearFilters}
                className="inline-block px-6 py-3 bg-brand text-white rounded-md font-label text-small tracking-label uppercase hover:bg-brand-dark transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default function MemberDirectoryPage() {
  return (
    <Suspense>
      <MemberDirectoryInner />
    </Suspense>
  )
}
