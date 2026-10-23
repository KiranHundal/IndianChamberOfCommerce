// Role-specific team-update email bodies. Each export is a function
// (name, email, siteUrl) => string so the recipient-specific values
// interpolate at send time. HTML/text content came from the
// draft-team-update-emails workflow — hand-edit here to tweak.

// --- MODERATOR ---
export const moderatorUpdateSubject = "You're set up as a CVICC Moderator \u2014 here's what you can do"
export const moderatorUpdateBodyHtml = (name: string, email: string, siteUrl: string) => `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
  <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
    <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
      CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
    </h1>
  </div>
  <div style="padding: 40px 32px; background: #FAFAF7;">
    <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">Moderator Access — Finance Team</p>
    <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px;">
      Hi ${name},
    </h2>
    <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
      Thanks for jumping in on the finance team. The admin dashboard is live and you have everything you need to work your referrals end-to-end. This note walks through what you can do and where to click.
    </p>

    <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <p style="color: #1E3A5F; margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">The one rule to remember</p>
      <p style="color: #5A6A7A; margin: 0; line-height: 1.7; font-size: 14px;">
        You can see <strong>every</strong> chamber member on the list, but editing, resending welcomes, and sending payment links only work on members <strong>you personally referred</strong>. Buttons that don't apply to a row are simply hidden — so if you don't see an action, that member belongs to another board sponsor.
      </p>
    </div>

    <h3 style="color: #1E3A5F; font-size: 16px; font-weight: 600; margin: 28px 0 10px; letter-spacing: 0.5px;">What you can do today</h3>
    <ol style="color: #5A6A7A; margin: 0 0 8px 20px; padding: 0; line-height: 1.9; font-size: 14px;">
      <li>
        <strong style="color: #1E3A5F;">Find your referrals.</strong>
        Open the Members page and use the filter at the top — pick your name from the "Referred by" dropdown. That view is your working list.
      </li>
      <li>
        <strong style="color: #1E3A5F;">Attribute unreferred members.</strong>
        If a member joined without a sponsor on record, the KPI row shows an "Unreferred" chip (amber when the count is above zero). Click it, open the row, and use <em>Set Referrer</em> to put the correct board sponsor's name on the record.
      </li>
      <li>
        <strong style="color: #1E3A5F;">Log an offline payment.</strong>
        When one of your referrals pays by check or cash, use <em>Log Offline Payment</em> on the member list. It records the payment and marks the member paid.
      </li>
      <li>
        <strong style="color: #1E3A5F;">Send a welcome email.</strong>
        On any of your referred rows, use <em>Resend Welcome</em> to re-send the onboarding note with their membership number.
      </li>
      <li>
        <strong style="color: #1E3A5F;">Send a payment link.</strong>
        For a referred member who hasn't paid yet, <em>Send Payment Link</em> emails them a Square checkout for their tier. You're CC'd automatically so you can follow up.
      </li>
      <li>
        <strong style="color: #1E3A5F;">Edit a referral's details.</strong>
        The pencil icon on your rows opens an edit modal — name, email, phone, business, city, sector, tier. Use it whenever a member's info needs cleanup.
      </li>
    </ol>

    <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 28px 0 24px;">
      <p style="color: #1E3A5F; margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Watch for the amber flag</p>
      <p style="color: #5A6A7A; margin: 0; line-height: 1.7; font-size: 14px;">
        If a row shows an amber <strong>"needs email"</strong> tag, it means the member has a placeholder address on file. They can't be approved and we can't send them anything useful until a real email is in. Click the pencil, add their email, and you're unblocked.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0 8px;">
      <a href="${siteUrl}/login" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">Sign In to the Dashboard</a>
    </div>
    <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0; font-size: 13px; text-align: center;">
      You'll sign in with <strong>${email}</strong>. If you haven't set a password yet, use the "Set your password" link on the sign-in page or just reply to this email and we'll resend it.
    </p>

    <p style="color: #5A6A7A; line-height: 1.7; margin: 28px 0 0;">
      Questions, anything confusing, or something you expected to see and don't — reply to this note. We'll walk through it with you.
    </p>
    <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0;">
      Thank you for the work you're putting into the chamber.<br/>
      <strong style="color: #1E3A5F;">The CVICC Board</strong>
    </p>
  </div>
  <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
      Central Valley Indian Chamber of Commerce, Inc.<br/>
      4610 W Jacquelyn Ave, Fresno, CA 93722
    </p>
  </div>
</div>`
export const moderatorUpdatePlainText = (name: string, email: string, siteUrl: string) => `Hi ${name},

Thanks for jumping in on the finance team. The CVICC admin dashboard is live and you have everything you need to work your referrals end-to-end. Here's a quick orientation.

THE ONE RULE TO REMEMBER
You can see every chamber member on the list, but editing, resending welcomes, and sending payment links only work on members you personally referred. Buttons that don't apply are simply hidden — if you don't see an action on a row, that member belongs to another board sponsor.

WHAT YOU CAN DO TODAY

1. Find your referrals. On the Members page, use the "Referred by" filter and pick your name. That view is your working list.

2. Attribute unreferred members. If a member has no sponsor on record, the KPI row shows an "Unreferred" chip (amber when above zero). Click it, open the row, and use Set Referrer to assign the correct board sponsor.

3. Log an offline payment. When one of your referrals pays by check or cash, use Log Offline Payment on the member list. It records the payment and marks them paid.

4. Send a welcome email. Use Resend Welcome on your referred rows to re-send onboarding with their membership number.

5. Send a payment link. For a referred member who hasn't paid, Send Payment Link emails them a Square checkout for their tier. You're CC'd automatically.

6. Edit a referral's details. The pencil icon on your rows opens an edit modal — name, email, phone, business, city, sector, tier.

WATCH FOR THE AMBER FLAG
A "needs email" tag means that member has a placeholder address on file. They can't be approved and we can't send them anything useful until a real email is in. Click the pencil, add their email, and you're unblocked.

Sign in: ${siteUrl}/login
Your username: ${email}

If you haven't set a password yet, use the "Set your password" link on the sign-in page or reply to this email and we'll resend it.

Questions, anything confusing, or something you expected to see and don't — just reply. We'll walk through it with you.

Thank you for the work you're putting into the chamber.

The CVICC Board
Central Valley Indian Chamber of Commerce, Inc.
4610 W Jacquelyn Ave, Fresno, CA 93722`

