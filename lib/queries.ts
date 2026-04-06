import { client } from './sanity'
import type {
  Member,
  Event,
  Leadership,
  Sector,
  Partner,
  SiteSettings,
} from './types'

// ─── Members ────────────────────────────────────────────────────────────────

const memberFields = `
  _id,
  _type,
  name,
  slug,
  businessName,
  sector->{_id, _type, name, slug, icon, description, order},
  city,
  bio,
  photo,
  website,
  linkedin,
  phone,
  email,
  isMentor,
  mentorExpertise,
  featured,
  memberSince,
  order
`

export async function getAllMembers(): Promise<Member[]> {
  return client.fetch(
    `*[_type == "member"] | order(order asc) { ${memberFields} }`
  )
}

export async function getFeaturedMembers(): Promise<Member[]> {
  return client.fetch(
    `*[_type == "member" && featured == true] | order(order asc) { ${memberFields} }`
  )
}

export async function getMemberBySlug(slug: string): Promise<Member | null> {
  return client.fetch(
    `*[_type == "member" && slug.current == $slug][0] { ${memberFields} }`,
    { slug }
  )
}

// ─── Events ─────────────────────────────────────────────────────────────────

const eventFields = `
  _id,
  _type,
  title,
  slug,
  date,
  endDate,
  location,
  address,
  isOnline,
  type,
  sector->{_id, _type, name, slug, icon, description, order},
  description,
  image,
  rsvpUrl,
  isMembersOnly,
  sponsor->{_id, _type, name, logo, website, tier, description, order},
  featured
`

export async function getAllEvents(): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event"] | order(date desc) { ${eventFields} }`
  )
}

export async function getUpcomingEvents(): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && date >= now()] | order(date asc)[0...6] { ${eventFields} }`
  )
}

export async function getPastEvents(): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && date < now()] | order(date desc) { ${eventFields} }`
  )
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return client.fetch(
    `*[_type == "event" && slug.current == $slug][0] { ${eventFields} }`,
    { slug }
  )
}

// ─── Leadership ─────────────────────────────────────────────────────────────

export async function getAllLeadership(): Promise<Leadership[]> {
  return client.fetch(
    `*[_type == "leadership"] | order(order asc) {
      _id,
      _type,
      name,
      role,
      sector->{_id, _type, name, slug, icon, description, order},
      bio,
      photo,
      videoUrl,
      order
    }`
  )
}

// ─── Sectors ────────────────────────────────────────────────────────────────

export async function getAllSectors(): Promise<Sector[]> {
  return client.fetch(
    `*[_type == "sector"] | order(order asc) {
      _id,
      _type,
      name,
      slug,
      icon,
      description,
      order
    }`
  )
}

// ─── Partners ───────────────────────────────────────────────────────────────

export async function getAllPartners(): Promise<Partner[]> {
  return client.fetch(
    `*[_type == "partner"] | order(order asc, tier asc) {
      _id,
      _type,
      name,
      logo,
      website,
      tier,
      description,
      order
    }`
  )
}

// ─── Site Settings ──────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  return client.fetch(`*[_type == "siteSettings"][0]`)
}
