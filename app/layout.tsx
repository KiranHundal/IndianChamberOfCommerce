import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import Footer from '@/components/layout/Footer'
import SessionProvider from '@/components/providers/SessionProvider'

export const metadata: Metadata = {
  title: {
    template: '%s | CVICC',
    default: 'Central Valley Indian Chamber of Commerce | Fresno, CA',
  },
  description:
    'Connecting and empowering Indian businesses in Fresno and the Central Valley through networking, resources, and community.',
  metadataBase: new URL('https://www.indianchamberofcommerce.org'),
  openGraph: {
    title: 'Central Valley Indian Chamber of Commerce',
    description:
      'Connecting and empowering Indian-American businesses across the Central Valley through networking, mentorship, advocacy, and curated events.',
    url: 'https://www.indianchamberofcommerce.org',
    siteName: 'CVICC',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Central Valley Indian Chamber of Commerce — Connecting · Empowering · Growing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Central Valley Indian Chamber of Commerce',
    description:
      'Connecting and empowering Indian-American businesses across the Central Valley.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/hero-bg.webp" as="image" type="image/webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-page-bg text-charcoal">
        <SessionProvider>
          <AnnouncementBar />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
