import { db } from './db'
import { sql } from 'drizzle-orm'

/**
 * One-shot bulk import of the ~55 CVICC members onboarded outside the
 * public /join form (collected by board members via Zelle, check, cash,
 * or the chamber's old Square page) during the Sept-Oct 2026 founding
 * cohort drive.
 *
 * Data provided by admin on 2026-10-22. Status = 'approved' for all —
 * they've paid; this is just getting them into the DB so they appear in
 * /admin/members, Finances totals, and referrer attribution.
 *
 * Idempotency comes from TWO layers:
 *   1. Module-level `seedRan` flag so a single container only runs the
 *      loop once per cold start.
 *   2. INSERT OR IGNORE on each row — email UNIQUE constraint + a
 *      deterministic `seed-cb-<slug>` primary key — so even across cold
 *      starts the data level stays safe.
 *
 * Flagging (surfaced via the returned report + console.log):
 *   - Missing email → placeholder `cb-<slug>@noemail.cvicc.org` so the
 *     UNIQUE constraint still works; admin greps for this host to find
 *     records that need a real email.
 *   - Duplicate email collisions in the source data → noted in the data
 *     array and reported; INSERT OR IGNORE drops the second row at runtime.
 */

type Tier = 'individual' | 'corporate'
type PayMethod = 'zelle' | 'check' | 'cash' | 'square' | 'other'
type ReferrerSlug = 'sonia' | 'surdeep' | 'akash' | 'rajinder'

interface SeedMember {
  slug: string
  name: string
  email: string | null
  phone: string | null
  businessName: string | null
  sector: string | null
  tier: Tier
  amount: number
  method: PayMethod
  reference: string | null
  referrer: ReferrerSlug
  note?: string
}

const REFERRER_LIKE: Record<ReferrerSlug, string> = {
  sonia: '%sonia%heer%',
  surdeep: '%surdeep%singh%',
  akash: '%akash%sing%',
  rajinder: '%rajinder%kumar%',
}

