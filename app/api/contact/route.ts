import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({ interval: 60_000, limit: 5 })

const subjectLabels: Record<string, string> = {
  membership: 'Membership Inquiry',
  events: 'Events & Programs',
  partnership: 'Partnership Opportunity',
  mentorship: 'Mentorship Program',
  media: 'Media & Press',
  other: 'Other',
}

export async function POST(req: NextRequest) {
  const { success } = limiter(req)
  if (!success) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { firstName, lastName, email, phone, subject, message } = body

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const subjectLabel = subjectLabels[subject] || subject
    const fullName = `${firstName} ${lastName}`

    await sendContactFormEmail({ fullName, email, phone, subjectLabel, message })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
