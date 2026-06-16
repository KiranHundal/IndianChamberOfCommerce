import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (key !== 'cvicc-fix-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = 'kiran.farmers@gmail.com'

  const [member] = await db
    .select({ id: members.id, email: members.email, role: members.role, status: members.status })
    .from(members)
    .where(eq(members.email, email))
    .limit(1)

  if (!member) {
    return NextResponse.json({ error: 'Member not found', email })
  }

  if (member.role !== 'admin') {
    await db.update(members).set({ role: 'admin' }).where(eq(members.email, email))
    return NextResponse.json({ message: 'Role updated to admin', before: member.role, after: 'admin' })
  }

  return NextResponse.json({ message: 'Already admin', member })
}