// --- REVIEWER ---
export const reviewerUpdateSubject = "CVICC Reviewer \u2014 Your approval workflow is ready"
export const reviewerUpdateBodyHtml = (name: string, email: string, siteUrl: string) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
  <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
    <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
      CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
    </h1>
  </div>
  <div style="padding: 40px 32px; background: #FAFAF7;">
    <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">Reviewer Access &mdash; Walkthrough</p>
    <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px;">
      Hi ${name},
    </h2>
    <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 16px;">
      Thank you for stepping in as our Reviewer. Your role on the dashboard is focused and intentional: you are the gatekeeper who decides which pending applicants officially become members of the chamber. We&rsquo;ve shaped your workspace around that single responsibility so you can move through pending applications quickly and with confidence.
    </p>

    <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <p style="color: #1E3A5F; margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">A quick note on your sidebar</p>
      <p style="color: #5A6A7A; line-height: 1.7; margin: 0; font-size: 14px;">
        You&rsquo;ll see only two items in the admin navigation: <strong>Overview</strong> and <strong>Members</strong>. That minimalism is deliberate &mdash; it keeps your attention on approvals and spares you the finance, board, and reporting surfaces you don&rsquo;t need to touch.
      </p>
    </div>

    <h3 style="color: #1E3A5F; font-size: 16px; font-weight: 500; margin: 32px 0 12px; letter-spacing: 0.5px;">Your workflows</h3>

    <ol style="color: #5A6A7A; margin: 0 0 24px 0; padding: 0 0 0 20px; line-height: 1.7; font-size: 14px;">
      <li style="margin-bottom: 16px;">
        <strong style="color: #1E3A5F;">Find pending applicants.</strong> Open <a href="${siteUrl}/admin/members" style="color: #1E3A5F;">Members</a> and click the <strong>Pending</strong> chip in the KPI row at the top of the page. The list filters down to applicants waiting on a decision. The chip also shows a live count, so you always know how many are in the queue.
      </li>
      <li style="margin-bottom: 16px;">
        <strong style="color: #1E3A5F;">Approve or reject each applicant.</strong> Every pending row has an <strong>Approve</strong> button and a <strong>Reject</strong> button. Approve moves the member into the active roster and triggers their welcome email with their membership number. Reject marks the application closed. Both decisions are logged with your name against the record.
      </li>
      <li style="margin-bottom: 16px;">
        <strong style="color: #1E3A5F;">Watch for the amber &ldquo;Needs email&rdquo; flag.</strong> If a pending row has a placeholder email on file (an address ending in <code style="background:#EDE6D3; padding:1px 6px; border-radius:3px; font-size:12px;">@noemail.cvicc.org</code>), the Approve button will be disabled and an amber indicator will explain why. Those applicants were added without a real contact address, so we can&rsquo;t send them a welcome email yet. An admin or moderator will edit in a real address, and then they&rsquo;ll be ready for your review.
      </li>
      <li style="margin-bottom: 16px;">
        <strong style="color: #1E3A5F;">Approve is also blocked for unpaid rows.</strong> If an applicant hasn&rsquo;t completed their membership payment yet, the server will prevent approval and the button will stay disabled. Once payment is logged, the row will become actionable.
      </li>
      <li style="margin-bottom: 16px;">
        <strong style="color: #1E3A5F;">Attribute unreferred members to the right board sponsor.</strong> On the KPI row you&rsquo;ll see an <strong>Unreferred</strong> chip (with an amber ring when the count is above zero). Clicking it filters the list to members whose board sponsor isn&rsquo;t on record. Every one of those rows now has a <strong>Set Referrer</strong> dropdown &mdash; if you know who brought a member in, please attribute them. It&rsquo;s a quiet but meaningful piece of record-keeping, and we opened the dropdown to you precisely because you&rsquo;re often the person who&rsquo;d know.
      </li>
      <li>
        <strong style="color: #1E3A5F;">What you intentionally won&rsquo;t see.</strong> You won&rsquo;t have buttons for logging payments, editing member details, or deactivating accounts. Those stay with the admin and the moderators (our finance-team board members) by design &mdash; it keeps the audit trail clean and lets you focus purely on the approval decision. If you spot a row that needs a correction, just drop a note to the admin and we&rsquo;ll handle it from there.
      </li>
    </ol>

    <div style="text-align: center; margin: 36px 0 24px;">
      <a href="${siteUrl}/login" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">Open the Dashboard</a>
    </div>

    <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0; font-size: 13px;">
      Sign in at <a href="${siteUrl}/login" style="color: #1E3A5F;">${siteUrl}/login</a> with <strong>${email}</strong>. Any question at all &mdash; a workflow you&rsquo;re unsure about, a row that doesn&rsquo;t behave as expected, a feature you wish existed &mdash; please just reply to this email. Your judgment is what gives new members a careful welcome, and we&rsquo;re grateful you&rsquo;re the one making those calls.
    </p>
    <p style="color: #5A6A7A; line-height: 1.7; margin: 20px 0 0; font-size: 13px;">
      With appreciation,<br/>
      The CVICC Board
    </p>
  </div>
  <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
      Central Valley Indian Chamber of Commerce, Inc.<br/>
      4610 W Jacquelyn Ave, Fresno, CA 93722
    </p>
  </div>
