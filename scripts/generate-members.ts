import * as fs from 'fs'
import * as path from 'path'
import { mockMembers } from '../lib/mock-data'

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
  photoUrl: string | null
}

const members: PublicMember[] = mockMembers.map((m) => ({
  name: m.name,
  slug: m.slug.current,
  businessName: m.businessName,
  sectorName: m.sector.name,
  sectorSlug: m.sector.slug.current,
  city: m.city,
  bio: m.bio,
  isMentor: m.isMentor,
  mentorExpertise: m.mentorExpertise ?? [],
  featured: m.featured,
  memberSince: m.memberSince,
  photoUrl: null,
}))

const outPath = path.resolve(process.cwd(), 'public', 'members.json')
fs.writeFileSync(outPath, JSON.stringify(members, null, 2), 'utf-8')
console.log(`[generate-members] wrote ${outPath} (${members.length} members)`)
