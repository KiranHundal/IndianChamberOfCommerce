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
            4610 W Jacquelyn Ave, Fresno, CA 93722
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
            4610 W Jacquelyn Ave, Fresno, CA 93722
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendBoardMemberWelcomeEmail(member: {
  name: string
  email: string
  role: string
}) {
  const resend = getResend()
  if (!resend) throw new Error('Email service not configured (RESEND_API_KEY missing)')

  const { fromEmail, siteUrl } = getConfig()
  return resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: member.email,
    subject: 'Welcome to the CVICC Board of Directors',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">
            Board of Directors
          </p>
          <h2 style="color: #1E3A5F; font-size: 24px; font-weight: 300; margin: 0 0 20px;">
            Welcome, ${member.name}
          </h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            On behalf of the Central Valley Indian Chamber of Commerce, it is our honor to welcome you as our new <strong>${member.role}</strong>.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            Your leadership, expertise, and commitment to our community will play an essential role in advancing CVICC's mission — connecting, supporting, and elevating Indian-American businesses throughout the Central Valley.
          </p>
          <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
            <p style="color: #1E3A5F; margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
              Your Profile
            </p>
            <p style="color: #5A6A7A; margin: 0 0 12px; font-size: 14px;">
              Your profile is now listed on the CVICC Board of Directors page.
            </p>
            <a href="${siteUrl}/about/leadership" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
              View the Board Page
            </a>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0;">
            We look forward to working alongside you. If you have any questions, please don't hesitate to reach out.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0;">
            Warm regards,<br/>
            <strong style="color: #1E3A5F;">The CVICC Board</strong>
          </p>
        </div>
        <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
            Central Valley Indian Chamber of Commerce, Inc.<br/>
            4610 W Jacquelyn Ave, Fresno, CA 93722
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendTeamAccessEmail(invite: {
  name: string
  email: string
  role: 'admin' | 'moderator'
  invitedBy?: string | null
}) {
  const resend = getResend()
  if (!resend) throw new Error('Email service not configured (RESEND_API_KEY missing)')

  const { fromEmail, siteUrl } = getConfig()
  const roleLabel = invite.role === 'admin' ? 'Admin' : 'Moderator'
  const canDo = invite.role === 'admin'
    ? 'You have full access: approve members, log payments, add expenses, sync Square, send invitations, manage the board, run reports, and grant access to others.'
    : 'You can approve pending members, log offline payments, sync Square, add expenses, and send membership invitations. Board content, videos, reports and team management stay with admins.'
  const senderLine = invite.invitedBy ? ` (invited by ${invite.invitedBy})` : ''

  return resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: invite.email,
    subject: `Your CVICC ${roleLabel} Access`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">Team Access${senderLine}</p>
          <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px;">
            Hi ${invite.name},
          </h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            You now have <strong>${roleLabel}</strong> access to the CVICC admin dashboard. ${canDo}
          </p>
          <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
            <p style="color: #1E3A5F; margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">To set your password</p>
            <ol style="color: #5A6A7A; margin: 0 0 12px 18px; padding: 0; line-height: 1.7; font-size: 14px;">
              <li>Go to <a href="${siteUrl}/register" style="color: #1E3A5F;">${siteUrl}/register</a></li>
              <li>Enter <strong>${invite.email}</strong> in the Membership Number / Email field</li>
              <li>Choose a password (8+ characters) and confirm it</li>
              <li>Sign in at <a href="${siteUrl}/login" style="color: #1E3A5F;">${siteUrl}/login</a></li>
            </ol>
            <div style="text-align: center; margin-top: 12px;">
              <a href="${siteUrl}/register" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">Set My Password</a>
            </div>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0; font-size: 13px;">
            Once signed in, you'll land on <a href="${siteUrl}/admin" style="color: #1E3A5F;">${siteUrl}/admin</a>. Any questions, just reply to this email.
          </p>
        </div>
        <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
            Central Valley Indian Chamber of Commerce, Inc.<br/>
            4610 W Jacquelyn Ave, Fresno, CA 93722
          </p>
        </div>
      </div>
    `,
  })
}

const SQUARE_CHECKOUT_LINKS = {
  individual: 'https://square.link/u/Av93qe4Z',
  corporate: 'https://square.link/u/9opDARDg',
} as const

export async function sendMembershipPaymentLinkEmail(member: {
  name: string
  email: string
  membershipTier: string
}) {
  const resend = getResend()
  if (!resend) throw new Error('Email service not configured (RESEND_API_KEY missing)')

  const tier = member.membershipTier === 'corporate' ? 'corporate' : 'individual'
  const tierLabel = tier === 'corporate' ? 'Corporate' : 'Individual'
  const amount = tier === 'corporate' ? '$395' : '$95'
  const link = SQUARE_CHECKOUT_LINKS[tier]

  const { fromEmail } = getConfig()
  return resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: member.email,
    subject: `CVICC Membership — Complete Your ${tierLabel} Payment`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px;">
            Hi ${member.name},
          </h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            Thank you for signing up for a <strong>${tierLabel} Membership</strong> with the Central Valley Indian Chamber of Commerce. To finish enrolling, please complete your ${amount} payment using the secure Square link below.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
              Pay ${amount} Now
            </a>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0; font-size: 13px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${link}" style="color: #1E3A5F; word-break: break-all;">${link}</a>
          </p>
          <div style="background: #FEF9E7; border: 1px solid #F0DCA0; border-radius: 8px; padding: 16px 20px; margin: 32px 0 0;">
            <p style="color: #92700C; margin: 0; font-size: 13px; line-height: 1.6;">
              Once your payment is received, your application will move to <strong>Pending Approval</strong>, and you'll get a follow-up email with your membership number.
            </p>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0; font-size: 13px;">
            Please use the same email address <strong>${member.email}</strong> at checkout so we can match your payment automatically.
          </p>
        </div>
        <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
            Central Valley Indian Chamber of Commerce, Inc.<br/>
            4610 W Jacquelyn Ave, Fresno, CA 93722
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendMembershipInvitationEmail(invite: {
  name?: string | null
  email: string
  businessName?: string | null
  suggestedTier?: string | null
  personalNote?: string | null
  fromName?: string | null
}) {
  const resend = getResend()
  if (!resend) throw new Error('Email service not configured (RESEND_API_KEY missing)')

  const { fromEmail, siteUrl } = getConfig()
  const greeting = invite.name ? `Dear ${invite.name},` : 'Hello,'
  const tierLine = invite.suggestedTier === 'corporate'
    ? 'For your organization, we recommend our <strong>Corporate Membership</strong> ($395/year, founding rate — regularly $495).'
    : invite.suggestedTier === 'individual'
      ? 'We recommend our <strong>Individual Membership</strong> ($95/year, founding rate — regularly $195).'
      : 'We offer <strong>Individual Membership</strong> ($95/year) and <strong>Corporate Membership</strong> ($395/year) — both at founding-member pricing.'

  const businessLine = invite.businessName
    ? `<p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">We&rsquo;d be honored to have <strong>${invite.businessName}</strong> represented in our chamber.</p>`
    : ''

  const noteBlock = invite.personalNote
    ? `<div style="background: #FFFFFF; border-left: 3px solid #D4A830; padding: 14px 18px; margin: 20px 0; color: #5A6A7A; font-style: italic; line-height: 1.7;">${invite.personalNote}</div>`
    : ''

  return resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: invite.email,
    subject: 'A Personal Invitation to Join CVICC',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">
            You&rsquo;re Invited
          </p>
          <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 20px;">
            ${greeting}
          </h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            On behalf of the Central Valley Indian Chamber of Commerce, I&rsquo;m personally inviting you to join our growing network of Indian-American business leaders across California&rsquo;s Central Valley.
          </p>
          ${businessLine}
          ${noteBlock}
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            CVICC connects, supports, and elevates Indian-American businesses through networking events, mentorship, community advocacy, and cultural celebration. As a member, you&rsquo;ll access exclusive events, a business directory listing, and the opportunity to shape the future of our community.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 24px;">
            ${tierLine}
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/join" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
              Join CVICC Today
            </a>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0; font-size: 14px;">
            Questions? Reply to this email or visit <a href="${siteUrl}/contact" style="color: #1E3A5F;">${siteUrl}/contact</a>.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0;">
            Warm regards,<br/>
            <strong style="color: #1E3A5F;">${invite.fromName || 'The CVICC Board'}</strong><br/>
            <span style="font-size: 13px;">Central Valley Indian Chamber of Commerce</span>
          </p>
        </div>
        <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
            Central Valley Indian Chamber of Commerce, Inc.<br/>
            4610 W Jacquelyn Ave, Fresno, CA 93722
          </p>
        </div>
      </div>
    `,
  })
}
