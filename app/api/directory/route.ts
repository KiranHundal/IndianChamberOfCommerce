import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

const SANITY_MEMBERS_QUERY = `*[_type == "member"] | order(order asc) {
  name,
  "slug": slug.current,
  businessName,
  "sectorName": sector->name,
  "sectorSlug": sector->slug.current,
  city,
  bio,
  isMentor,
  mentorExpertise,
  featured,
  memberSince,
  "photoUrl": photo.asset->url
}`

export async function GET() {
  try {
    // Only try Sanity if project ID is configured (not placeholder)
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    if (projectId && projectId !== 'placeholder') {
      const members = await client.fetch(SANITY_MEMBERS_QUERY)
      if (members && members.length > 0) {
        return NextResponse.json(members)
      }
    }
  } catch (error) {
    console.log('[Directory] Sanity fetch failed, falling back to static data:', error)
  }

  // Fallback: return null to signal client should use static members.json
  return NextResponse.json(null)
}
