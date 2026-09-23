import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { members, boardMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as Record<string, unknown> | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { boardMemberId, email: rawEmail, name: rawName, role } = await req.json()
  if (!role || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'role must be "admin" or "moderator"' }, { status: 400 })
  }

  let email = rawEmail?.toString().toLowerCase().trim() || ''
  let name = rawName?.toString().trim() || ''

  if (boardMemberId) {
    const [board] = await db.select().from(boardMembers).where(eq(boardMembers.id, boardMemberId)).limit(1)
    if (!board) return NextResponse.json({ error: 'Board member not found' }, { status: 404 })
    if (!board.email) {
      return NextResponse.json({ error: 'Board member has no email on file.' }, { status: 400 })
    }
    email = board.email.toLowerCase().trim()
    name = board.name
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: 'A name is required.' }, { status: 400 })
  }

  const [existing] = await db.select().from(members).where(eq(members.email, email)).limit(1)

  if (existing) {
    if (existing.role === role) {
      return NextResponse.json({ error: `${existing.name} already has ${role} access.` }, { status: 400 })
    }
    await db
      .update(members)
      .set({ role, status: 'approved', approvedAt: existing.approvedAt || new Date() })
      .where(eq(members.id, existing.id))
    return NextResponse.json({
      success: true,
      memberId: existing.id,
      email,
      name: existing.name,
      role,
      updatedExisting: true,
    })
  }

  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(members).values({
    id,
    email,
    passwordHash: '',
    name,
    phone: null,
    businessName: null,
    city: null,
    sector: null,
    membershipTier: 'individual',
    status: 'approved',
    role,
    membershipNumber: null,
    createdAt: now,
    approvedAt: now,
    paymentMethod: null,
    amountPaid: null,
    paymentReference: null,
    paymentDate: null,
  })

  return NextResponse.json({
    success: true,
    memberId: id,
    email,
    name,
    role,
    updatedExisting: false,
  })
}
