import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    template: '%s | CVICC',
    default: 'Central Valley Indian Chamber of Commerce | Fresno, CA',
  },
  description:
    'Connecting and empowering Indian businesses in Fresno and the Central Valley through networking, resources, and community.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-page-bg text-charcoal">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
