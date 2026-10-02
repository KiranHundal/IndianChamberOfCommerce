'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  // refetchOnWindowFocus defaults to true in NextAuth; every tab switch
  // fires a session refetch and cascades a re-render through every
  // component using useSession(). On admin pages mid-form that looks
  // like a "page refresh" and loses in-progress typing. Disabling it
  // doesn't weaken security — JWT sessions still expire on schedule.
  return (
    <NextAuthSessionProvider refetchOnWindowFocus={false}>
      {children}
    </NextAuthSessionProvider>
  )
}
