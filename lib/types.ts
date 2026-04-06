export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export interface Sector {
  _id: string
  _type: 'sector'
  name: string
  slug: { current: string }
  icon: string
  description: string
  order: number
}

export interface Member {
  _id: string
  _type: 'member'
  name: string
  slug: { current: string }
  businessName: string
  sector: Sector
  city: string
  bio: string
  photo: SanityImage
  website?: string
  linkedin?: string
  phone?: string
  email?: string
  isMentor: boolean
  mentorExpertise: string[]
  featured: boolean
  memberSince: string
  order: number
}

export interface Event {
  _id: string
  _type: 'event'
  title: string
  slug: { current: string }
  date: string
  endDate?: string
  location: string
  address?: string
  isOnline: boolean
  type: string
  sector?: Sector
  description: Record<string, unknown>[]
  image: SanityImage
  rsvpUrl?: string
  isMembersOnly: boolean
  sponsor?: Partner
  featured: boolean
}

export interface Leadership {
  _id: string
  _type: 'leadership'
  name: string
  role: string
  sector?: Sector
  bio: Record<string, unknown>[]
  photo: SanityImage
  videoUrl?: string
  order: number
}

export interface Partner {
  _id: string
  _type: 'partner'
  name: string
  logo: SanityImage
  website?: string
  tier: 'Gold' | 'Silver' | 'Community'
  description?: string
  order: number
}

export interface SiteSettings {
  _id: string
  _type: 'siteSettings'
  memberCount: number
  sectorCount: number
  eventsPerYear: number
  yearsEstablished: number
  heroHeadline: string
  heroSubtext: string
  address: string
  phone: string
  email: string
  instagramHandle: string
  linkedinUrl?: string
  facebookUrl?: string
  whatsappNumber?: string
  tallyMembershipFormId?: string
  tallyContactFormId?: string
}

export interface PublicMember {
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
