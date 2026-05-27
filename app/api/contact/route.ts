import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const subjectLabels: Record<string, string> = {
  membership: 'Membership Inquiry',
  events: 'Events & Programs',
  partnership: 'Partnership Opportunity',
  mentorship: 'Mentorship Program',
  media: 'Media & Press',
  other: 'Other',
}

export async function POST(req: Request) {
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

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 })
    }

    const resend = new Resend(apiKey)
    const fromEmail = process.env.FROM_EMAIL || 'info@indianchamberofcommerce.org'
    const adminEmail = process.env.ADMIN_EMAIL || 'info@indianchamberofcommerce.org'
    const subjectLabel = subjectLabels[subject] || subject
    const fullName = `${firstName} ${lastName}`

    await resend.emails.send({
      from: `CVICC Website <${fromEmail}>`,
      to: adminEmail,
      replyTo: email,
      subject: `Contact Form: ${subjectLabel} — ${fullName}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
          <div style="background: #1E3A5F; padding: 32px; text-align: center;">
            <h1 style="color: #D4A830; font-size: 20px; margin: 0; font-weight: 300; letter-spacing: 2px;">
              NEW CONTACT FORM SUBMISSION
            </h1>
          </div>
          <div style="padding: 32px; background: #FAFAF7;">
            <div style="background: white; border: 1px solid #E8E4DD; border-radius: 8px; padding: 24px; margin: 0 0 24px;">
              <p style="color: #5A6A7A; line-height: 2; margin: 0; font-size: 14px;">
                <strong>Name:</strong> ${fullName}<br/>
                <strong>Email:</strong> ${email}<br/>
                ${phone ? `<strong>Phone:</strong> ${phone}<br/>` : ''}
                <strong>Subject:</strong> ${subjectLabel}
              </p>
            </div>
            <div style="background: white; border: 1px solid #E8E4DD; border-radius: 8px; padding: 24px;">
              <p style="color: #1E3A5F; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px;">
                Message
              </p>
              <p style="color: #5A6A7A; line-height: 1.7; margin: 0; font-size: 14px; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #5A6A7A; font-size: 12px; margin: 24px 0 0; text-align: center;">
              Reply directly to this email to respond to ${fullName}.
            </p>
          </div>
          <div style="background: #1E3A5F; padding: 20px 32px; text-align: center;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
              CVICC Website Contact Form
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
