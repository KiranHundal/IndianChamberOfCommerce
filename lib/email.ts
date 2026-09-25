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
  role: 'admin' | 'moderator' | 'reviewer'
  invitedBy?: string | null
}) {
  const resend = getResend()
  if (!resend) throw new Error('Email service not configured (RESEND_API_KEY missing)')

  const { fromEmail, siteUrl } = getConfig()
  const roleLabel = invite.role === 'admin' ? 'Admin' : invite.role === 'reviewer' ? 'Reviewer' : 'Moderator'
  const canDo = invite.role === 'admin'
    ? 'You have full access: approve members, log payments, add expenses, sync Square, send invitations, manage the board, run reports, and grant access to others.'
    : invite.role === 'reviewer'
      ? 'You can see the members list and approve or deny pending membership applications. That is the extent of your access — no finances, board content, or reports.'
      : 'You can add expenses, log offline payments, sync Square, and send membership invitations. Approve/deny of pending members stays with the reviewer and admins.'
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
  fromDesignation?: string | null
  fromEmail?: string | null
  fromReplyTo?: string | null
  textOnly?: boolean | null
  subjectOverride?: string | null
  bodyOverride?: string | null
}) {
  const resend = getResend()
  if (!resend) throw new Error('Email service not configured (RESEND_API_KEY missing)')

  const cfg = getConfig()
  const fromEmail = invite.fromEmail?.trim() || cfg.fromEmail
  const siteUrl = cfg.siteUrl
  const greeting = invite.name ? `Dear ${invite.name},` : 'Hello,'

  // Plain-text alternative + List-Unsubscribe header. Gmail specifically
  // weights both heavily — the presence of a text/plain body signals "real
  // person mail," and a working unsubscribe drops a "why is this bulk?"
  // penalty. Domain reputation still has to warm up organically (Google
  // watches how many recipients open, reply, and don't complain), but
  // these two changes get invitations out of the promotions/spam bucket
  // for most recipients on day one.
  const subject = invite.name
    ? `${invite.fromName || 'CVICC'} — a personal invitation for ${invite.name}`
    : `A personal invitation from ${invite.fromName || 'the CVICC Board'}`
  const plainText = [
    invite.name ? `Dear ${invite.name},` : 'Hello,',
    '',
    `On behalf of the Central Valley Indian Chamber of Commerce, I'm personally inviting you to join our growing network of Indian-American business leaders across California's Central Valley.`,
    invite.businessName ? `\nWe'd be honored to have ${invite.businessName} represented in our chamber.` : '',
    invite.personalNote ? `\n"${invite.personalNote}"` : '',
    '',
    `CVICC connects, supports, and elevates Indian-American businesses through networking events, mentorship, community advocacy, and cultural celebration. As a member, you'll access exclusive events, a business directory listing, and the opportunity to shape the future of our community.`,
    '',
    `Learn more about the chamber at ${siteUrl}.`,
    '',
    `Ready to join? ${siteUrl}/join`,
    '',
    `Questions? Just reply to this email, or visit ${siteUrl}/contact.`,
    '',
    `Warm regards,`,
    invite.fromName || 'The CVICC Board',
    invite.fromDesignation || '',
    `Central Valley Indian Chamber of Commerce`,
    '',
    `— To unsubscribe from future CVICC emails, reply with "unsubscribe" or visit ${siteUrl}/contact.`,
  ].filter(Boolean).join('\n')

  // Text-only mode: send as genuine 1:1 correspondence. Drops every
  // bulk-mail signal Gmail uses to route to Promotions:
  //
  //   - No List-Unsubscribe header (that header *explicitly* declares the
  //     message is bulk list mail — Gmail then trusts you and files it
  //     accordingly).
  //   - No pricing paragraph, no /join link, no unsubscribe footer, no
  //     address block. Those are marketing-template signals even in text.
  //   - Subject line is "Quick note" — no "invitation", no "membership",
  //     no product-shaped keywords.
  //   - Body reads like a short peer-to-peer email offering a coffee, not
  //     a member drive. If a personal note is attached it becomes the
  //     centerpiece.
  //
  // The trade-off: no automatic unsubscribe. That's fine for 1:1 outreach
  // (recipient can just reply "no thanks"), but keep textOnly=false for
  // any actual bulk campaign.
  if (invite.textOnly) {
    // If the sender edited the preview textareas in the form, use those
    // verbatim. Otherwise compute the same default we always did so the
    // API stays backward-compatible.
    const finalSubject = invite.subjectOverride?.trim() || (() => {
      const senderFirst = (invite.fromName || 'Kiran').split(' ')[0]
      return `Quick note from ${senderFirst}`
    })()
    const finalBody = invite.bodyOverride?.trim() || (() => {
      const firstName = invite.name?.split(' ')[0]
      const shortGreeting = firstName ? `Hi ${firstName},` : 'Hi there,'
      // Body paragraphs — SEPARATED by blank lines. Keep filter(Boolean)
      // AFTER building the parts (so a null personal note doesn't leave a
      // stray blank paragraph), then join with \n\n so the HTML formatter
      // can identify each one.
      const bodyParas = [
        shortGreeting,
        `Hope you're doing well. I'm on the board of the Central Valley Indian Chamber of Commerce, and we've been building a group of Indian-American business owners and professionals across the valley — finance, healthcare, real estate, hospitality, and a lot in between.`,
        invite.businessName
          ? `I thought of ${invite.businessName} and wanted to reach out.`
          : `I thought of you and wanted to reach out.`,
        invite.personalNote?.trim() || null,
        `Would you have 15 minutes for a coffee or a quick call so I can give you a real sense of what we do? No pressure either way — just wanted to say hello.`,
      ].filter(Boolean).join('\n\n')
      // Signature block — single \n between lines so it renders as one
      // grouped paragraph, but separated from the body by a blank line.
      const signature = [
        'Warmly,',
        invite.fromName || 'Kiran Hundal',
        invite.fromDesignation?.trim() || null,
        'Central Valley Indian Chamber of Commerce',
      ].filter(Boolean).join('\n')
      return `${bodyParas}\n\n${signature}`
    })()

    // Minimal-HTML companion. Same words as the plain-text body but
    // rendered in a serif face with proper paragraph spacing and a subtle
    // underlined "Join CVICC" link. NO banner, NO big button, NO tables —
    // Gmail's Promotions classifier looks for those signals. What we have
    // instead is well-formatted personal correspondence, the kind a lawyer
    // or a bank president actually sends. Reads premium, stays in Primary.
    const escaped = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const paragraphs = finalBody.split(/\n\s*\n/).filter((p) => p.trim())
    // The signature is the last chunk (Warmly, / Name / Title / Chamber).
    // Splitting on \n gives us clean lines for that block.
    const signatureLines = (paragraphs[paragraphs.length - 1] || '')
      .split('\n')
      .filter((s) => s.trim())
    const bodyParagraphs = paragraphs.slice(0, -1)

    const htmlBody = `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 24px 32px; color: #222; font-size: 16px; line-height: 1.75;">
        ${bodyParagraphs
          .map((p) => `<p style="margin: 0 0 18px;">${escaped(p).replace(/\n/g, '<br/>')}</p>`)
          .join('')}
        <p style="margin: 24px 0 0;">
          If you'd like to know more, everything is at
          <a href="${siteUrl}" style="color: #1E3A5F; text-decoration: underline;">www.indianchamberofcommerce.org</a>
          — and you can
          <a href="${siteUrl}/join" style="color: #1E3A5F; text-decoration: underline; font-weight: 600;">join here</a>
          when you're ready.
        </p>
        <p style="margin: 28px 0 0; color: #444;">
          ${signatureLines
            .map((line, i) => {
              if (i === 0) return `<span>${escaped(line)}</span>` // "Warmly,"
              if (i === 1) return `<br/><strong style="color: #1a1a1a;">${escaped(line)}</strong>` // Name
              return `<br/><span style="color: #555;">${escaped(line)}</span>` // Title / Org
            })
            .join('')}
        </p>
      </div>
    `

    return resend.emails.send({
      from: `${invite.fromName || 'CVICC'} <${fromEmail}>`,
      to: invite.email,
      replyTo: invite.fromReplyTo?.trim() || fromEmail,
      subject: finalSubject,
      text: finalBody,
      html: htmlBody,
      // Intentionally NO List-Unsubscribe / List-Unsubscribe-Post headers
      // — this is personal correspondence, not bulk mail.
    })
  }

  // HTML path — the branded template. Navy header + gold "You're Invited"
  // preheader + styled body + big gold Join CVICC button + navy footer.
  // Pricing is intentionally NOT mentioned; the site handles that at
  // /join so the email can stay evergreen without needing to be updated
  // when rates change. The website URL is included both as a link in the
  // body and as an underlined line under the CTA button.
  const finalSubject = invite.subjectOverride?.trim() || subject
  const finalText = invite.bodyOverride?.trim() || plainText

  return resend.emails.send({
    from: `${invite.fromName || 'CVICC'} <${fromEmail}>`,
    to: invite.email,
    replyTo: invite.fromReplyTo?.trim() || fromEmail,
    subject: finalSubject,
    text: finalText,
    headers: {
      'List-Unsubscribe': `<${siteUrl}/contact>, <mailto:${invite.fromReplyTo?.trim() || fromEmail}?subject=Unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
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
          ${invite.businessName ? `<p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">We&rsquo;d be honored to have <strong>${invite.businessName}</strong> represented in our chamber.</p>` : ''}
          ${invite.personalNote ? `<div style="background: #FFFFFF; border-left: 3px solid #D4A830; padding: 14px 18px; margin: 20px 0; color: #5A6A7A; font-style: italic; line-height: 1.7;">${invite.personalNote}</div>` : ''}
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            CVICC connects, supports, and elevates Indian-American businesses through networking events, mentorship, community advocacy, and cultural celebration. As a member, you&rsquo;ll access exclusive events, a business directory listing, and the opportunity to shape the future of our community.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 24px;">
            Learn more about the chamber and what membership includes at <a href="${siteUrl}" style="color: #1E3A5F; text-decoration: underline;">www.indianchamberofcommerce.org</a>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/join" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
              Join CVICC
            </a>
            <p style="margin: 12px 0 0; color: #8a8a8a; font-size: 12px;">
              <a href="${siteUrl}/join" style="color: #8a8a8a; text-decoration: underline;">${siteUrl}/join</a>
            </p>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0; font-size: 14px;">
            Questions? Reply to this email or visit <a href="${siteUrl}/contact" style="color: #1E3A5F;">${siteUrl}/contact</a>.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0;">
            Warm regards,<br/>
            <strong style="color: #1E3A5F;">${invite.fromName || 'The CVICC Board'}</strong>${invite.fromDesignation ? `<br/><span style="font-size: 13px; color: #5A6A7A;">${invite.fromDesignation}</span>` : ''}<br/>
            <span style="font-size: 13px;">Central Valley Indian Chamber of Commerce</span><br/>
            <a href="${siteUrl}" style="color: #5A6A7A; font-size: 13px; text-decoration: none;">www.indianchamberofcommerce.org</a>
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

function moneyFromCents(cents: number | null | undefined): string {
  if (cents == null || cents === 0) return 'Free'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`
}

function eventWhen(startAt: Date, endAt: Date | null): string {
  const day = startAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const startT = startAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const endT = endAt ? endAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
  return endT ? `${day} · ${startT} – ${endT}` : `${day} · ${startT}`
}

export async function sendEventRsvpConfirmationEmail(input: {
  to: string
  name: string
  guests: number
  rsvpId?: string
  eventId?: string
  event: {
    slug: string
    title: string
    location: string | null
    address: string | null
    startAt: Date
    endAt: Date | null
    priceCents: number | null
  }
}) {
  const resend = getResend()
  if (!resend) return

  const { fromEmail, siteUrl } = getConfig()
  const seats = 1 + input.guests
  const price = moneyFromCents(input.event.priceCents)
  const totalCents = (input.event.priceCents || 0) * seats
  const total = moneyFromCents(totalCents)

  // Check-in QR — scan at the door to mark this RSVP attended. Embedded
  // inline as base64 so the email is fully self-contained.
  let qrDataUri: string | null = null
  if (input.rsvpId && input.eventId) {
    try {
      const QRCode = (await import('qrcode')).default
      const target = `${siteUrl}/admin/events/${input.eventId}/checkin?code=${input.rsvpId}`
      qrDataUri = await QRCode.toDataURL(target, { width: 240, margin: 1, color: { dark: '#1E3A5F', light: '#FFFFFF' } })
    } catch (e) {
      console.error('QR generation failed:', e)
    }
  }

  return resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: input.to,
    subject: `You're confirmed: ${input.event.title}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 22px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">You&rsquo;re confirmed</p>
          <h2 style="color: #1E3A5F; font-size: 24px; font-weight: 300; margin: 0 0 20px;">${input.event.title}</h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 20px;">
            Hi ${input.name}, thanks for RSVPing. Here are the details — save this email and we&rsquo;ll see you there.
          </p>
          <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; color: #1E3A5F; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #8a8a8a; width: 90px;">When</td><td style="padding: 6px 0;">${eventWhen(input.event.startAt, input.event.endAt)}</td></tr>
              ${input.event.location ? `<tr><td style="padding: 6px 0; color: #8a8a8a;">Where</td><td style="padding: 6px 0;">${input.event.location}${input.event.address ? `<br/><span style="color: #8a8a8a;">${input.event.address}</span>` : ''}</td></tr>` : ''}
              <tr><td style="padding: 6px 0; color: #8a8a8a;">Seats</td><td style="padding: 6px 0;">${seats}${input.guests > 0 ? ` (you + ${input.guests} guest${input.guests === 1 ? '' : 's'})` : ''}</td></tr>
              <tr><td style="padding: 6px 0; color: #8a8a8a;">Ticket</td><td style="padding: 6px 0;">${price}${seats > 1 && (input.event.priceCents || 0) > 0 ? ` × ${seats} = <strong>${total}</strong>` : ''}</td></tr>
            </table>
          </div>
          ${(input.event.priceCents || 0) > 0 ? `
          <div style="background: #FEF9E7; border: 1px solid #F0DCA0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
            <p style="color: #92700C; margin: 0; font-size: 13px; line-height: 1.6;">
              Payment of <strong>${total}</strong> will be collected at check-in unless a separate payment link is sent. Reply to this email if you&rsquo;d like to pay in advance.
            </p>
          </div>` : ''}
          ${qrDataUri ? `
          <div style="text-align: center; margin: 28px 0 8px;">
            <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">Check-in pass</p>
            <img src="${qrDataUri}" alt="Check-in QR" width="180" height="180" style="border: 1px solid #EDE6D3; padding: 8px; background: #FFFFFF; border-radius: 8px;"/>
            <p style="color: #8a8a8a; font-size: 12px; margin: 12px 0 0;">Show this at the door — scan for a one-tap check-in.</p>
          </div>` : ''}
          <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0;">
            Need to change your RSVP or bring more guests? Just reply and we&rsquo;ll update it.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0;">
            Warm regards,<br/>
            <strong style="color: #1E3A5F;">The CVICC Team</strong><br/>
            <a href="${siteUrl}" style="color: #5A6A7A; font-size: 13px; text-decoration: none;">www.indianchamberofcommerce.org</a>
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

export async function sendEventRsvpAdminNotificationEmail(input: {
  to: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone: string | null
  guests: number
  note: string | null
  event: { title: string; startAt: Date; priceCents: number | null; slug: string }
  totalRsvps: number
  totalSeats: number
  capacity: number | null
}) {
  const resend = getResend()
  if (!resend) return

  const { fromEmail, siteUrl } = getConfig()
  const seats = 1 + input.guests
  const revenueCents = (input.event.priceCents || 0) * seats
  const capacityLine = input.capacity != null ? `${input.totalSeats}/${input.capacity} seats booked` : `${input.totalSeats} seats booked`

  return resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: input.to,
    replyTo: input.attendeeEmail,
    subject: `New RSVP: ${input.attendeeName} — ${input.event.title}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="padding: 24px 28px; background: #FAFAF7; border: 1px solid #EDE6D3; border-radius: 8px;">
          <p style="color: #D4A830; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px;">New RSVP</p>
          <h2 style="color: #1E3A5F; font-size: 20px; font-weight: 400; margin: 0 0 4px;">${input.attendeeName}</h2>
          <p style="color: #5A6A7A; margin: 0 0 16px; font-size: 14px;">
            <a href="mailto:${input.attendeeEmail}" style="color: #1E3A5F;">${input.attendeeEmail}</a>
            ${input.attendeePhone ? ` · ${input.attendeePhone}` : ''}
          </p>
          <table style="width: 100%; border-collapse: collapse; color: #1E3A5F; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #8a8a8a; width: 100px;">Event</td><td style="padding: 4px 0;"><strong>${input.event.title}</strong></td></tr>
            <tr><td style="padding: 4px 0; color: #8a8a8a;">When</td><td style="padding: 4px 0;">${input.event.startAt.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td></tr>
            <tr><td style="padding: 4px 0; color: #8a8a8a;">Seats</td><td style="padding: 4px 0;">${seats}${input.guests > 0 ? ` (${input.guests} extra guest${input.guests === 1 ? '' : 's'})` : ''}</td></tr>
            ${revenueCents > 0 ? `<tr><td style="padding: 4px 0; color: #8a8a8a;">Owed</td><td style="padding: 4px 0;"><strong>${moneyFromCents(revenueCents)}</strong> at door</td></tr>` : ''}
            <tr><td style="padding: 4px 0; color: #8a8a8a;">Running</td><td style="padding: 4px 0;">${input.totalRsvps} RSVPs · ${capacityLine}</td></tr>
          </table>
          ${input.note ? `<div style="background: #FFFFFF; border-left: 3px solid #D4A830; padding: 12px 16px; margin: 16px 0 0; color: #5A6A7A; font-style: italic; font-size: 13px;">${input.note}</div>` : ''}
          <p style="margin: 20px 0 0;">
            <a href="${siteUrl}/admin/events" style="color: #1E3A5F; font-size: 13px;">Open in dashboard →</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendRenewalReminderEmail(input: {
  to: string
  name: string
  membershipTier: 'individual' | 'corporate' | string
  expiresAt: Date
  daysLeft: number
}) {
  const resend = getResend()
  if (!resend) return

  const { fromEmail, siteUrl } = getConfig()
  const tierLabel = input.membershipTier === 'corporate' ? 'Corporate' : 'Individual'
  const amount = input.membershipTier === 'corporate' ? '$395' : '$95'
  const expiresStr = input.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  // Copy adapts to timing without three separate templates: gentle before
  // expiration, direct on the day, warm-but-clear when overdue.
  const isPast = input.daysLeft < 0
  const isSoon = input.daysLeft <= 7 && input.daysLeft >= 0
  const eyebrow = isPast
    ? 'Renewal overdue'
    : isSoon
    ? 'Renewal due soon'
    : 'Renewal coming up'
  const headline = isPast
    ? `Your membership expired ${Math.abs(input.daysLeft)} ${Math.abs(input.daysLeft) === 1 ? 'day' : 'days'} ago`
    : isSoon
    ? `Your membership renews in ${input.daysLeft} ${input.daysLeft === 1 ? 'day' : 'days'}`
    : `Your membership renews on ${expiresStr}`

  return resend.emails.send({
    from: `CVICC <${fromEmail}>`,
    to: input.to,
    subject: isPast
      ? `Your CVICC membership has lapsed — renew in one click`
      : isSoon
      ? `Renew your CVICC membership by ${expiresStr}`
      : `Your CVICC membership renews soon`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
        <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
          <h1 style="color: #D4A830; font-size: 22px; margin: 0; font-weight: 300; letter-spacing: 2px;">
            CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
          </h1>
        </div>
        <div style="padding: 40px 32px; background: #FAFAF7;">
          <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">${eyebrow}</p>
          <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px;">${headline}</h2>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
            Hi ${input.name}, thank you for being part of CVICC. Your <strong>${tierLabel}</strong> membership is up for renewal — one click and you&rsquo;re set for another year of events, mentorship, and the growing chamber network.
          </p>
          <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; color: #1E3A5F; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #8a8a8a; width: 110px;">Tier</td><td style="padding: 6px 0;">${tierLabel}</td></tr>
              <tr><td style="padding: 6px 0; color: #8a8a8a;">Renewal</td><td style="padding: 6px 0;"><strong>${amount}</strong> · one year</td></tr>
              <tr><td style="padding: 6px 0; color: #8a8a8a;">${isPast ? 'Expired' : 'Expires'}</td><td style="padding: 6px 0;">${expiresStr}</td></tr>
            </table>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/portal" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
              Renew Membership
            </a>
            <p style="margin: 12px 0 0; color: #8a8a8a; font-size: 12px;">
              <a href="${siteUrl}/portal" style="color: #8a8a8a; text-decoration: underline;">${siteUrl}/portal</a>
            </p>
          </div>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0; font-size: 14px;">
            Prefer to pay another way, or have questions? Just reply to this email — we&rsquo;ll take care of it.
          </p>
          <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0;">
            Warm regards,<br/>
            <strong style="color: #1E3A5F;">The CVICC Team</strong><br/>
            <a href="${siteUrl}" style="color: #5A6A7A; font-size: 13px; text-decoration: none;">www.indianchamberofcommerce.org</a>
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
