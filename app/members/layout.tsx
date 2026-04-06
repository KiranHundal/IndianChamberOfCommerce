import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Member Directory',
  description:
    'Browse the CVICC member directory. Find Indian-owned businesses across healthcare, technology, real estate, and more in the Central Valley.',
}

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
