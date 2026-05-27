import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const [member] = await db
          .select()
          .from(members)
          .where(eq(members.email, credentials.email.toLowerCase()))
          .limit(1)

        if (!member) return null

        const valid = await bcrypt.compare(credentials.password, member.passwordHash)
        if (!valid) return null

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role,
          status: member.status,
          membershipTier: member.membershipTier,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>
        token.role = u.role as string
        token.status = u.status as string
        token.membershipTier = u.membershipTier as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as unknown as Record<string, unknown>
        s.id = token.sub
        s.role = token.role
        s.status = token.status
        s.membershipTier = token.membershipTier
      }
      return session
    },
  },
}