</div>
`
export const reviewerUpdatePlainText = (name: string, email: string, siteUrl: string) => `Hi ${name},

Thank you for stepping in as our Reviewer. Your role on the CVICC admin dashboard is focused and intentional: you are the gatekeeper who decides which pending applicants officially become members of the chamber. We've shaped your workspace around that single responsibility so you can move through pending applications quickly and with confidence.

A note on your sidebar: you'll see only two items — Overview and Members. That minimalism is deliberate. It keeps your attention on approvals and spares you the finance, board, and reporting surfaces you don't need to touch.

Your workflows:

1. Find pending applicants. Open Members (${siteUrl}/admin/members) and click the "Pending" chip in the KPI row at the top of the page. The list filters down to applicants waiting on a decision, and the chip shows a live count so you always know how many are in the queue.

2. Approve or reject each applicant. Every pending row has an Approve button and a Reject button. Approve moves the member into the active roster and triggers their welcome email with their membership number. Reject marks the application closed. Both decisions are logged with your name against the record.

3. Watch for the amber "Needs email" flag. If a pending row has a placeholder email on file (an address ending in @noemail.cvicc.org), the Approve button will be disabled and an amber indicator will explain why. Those applicants were added without a real contact address, so we can't send them a welcome email yet. An admin or moderator will edit in a real address, and then they'll be ready for your review.

4. Approve is also blocked for unpaid rows. If an applicant hasn't completed their membership payment yet, the server will prevent approval and the button will stay disabled. Once payment is logged, the row will become actionable.

5. Attribute unreferred members to the right board sponsor. On the KPI row you'll see an "Unreferred" chip (with an amber ring when the count is above zero). Clicking it filters the list to members whose board sponsor isn't on record. Every one of those rows has a Set Referrer dropdown — if you know who brought a member in, please attribute them. It's a quiet but meaningful piece of record-keeping, and we opened the dropdown to you precisely because you're often the person who'd know.

