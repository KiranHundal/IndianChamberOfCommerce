import { NextResponse } from 'next/server'

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
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    if (projectId && projectId !== 'placeholder') {
      const { client } = await import('@/lib/sanity')
      const members = await client.fetch(SANITY_MEMBERS_QUERY)
      if (members && members.length > 0) {
        return NextResponse.json(members)
      }
    }
  } catch (error) {
    console.log('[Directory] Sanity fetch failed, falling back to static data:', error)
  }

  return NextResponse.json(null)
}
