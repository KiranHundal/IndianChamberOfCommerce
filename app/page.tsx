import Hero from '@/components/sections/Hero'
import StatsBar from '@/components/sections/StatsBar'
import SocialStrip from '@/components/layout/SocialStrip'
import SectorGrid from '@/components/sections/SectorGrid'
import FeaturedMembers from '@/components/sections/FeaturedMembers'
import UpcomingEvents from '@/components/sections/UpcomingEvents'
import SocialFeed from '@/components/sections/SocialFeed'
import JoinCTA from '@/components/sections/JoinCTA'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Central Valley Indian Chamber of Commerce',
  url: 'https://cvicc.org',
  description:
    "The Central Valley Indian Chamber of Commerce (CVICC) fosters business growth, networking, and community engagement for Indian American entrepreneurs and professionals in California's Central Valley.",
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Fresno',
    addressRegion: 'CA',
    addressCountry: 'US',
  },
  foundingDate: '2011',
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Hero />
      <StatsBar />
      <SocialStrip />
      <SectorGrid />
      <FeaturedMembers />
      <UpcomingEvents />
      <SocialFeed />
      <JoinCTA />
    </>
  )
}
