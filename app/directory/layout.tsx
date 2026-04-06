import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business Directory',
  description:
    'Browse the CVICC business directory. Find Indian-owned businesses across healthcare, technology, real estate, and more in the Central Valley.',
}

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