6. What you intentionally won't see. You won't have buttons for logging payments, editing member details, or deactivating accounts. Those stay with the admin and the moderators (our finance-team board members) by design — it keeps the audit trail clean and lets you focus purely on the approval decision. If you spot a row that needs a correction, just drop a note to the admin and we'll handle it from there.

Open the dashboard: ${siteUrl}/login

Sign in with ${email}. Any question at all — a workflow you're unsure about, a row that doesn't behave as expected, a feature you wish existed — please just reply to this email. Your judgment is what gives new members a careful welcome, and we're grateful you're the one making those calls.

With appreciation,
The CVICC Board

Central Valley Indian Chamber of Commerce, Inc.
4610 W Jacquelyn Ave, Fresno, CA 93722`

// --- ADMIN ---
export const adminUpdateSubject = "CVICC Admin: What shipped \u2014 roles, Edit/Reactivate, filters, View As"
export const adminUpdateBodyHtml = (name: string, email: string, siteUrl: string) => `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E3A5F;">
  <div style="background: #1E3A5F; padding: 40px 32px; text-align: center;">
    <h1 style="color: #D4A830; font-size: 24px; margin: 0; font-weight: 300; letter-spacing: 2px;">
      CENTRAL VALLEY INDIAN<br/>CHAMBER OF COMMERCE
    </h1>
  </div>
  <div style="padding: 40px 32px; background: #FAFAF7;">
    <p style="color: #D4A830; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">Admin Changelog</p>
    <h2 style="color: #1E3A5F; font-size: 22px; font-weight: 300; margin: 0 0 16px;">
      Hi ${name},
    </h2>
    <p style="color: #5A6A7A; line-height: 1.7; margin: 0 0 20px;">
      A brief tour of what has landed in the admin surface since the last pass. Nothing requires action from you &mdash; this is a map of the new buttons, flags, and scopes you will see the next time you sign in at <a href="${siteUrl}/admin" style="color: #1E3A5F;">${siteUrl}/admin</a>.
    </p>

    <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 0 0 20px;">
      <p style="color: #1E3A5F; margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Roles, settled</p>
      <ul style="color: #5A6A7A; margin: 0 0 0 18px; padding: 0; line-height: 1.7; font-size: 14px;">
        <li><strong>Admin</strong> (you) &mdash; full control over everything.</li>
        <li><strong>Moderator</strong> &mdash; finance team board members: Sonia, Roken, Surdeep, Rajinder, plus newly added Akash, Manreet, and R. Sidhu Buttar. They see all chamber members but can only Edit / Resend Welcome / Send Payment Link on members <em>they</em> referred. Buttons hide where they don't apply.</li>
        <li><strong>Reviewer</strong> (Gigi) &mdash; approve or deny pending members, set referrer on unreferred rows, read the list and overview. No finances, no editing, no deactivation.</li>
        <li><strong>Member</strong> &mdash; unchanged.</li>
      </ul>
    </div>

    <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 0 0 20px;">
      <p style="color: #1E3A5F; margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">New row actions</p>
      <ul style="color: #5A6A7A; margin: 0 0 0 18px; padding: 0; line-height: 1.7; font-size: 14px;">
        <li><strong>Edit</strong> (pencil icon on each row) &mdash; modal for name, email, phone, business, city, sector, tier. Admin edits anyone; moderators only their own referrals.</li>
        <li><strong>Reactivate</strong> &mdash; restores a member deactivated by accident, without re-minting their membership number or re-sending the welcome email.</li>
        <li><strong>Send Credentials</strong> on <a href="${siteUrl}/admin/team" style="color: #1E3A5F;">/admin/team</a> &mdash; email any staff member a /register link so they pick their own password.</li>
      </ul>
    </div>

    <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 0 0 20px;">
      <p style="color: #1E3A5F; margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">New flags and filters</p>
      <ul style="color: #5A6A7A; margin: 0 0 0 18px; padding: 0; line-height: 1.7; font-size: 14px;">
        <li><strong>Needs email</strong> &mdash; amber flag on rows with a placeholder <code style="font-size: 12px;">@noemail.cvicc.org</code> address. These cannot be approved until a real email is set; the Approve button is server-blocked and the flag explains why.</li>
        <li><strong>Unreferred</strong> KPI chip &mdash; live count of members with no board sponsor on record; amber ring when the count is above zero. The Set Referrer dropdown is open to admin, moderator, and reviewer so anyone on staff can attribute them.</li>
        <li><strong>Show staff</strong> toggle &mdash; staff rows are hidden from the Members list by default. Totals (Total / Pending / Unpaid / Approved / Rejected / Deactivated / Unreferred) always exclude staff, so the numbers reflect paying members only.</li>
      </ul>
    </div>

    <div style="background: #FFFFFF; border: 1px solid #EDE6D3; border-radius: 8px; padding: 20px 24px; margin: 0 0 20px;">
      <p style="color: #1E3A5F; margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Rules of the road</p>
      <ul style="color: #5A6A7A; margin: 0 0 0 18px; padding: 0; line-height: 1.7; font-size: 14px;">
        <li><strong>Referrer required on every creation path</strong> &mdash; Add Member, Log Offline Payment, and Create from Square orphan all demand a referrer. No new unreferred rows via admin actions.</li>
        <li><strong>Superuser bootstrap</strong> &mdash; your two accounts are auto-provisioned as admin on cold start. To add another admin, send credentials from <a href="${siteUrl}/admin/team" style="color: #1E3A5F;">/admin/team</a>.</li>
        <li><strong>View As</strong> &mdash; an in-chat admin tool that previews the moderator and reviewer UI from your account. Client-side only, so it is a visual preview, not a true authorization switch.</li>
        <li><strong>Portal edits</strong> &mdash; board members can update their own referrals' contact info from <a href="${siteUrl}/portal" style="color: #1E3A5F;">/portal</a>. Nothing financial.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 28px 0 8px;">
      <a href="${siteUrl}/admin" style="display: inline-block; background: #D4A830; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">Open the Dashboard</a>
    </div>

    <p style="color: #5A6A7A; line-height: 1.7; margin: 24px 0 0; font-size: 13px;">
      Reply here if anything looks off or you want something moved.
    </p>
  </div>
  <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
      Central Valley Indian Chamber of Commerce, Inc.<br/>
      4610 W Jacquelyn Ave, Fresno, CA 93722
    </p>
  </div>