const MEMBERS: SeedMember[] = [
  // ── Sonia Heer — 20 referrals ──────────────────────────────────────
  { slug: 'tajinder-virk',       referrer: 'sonia', name: 'Tajinder Virk',       email: 'tajinderk00@gmail.com',   phone: '+1-559-214-7490', businessName: null, sector: null,              tier: 'individual', amount: 95,  method: 'zelle', reference: null },
  { slug: 'manreet-ladhar',      referrer: 'sonia', name: 'Manreet Ladhar',      email: 'manreetladhar@gmail.com', phone: '559-352-7617',    businessName: null, sector: null,              tier: 'corporate',  amount: 395, method: 'other', reference: 'paid (method n/a)' },
  { slug: '5911-investments',    referrer: 'sonia', name: '5911 Investments Inc',email: null,                      phone: null,              businessName: '5911 Investments Inc',  sector: 'Finance',        tier: 'corporate',  amount: 395, method: 'check', reference: null, note: 'missing email & phone' },
  { slug: 'jag-bains',           referrer: 'sonia', name: 'Jag Bains',           email: 'jagadalic@gmail.com',     phone: '+1-559-270-4198', businessName: null, sector: null,              tier: 'corporate',  amount: 375, method: 'zelle', reference: null, note: '$375 (short of $395 by $20)' },
  { slug: 'raja-rani-cuisine',   referrer: 'sonia', name: 'Raja Rani Cuisine',   email: 'kullvirsekhon@gmail.com', phone: '+1-559-860-9192', businessName: 'Raja Rani Cuisine',      sector: 'Food & Beverage',tier: 'corporate',  amount: 395, method: 'cash',  reference: 'Buyer: Kullvir Sekhon' },
  { slug: 'mandeep-sandhu',      referrer: 'sonia', name: 'Mandeep Sandhu',      email: 'msandhu07@yahoo.com',     phone: '+1-559-289-4772', businessName: null, sector: null,              tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'sms-construction',    referrer: 'sonia', name: 'SMS Construction',    email: 'manreetladhar@gmail.com', phone: '559-352-7617',    businessName: 'SMS Construction',       sector: 'Construction',   tier: 'corporate',  amount: 395, method: 'check', reference: null, note: 'DUPLICATE email with Manreet Ladhar — INSERT will drop; needs its own contact' },
  { slug: 'raja-rani-banquet',   referrer: 'sonia', name: 'Raja Rani Indian Banquet', email: null,                 phone: null,              businessName: 'Raja Rani Indian Banquet',sector: 'Hospitality',   tier: 'corporate',  amount: 395, method: 'check', reference: null, note: 'missing email & phone' },
  { slug: 'royal-gardens',       referrer: 'sonia', name: 'Royal Gardens Inc',   email: null,                      phone: '+1-559-240-0728', businessName: 'Royal Gardens Inc',      sector: 'Hospitality',    tier: 'corporate',  amount: 395, method: 'check', reference: null, note: 'missing email' },
  { slug: 'curry-pizza',         referrer: 'sonia', name: 'Curry Pizza',         email: null,                      phone: null,              businessName: 'Curry Pizza',            sector: 'Food & Beverage',tier: 'corporate',  amount: 395, method: 'check', reference: null, note: 'missing email & phone' },
  { slug: 'desi-pizza-bites',    referrer: 'sonia', name: 'Desi Pizza Bites',    email: 'malhi@currypizza.com',    phone: '559-392-1185',    businessName: 'Desi Pizza Bites',       sector: 'Food & Beverage',tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'js-insurance',        referrer: 'sonia', name: 'JS Insurance',        email: 'bop@jsinghagency.com',    phone: '559-277-5580',    businessName: 'JS Insurance',           sector: 'Finance',        tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'jones-cleaners',      referrer: 'sonia', name: 'Jones Cleaners',      email: 'nrip@jonescleaning.com',  phone: '+1-209-200-9136', businessName: 'Jones Cleaners',         sector: 'Services',       tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'gulab',               referrer: 'sonia', name: 'Gulab',               email: null,                      phone: '+1-808-675-6058', businessName: 'Gulab',                  sector: null,             tier: 'corporate',  amount: 495, method: 'check', reference: null, note: 'missing email; $495 (above corporate — extra contribution)' },
  { slug: 'chatore',             referrer: 'sonia', name: 'Chatore',             email: null,                      phone: '+1-559-579-0031', businessName: 'Chatore',                sector: 'Food & Beverage',tier: 'corporate',  amount: 395, method: 'check', reference: null, note: 'missing email' },
  { slug: 'bhatt-associates',    referrer: 'sonia', name: 'Bhatt & Associates',  email: 'roken@bhattcpa.org',      phone: '+1-559-999-3239', businessName: 'Bhatt & Associates',     sector: 'Legal',          tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'tandoori-pizza',      referrer: 'sonia', name: 'Tandoori Pizza',      email: '0811singh@gmail.com',     phone: '+1-559-824-0027', businessName: 'Tandoori Pizza',         sector: 'Food & Beverage',tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'regency-event',       referrer: 'sonia', name: 'Regency Event Center',email: 'booking@regencyevent.com',phone: '+1-559-274-8033', businessName: 'Regency Event Center',   sector: 'Hospitality',    tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'aroza',               referrer: 'sonia', name: 'Aroza',               email: 'rachnagandhi99@gmail.com',phone: '+1-559-770-3725', businessName: 'Aroza',                  sector: null,             tier: 'corporate',  amount: 395, method: 'check', reference: null },
  { slug: 'eddies-bakery',       referrer: 'sonia', name: "Eddie's Bakery",      email: 'eddiesbakery39@gmail.com',phone: '+1-209-200-9136', businessName: "Eddie's Bakery",         sector: 'Food & Beverage',tier: 'corporate',  amount: 395, method: 'check', reference: null, note: 'phone shared with Jones Cleaners (likely same owner)' },

  // ── Dr. Surdeep Singh — 15 referrals ───────────────────────────────
  { slug: 'harpreet-nahal',      referrer: 'surdeep', name: 'Harpreet Kaur Nahal', email: 'harpnahal93@gmail.com',      phone: '209-206-5300', businessName: null, sector: 'Healthcare', tier: 'individual', amount: 195, method: 'check', reference: 'combined check' },
  { slug: 'rahul-golani',        referrer: 'surdeep', name: 'Rahul Golani',        email: 'rahulgolani3@gmail.com',     phone: '310-447-5281', businessName: null, sector: null,         tier: 'individual', amount: 95,  method: 'check', reference: 'combined check' },
  { slug: 'shiv-charan',         referrer: 'surdeep', name: 'Shiv Charan',         email: 'shiv.charan19@gmail.com',    phone: '559-601-9026', businessName: null, sector: null,         tier: 'individual', amount: 195, method: 'check', reference: 'combined check' },
  { slug: 'clovis-family-dental',referrer: 'surdeep', name: 'Clovis Family Dentistry', email: 'info@clovisfamilydentistry.com', phone: '559-708-9099', businessName: 'Clovis Family Dentistry', sector: 'Healthcare', tier: 'corporate', amount: 495, method: 'check', reference: null, note: '$495 (above corporate)' },
  { slug: 'kingsburg-family-dental', referrer: 'surdeep', name: 'Kingsburg Family Dentistry', email: 'kingsburgdentistry@gmail.com', phone: '559-897-2600', businessName: 'Kingsburg Family Dentistry', sector: 'Healthcare', tier: 'corporate', amount: 495, method: 'check', reference: null, note: '$495 (above corporate)' },
  { slug: 'my-559-dentist',      referrer: 'surdeep', name: 'My 559 Dentist',      email: 'drsingh@my559dentist.com',   phone: '559-708-9099', businessName: 'My 559 Dentist', sector: 'Healthcare', tier: 'corporate', amount: 480, method: 'check', reference: null, note: 'phone shared with Clovis Family Dentistry (same owner); $480 (just under $495)' },
  { slug: 'mohita-sharma',       referrer: 'surdeep', name: 'Mohita Sharma',       email: 'drmohitadds@gmail.com',      phone: '209-889-5416', businessName: null, sector: 'Healthcare', tier: 'individual', amount: 95,  method: 'zelle', reference: null },
  { slug: 'majinder-singh',      referrer: 'surdeep', name: 'Majinder Singh',      email: 'manjinderkadola@yahoo.com',  phone: '559-905-1539', businessName: null, sector: null,         tier: 'corporate',  amount: 395, method: 'check', reference: 'combined check' },
  { slug: 'gursimran-singh',     referrer: 'surdeep', name: 'Gursimran Singh',     email: 'singhgursimran1777@gmail.com',phone: '510-365-9407',businessName: null, sector: null,         tier: 'individual', amount: 95,  method: 'zelle', reference: null },
  { slug: 'sanaz-akbari',        referrer: 'surdeep', name: 'Sanaz Akbari',        email: 'drsanakbari@gmail.com',      phone: '559-293-8066', businessName: null, sector: 'Healthcare', tier: 'individual', amount: 95,  method: 'zelle', reference: null },
  { slug: 'radhika-narayan',     referrer: 'surdeep', name: 'Radhika Narayan',     email: 'dr.radhikanarayan@gmail.com',phone: '973-580-7789', businessName: null, sector: 'Healthcare', tier: 'individual', amount: 95,  method: 'zelle', reference: null },
  { slug: 'prabhjot-kaur',       referrer: 'surdeep', name: 'Prabhjot Kaur',       email: 'dentistprabhjot@gmail.com',  phone: '618-600-4947', businessName: null, sector: 'Healthcare', tier: 'individual', amount: 95,  method: 'zelle', reference: null },
  { slug: 'timex-solutions',     referrer: 'surdeep', name: 'Timex Solutions',     email: 'team@timexsolutioninc.com',  phone: '279-224-4025', businessName: 'Timex Solutions', sector: 'Technology', tier: 'corporate', amount: 395, method: 'square', reference: 'via chamber website' },
  { slug: 'anmol-freight',       referrer: 'surdeep', name: 'Anmol Freight Cargo', email: null,                         phone: null,           businessName: 'Anmol Freight Cargo', sector: 'Transportation', tier: 'individual', amount: 95,  method: 'zelle', reference: null, note: 'missing email & phone; admin flagged "not from my list"' },
  { slug: 'surdeep-dental-group',referrer: 'surdeep', name: 'Surdeep Dental Group Of Clovis Inc', email: 'manager.clovisfamilydentistry@gmail.com', phone: '559-840-4330', businessName: 'Surdeep Dental Group Of Clovis Inc', sector: 'Healthcare', tier: 'corporate', amount: 495, method: 'check', reference: null, note: '$495 (above corporate)' },

  // ── Akash Singhal — 10 referrals (all missing contact info) ────────
  { slug: 'freight-forward-logistics', referrer: 'akash', name: 'Freight Forward Logistics', email: null, phone: null, businessName: 'Freight Forward Logistics', sector: 'Transportation', tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'youngft',             referrer: 'akash', name: 'YoungFT',             email: null, phone: null, businessName: 'YoungFT',                        sector: null,              tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'msv-trans',           referrer: 'akash', name: 'MSV Trans Inc',       email: null, phone: null, businessName: 'MSV Trans Inc',                  sector: 'Transportation', tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'choudhary-transport', referrer: 'akash', name: 'Choudhary Transport Inc', email: null, phone: null, businessName: 'Choudhary Transport Inc',    sector: 'Transportation', tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'jhd-trans',           referrer: 'akash', name: 'JHD Trans Inc',       email: null, phone: null, businessName: 'JHD Trans Inc',                  sector: 'Transportation', tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'faith-truck-repair',  referrer: 'akash', name: 'Faith Truck And Trailer Repair', email: null, phone: null, businessName: 'Faith Truck And Trailer Repair', sector: 'Services', tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'harsh-ruhil-estate',  referrer: 'akash', name: 'Harsh Ruhil Estate',  email: null, phone: null, businessName: 'Harsh Ruhil Estate',             sector: 'Real Estate',    tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'khusi-truck-wash',    referrer: 'akash', name: 'Khusi Truck And Trailer Wash', email: null, phone: null, businessName: 'Khusi Truck And Trailer Wash', sector: 'Services', tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'mountac-freight',     referrer: 'akash', name: 'Mountac Freight Cargo', email: null, phone: null, businessName: 'Mountac Freight Cargo',         sector: 'Transportation', tier: 'individual', amount: 95, method: 'zelle',  reference: null, note: 'missing email & phone' },
  { slug: 'riya-sharma',         referrer: 'akash', name: 'Riya Sharma',         email: null, phone: null, businessName: null,                             sector: null,              tier: 'individual', amount: 95, method: 'square', reference: 'via chamber website', note: 'missing email & phone' },

  // ── Rajinder Kumar — 9 referrals ($1,155 per his tracker) ──────────
  { slug: 'amar-daroch',         referrer: 'rajinder', name: 'Amar Daroch',         email: 'amardaroch@yahoo.com',       phone: '559-905-6217',   businessName: null, sector: null,     tier: 'individual', amount: 95,  method: 'zelle',  reference: null, note: 'business owner; joined to support cause only' },
  { slug: 'kamaldeep-singh',     referrer: 'rajinder', name: 'Kamaldeep Singh',     email: 'kamaldeep2129@gmail.com',    phone: '+1-559-940-9013', businessName: null, sector: null,     tier: 'individual', amount: 95,  method: 'zelle',  reference: null, note: 'business partner declined business signup' },
  { slug: 'rajinder-kumar-self', referrer: 'rajinder', name: 'Rajinder Kumar',      email: 'rajinder.kumar@ml.co',       phone: '559-479-0049',    businessName: null, sector: 'Finance',tier: 'individual', amount: 95,  method: 'zelle',  reference: null, note: 'self-referral (board member paying own dues); will upgrade to corporate next year' },
  { slug: 'phillip-brown',       referrer: 'rajinder', name: 'Phillip Brown',       email: 'phillip.brown2@ml.com',      phone: '+1-510-847-6962', businessName: null, sector: 'Finance',tier: 'individual', amount: 95,  method: 'square', reference: 'via chamber website', note: 'will join as corporate next year (bank reimbursement)' },
  { slug: 'nicholas-phillips',   referrer: 'rajinder', name: 'Nicholas Phillips',   email: 'nphillips@ch-law.com',       phone: '+1-612-468-8888', businessName: null, sector: 'Legal',  tier: 'individual', amount: 95,  method: 'square', reference: 'via chamber website', note: 'will join as corporate next year (bank reimbursement)' },
  { slug: 'herman-chatrath',     referrer: 'rajinder', name: 'Herman S Chatrath',   email: 'hchatrath@ch-law.com',       phone: '+1-559-805-3620', businessName: null, sector: 'Legal',  tier: 'individual', amount: 95,  method: 'square', reference: 'via chamber website', note: 'will join as corporate next year (bank reimbursement)' },
  { slug: 'deepak-malhotra',     referrer: 'rajinder', name: 'Deepak Malhotra',     email: 'malhotra.student@gmail.com', phone: '559-578-5194',    businessName: null, sector: 'Healthcare', tier: 'individual', amount: 95, method: 'square', reference: 'via chamber website', note: 'VA hospital employee' },
  { slug: 'ankush-jassi',        referrer: 'rajinder', name: 'Ankush Jassi',        email: 'ankushjassi.9@gmail.com',    phone: '559-455-8347',    businessName: null, sector: null,     tier: 'individual', amount: 95,  method: 'square', reference: 'via chamber website', note: "international student; won't upgrade to corporate" },
  { slug: 'fadehub-inc',         referrer: 'rajinder', name: 'FadeHub Inc',         email: 'buntysarhali@gmail.com',     phone: '559-412-0951',    businessName: 'FadeHub Inc', sector: null, tier: 'corporate',  amount: 395, method: 'square', reference: 'Buyer: Baljit Kumar; via chamber website' },
]

