import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

/**
 * Generates a readable temporary password, hashes it, stores the hash on
 * the member row, and returns the plaintext ONCE to the admin so they
 * can share it with the member. The member should then change it from
 * the portal immediately after signing in.
 *
 * The password is NOT stored anywhere in plaintext — only returned in
 * this response. If the admin loses it, they just click again to mint
 * a new one.
 */

// Readable alphabet: no 0/O, 1/l/I, no symbols that confuse non-tech users.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function makeTempPassword(len = 12): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown> | undefined)?.role
  if (!session?.user || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await req.json().catch(() => ({}))
  if (!memberId) {
    return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }
  if (member.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved members can get a temp password.' }, { status: 400 })
  }

  const tempPassword = makeTempPassword(12)
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  await db
    .update(members)
    .set({ passwordHash })
    .where(eq(members.id, memberId))

  return NextResponse.json({
    success: true,
    name: member.name,
    email: member.email,
    tempPassword,
  })
}