</div>`
export const adminUpdatePlainText = (name: string, email: string, siteUrl: string) => `CENTRAL VALLEY INDIAN CHAMBER OF COMMERCE
Admin Changelog

Hi ${name},

A brief tour of what has landed in the admin surface since the last pass. Nothing requires action from you — this is a map of the new buttons, flags, and scopes you will see the next time you sign in at ${siteUrl}/admin.

ROLES, SETTLED
- Admin (you): full control over everything.
- Moderator: finance team board members — Sonia, Roken, Surdeep, Rajinder, plus newly added Akash, Manreet, and R. Sidhu Buttar. They see all chamber members but can only Edit / Resend Welcome / Send Payment Link on members they referred. Buttons hide where they don't apply.
- Reviewer (Gigi): approve or deny pending members, set referrer on unreferred rows, read the list and overview. No finances, no editing, no deactivation.
- Member: unchanged.

NEW ROW ACTIONS
- Edit (pencil icon on each row): modal for name, email, phone, business, city, sector, tier. Admin edits anyone; moderators only their own referrals.
- Reactivate: restores a member deactivated by accident, without re-minting the membership number or re-sending the welcome email.
- Send Credentials on /admin/team: email any staff member a /register link so they pick their own password.

NEW FLAGS AND FILTERS
- Needs email: amber flag on rows with a placeholder @noemail.cvicc.org address. These cannot be approved until a real email is set; the Approve button is server-blocked.
- Unreferred KPI chip: live count of members with no board sponsor on record; amber ring when above zero. Set Referrer dropdown is open to admin, moderator, and reviewer.
- Show staff toggle: staff rows are hidden from the Members list by default. Totals (Total / Pending / Unpaid / Approved / Rejected / Deactivated / Unreferred) always exclude staff.

RULES OF THE ROAD
- Referrer required on every creation path: Add Member, Log Offline Payment, and Create from Square orphan all demand a referrer. No new unreferred rows via admin actions.
- Superuser bootstrap: your two accounts are auto-provisioned as admin on cold start. To add another admin, send credentials from /admin/team.
- View As: an in-chat admin tool that previews the moderator and reviewer UI from your account. Client-side only — a visual preview, not a true authorization switch.
- Portal edits: board members can update their own referrals' contact info from /portal. Nothing financial.

Open the Dashboard: ${siteUrl}/admin

Reply here if anything looks off or you want something moved.

Central Valley Indian Chamber of Commerce, Inc.
4610 W Jacquelyn Ave, Fresno, CA 93722
Sent to ${email}.`