export interface ChamberBatchReport {
  totalInData: number
  inserted: number
  skipped: number
  skippedReasons: Array<{ slug: string; email: string | null; reason: string }>
  missingEmail: Array<{ slug: string; name: string; placeholderEmail: string }>
  duplicateEmails: Array<{ slug: string; name: string; email: string; collidesWithSlug: string }>
  notes: Array<{ slug: string; name: string; note: string }>
  alreadyRanThisContainer: boolean
}

let seedRan = false

function esc(s: string | null): string {
  if (s === null) return 'NULL'
  return `'${s.replace(/'/g, "''")}'`
}

export async function seedChamberBatchV1(): Promise<ChamberBatchReport> {
  const report: ChamberBatchReport = {
    totalInData: MEMBERS.length,
    inserted: 0,
    skipped: 0,
    skippedReasons: [],
    missingEmail: [],
    duplicateEmails: [],
    notes: [],
    alreadyRanThisContainer: seedRan,
  }

  if (seedRan) return report

  // Detect in-data duplicate emails up front for the report.
  const byEmail: Record<string, string> = {}
  for (const m of MEMBERS) {
    if (!m.email) continue
    const e = m.email.trim().toLowerCase()
    if (byEmail[e]) {
      report.duplicateEmails.push({ slug: m.slug, name: m.name, email: e, collidesWithSlug: byEmail[e] })
    } else {
      byEmail[e] = m.slug
    }
  }

  // Start assigning membership numbers from (current max + 1). Use a
  // large seed base so even if the max-fetch fails we don't collide
  // with the existing 50-ish rows.
  let maxNum = 1000
  try {
    const result = await db.run(sql.raw(`
      SELECT CAST(COALESCE(MAX(CAST(membership_number AS INTEGER)), 0) AS INTEGER) AS m
      FROM members
      WHERE membership_number IS NOT NULL
    `)) as unknown as { rows?: Array<{ m?: number | null } | [number]> }
    const row = result.rows?.[0] as { m?: number | null } | [number] | undefined
    if (Array.isArray(row) && typeof row[0] === 'number') {
      maxNum = Math.max(maxNum, row[0])
    } else if (row && typeof (row as { m?: number | null }).m === 'number') {
      maxNum = Math.max(maxNum, (row as { m: number }).m)
    }
  } catch (e) {
    console.warn('seedChamberBatchV1: max membership_number scan failed; using base 1000:', e)
  }

  const nowCast = `CAST(strftime('%s', 'now') AS INTEGER)`

  for (const m of MEMBERS) {
    const { emailToUse, isPlaceholder } = (() => {
      if (m.email && m.email.trim()) {
        return { emailToUse: m.email.trim().toLowerCase(), isPlaceholder: false }
      }
      return { emailToUse: `cb-${m.slug}@noemail.cvicc.org`, isPlaceholder: true }
    })()

    if (isPlaceholder) {
      report.missingEmail.push({ slug: m.slug, name: m.name, placeholderEmail: emailToUse })
    }
    if (m.note) {
      report.notes.push({ slug: m.slug, name: m.name, note: m.note })
    }

    const nextNum = String(++maxNum).padStart(4, '0')
    const seedId = `seed-cb-${m.slug}`
    const refParts: string[] = []
    if (m.reference) refParts.push(m.reference)
    refParts.push(`[seed:chamber-batch-v1 ref:${m.referrer}]`)
    if (isPlaceholder) refParts.push('[NEEDS EMAIL]')
    const refString = refParts.join(' · ')

    try {
      await db.run(sql.raw(`
        INSERT OR IGNORE INTO members (
          id, email, password_hash, name, phone, business_name, city, sector,
          membership_tier, status, role, membership_number,
          created_at, approved_at,
          payment_method, amount_paid, payment_reference, payment_date,
          referred_by
        ) VALUES (
          '${seedId}',
          ${esc(emailToUse)},
          '',
          ${esc(m.name)},
          ${esc(m.phone)},
          ${esc(m.businessName)},
          NULL,
          ${esc(m.sector)},
          '${m.tier}',
          'approved',
          'member',
          '${nextNum}',
          ${nowCast},
          ${nowCast},
          '${m.method}',
          ${m.amount},
          ${esc(refString)},
          ${nowCast},
          (SELECT id FROM board_members WHERE lower(trim(name)) LIKE '${REFERRER_LIKE[m.referrer]}' LIMIT 1)
        )
      `))
      report.inserted++
    } catch (e) {
      maxNum--
      const reason = e instanceof Error ? e.message : String(e)
      report.skipped++
      report.skippedReasons.push({ slug: m.slug, email: emailToUse, reason })
      console.error(`seedChamberBatchV1 insert failed for ${m.slug} (${emailToUse}):`, reason)
    }
  }

  seedRan = true
  console.log('seedChamberBatchV1 complete:', JSON.stringify({
    inserted: report.inserted,
    skipped: report.skipped,
    missingEmail: report.missingEmail.length,
    duplicateEmails: report.duplicateEmails.length,
  }))
  return report
}
