import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join the Chamber',
  description:
    'Become a member of the Central Valley Indian Chamber of Commerce and unlock networking events, mentorship, business directory listing, and more.',
}

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
