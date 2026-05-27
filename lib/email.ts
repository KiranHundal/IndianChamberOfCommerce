import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

function getConfig() {
  return {
    fromEmail: process.env.FROM_EMAIL || 'info@indianchamberofcommerce.org',
    adminEmail: process.env.ADMIN_EMAIL || 'info@indianchamberofcommerce.org',
    siteUrl: process.env.NEXTAUTH_URL || 'https://www.indianchamberofcommerce.org',
  }
}

export async function sendMemberPendingEmail(member: {
  name: string
  email: string
  membershipTier: string
}) {
  const tierLabel = member.membershipTier === 'corporate' ? 'Corporate' : 'Individual'

  const resend = getResend()
  if (!resend) return

  const { fromEmail } = getConfig()
  await resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: member.email,
    subject: 'CVICC Membership — Application Received',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px;">
            Welcome, ${member.name}!
          </h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            Thank you for your payment and for applying to join CVICC. Your <strong>${tierLabel} Membership</strong> application has been received.
          </p>
          <div style="background: #FEF9E7; border: 1px solid #F0DCA0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #92700C; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Status: Pending Approval
            </p>
            <p style="color: #5A6A7A; margin: 8px 0 0; font-size: 14px;">
              An administrator will review your application shortly. You'll receive another email with a link to create your member account once approved.
            </p>
          </div>
        </div>
        <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
            Central Valley Indian Chamber of Commerce, Inc.<br/>
            1840 Shaw Ave, 105-164, Clovis, CA 93611
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendAdminNewApplicationEmail(member: {
  name: string
  email: string
  membershipTier: string
  phone?: string | null
  businessName?: string | null
  city?: string | null
  sector?: string | null
}) {
  const tierLabel = member.membershipTier === 'corporate' ? 'Corporate' : 'Individual'

  const details = [
    `<strong>Name:</strong> ${member.name}`,
    `<strong>Email:</strong> ${member.email}`,
    `<strong>Tier:</strong> ${tierLabel}`,
    member.phone ? `<strong>Phone:</strong> ${member.phone}` : null,
    member.businessName ? `<strong>Business:</strong> ${member.businessName}` : null,
    member.city ? `<strong>City:</strong> ${member.city}` : null,
    member.sector ? `<strong>Industry:</strong> ${member.sector}` : null,
  ]
    .filter(Boolean)
    .join('<br/>')

  const resend = getResend()
  if (!resend) return

  const { fromEmail, adminEmail } = getConfig()
  await resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: adminEmail,
    subject: `New Membership Application — ${member.name}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            NEW MEMBERSHIP APPLICATION
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 24px;">
            ${member.name} has applied for a ${tierLabel} Membership
          </h2>
          <div style="background: white; border: 1px solid #E8E4DD; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="color: #5A6A7A; line-height: 2; margin: 0; font-size: 14px;">
              ${details}
            </p>
          </div>
          <div style="text-align: center;">
            <a href="${getConfig().siteUrl}/admin" style="background: #B58B2E; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">
              Review &amp; Approve
            </a>
          </div>
        </div>
        <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
            CVICC Admin Notification
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendContactFormEmail(data: {
  fullName: string
  email: string
  phone?: string
  subjectLabel: string
  message: string
}) {
  const resend = getResend()
  if (!resend) return

  const { fromEmail, adminEmail } = getConfig()
  await resend.emails.send({
    from: `CVICC Website <${fromEmail}>`,
    to: adminEmail,
    replyTo: data.email,
    subject: `Contact Form: ${data.subjectLabel} — ${data.fullName}`,
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
              <strong>Name:</strong> ${data.fullName}<br/>
              <strong>Email:</strong> ${data.email}<br/>
              ${data.phone ? `<strong>Phone:</strong> ${data.phone}<br/>` : ''}
              <strong>Subject:</strong> ${data.subjectLabel}
            </p>
          </div>
          <div style="background: white; border: 1px solid #E8E4DD; border-radius: 8px; padding: 24px;">
            <p style="color: #1E3A5F; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px;">
              Message
            </p>
            <p style="color: #5A6A7A; line-height: 1.7; margin: 0; font-size: 14px; white-space: pre-wrap;">${data.message}</p>
          </div>
          <p style="color: #5A6A7A; font-size: 12px; margin: 24px 0 0; text-align: center;">
            Reply directly to this email to respond to ${data.fullName}.
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
}

export async function sendMemberApprovedEmail(member: {
  name: string
  email: string
  membershipTier: string
  membershipNumber: string
}) {
  const tierLabel = member.membershipTier === 'corporate' ? 'Corporate' : 'Individual'
  const { siteUrl } = getConfig()

  const resend = getResend()
  if (!resend) return

  const { fromEmail } = getConfig()
  await resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: member.email,
    subject: 'CVICC Membership Approved — Create Your Account',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">
              &#10003;
            </div>
          </div>
          <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px; text-align: center;">
            Congratulations, ${member.name}!
          </h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px; text-align: center;">
            Your <strong>${tierLabel} Membership</strong> has been approved. You are now an official member of the Central Valley Indian Chamber of Commerce.
          </p>
          <div style="background: #1E3A5F; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="color: #D4A830; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
              Your Membership Number
            </p>
            <p style="color: white; font-size: 36px; font-weight: 300; letter-spacing: 6px; margin: 8px 0 0;">
              ${member.membershipNumber}
            </p>
          </div>
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #065F46; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Status: Active Member
            </p>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 16px 0; text-align: center;">
            Use your membership number to create your member portal account. Click the button below to get started.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/register" style="background: #B58B2E; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">
              Create Your Account
            </a>
          </div>
        </div>
        <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
            Central Valley Indian Chamber of Commerce, Inc.<br/>
            1840 Shaw Ave, 105-164, Clovis, CA 93611
          </p>
        </div>
      </div>
    `,
  })
}
