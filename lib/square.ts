const SQUARE_API_BASE = 'https://connect.squareup.com'
const SQUARE_VERSION = '2024-11-20'

export interface SquareMoney {
  amount: number
  currency: string
}

export interface SquareProcessingFee {
  effective_at?: string
  type?: string
  amount_money: SquareMoney
}

export interface SquareCardDetails {
  status?: string
  card?: {
    card_brand?: string
    last_4?: string
  }
}

export interface SquarePayment {
  id: string
  created_at: string
  updated_at?: string
  amount_money: SquareMoney
  total_money?: SquareMoney
  approved_money?: SquareMoney
  processing_fee?: SquareProcessingFee[]
  refunded_money?: SquareMoney
  status: string
  source_type?: string
  card_details?: SquareCardDetails
  buyer_email_address?: string
  order_id?: string
  receipt_number?: string
  receipt_url?: string
  note?: string
  shipping_address?: {
    first_name?: string
    last_name?: string
  }
  billing_address?: {
    first_name?: string
    last_name?: string
  }
}

export interface SquareOrder {
  id: string
  reference_id?: string
  customer_id?: string
  fulfillments?: Array<{
    shipment_details?: {
      recipient?: {
        display_name?: string
        email_address?: string
      }
    }
    pickup_details?: {
      recipient?: {
        display_name?: string
        email_address?: string
      }
    }
  }>
  tenders?: Array<{
    buyer_tender_reference?: string
    note?: string
  }>
}

interface SquareListPaymentsResponse {
  payments?: SquarePayment[]
  cursor?: string
  errors?: Array<{ code: string; detail: string }>
}

interface SquareRetrieveOrderResponse {
  order?: SquareOrder
  errors?: Array<{ code: string; detail: string }>
}

function requireToken(): string {
  const token = process.env.SQUARE_ACCESS_TOKEN
  if (!token) throw new Error('SQUARE_ACCESS_TOKEN is not configured. Add it to your environment variables.')
  return token
}

async function squareGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${SQUARE_API_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v)
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_VERSION,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Square API ${res.status} on ${path}: ${text}`)
  }

  return res.json() as Promise<T>
}

/**
 * Fetch all payments from Square, walking cursor pagination.
 * Optionally filter by begin_time / end_time (ISO strings) — omit to get everything.
 */
export async function fetchAllSquarePayments(options: {
  beginTime?: string
  endTime?: string
  locationId?: string
} = {}): Promise<SquarePayment[]> {
  const all: SquarePayment[] = []
  let cursor: string | undefined
  let iterations = 0
  const MAX_ITERATIONS = 100 // safety cap: 100 pages × 100 = 10k payments

  do {
    const page = await squareGet<SquareListPaymentsResponse>('/v2/payments', {
      begin_time: options.beginTime,
      end_time: options.endTime,
      location_id: options.locationId,
      cursor,
      limit: '100',
      sort_order: 'DESC',
    })

    if (page.errors && page.errors.length > 0) {
      throw new Error(`Square API errors: ${page.errors.map((e) => e.detail).join('; ')}`)
    }

    if (page.payments) all.push(...page.payments)
    cursor = page.cursor
    iterations++
  } while (cursor && iterations < MAX_ITERATIONS)

  return all
}

/**
 * Fetch a single order — used when the payment doesn't include buyer email
 * (Square Checkout Links attach the email to the order, not the payment).
 */
export async function fetchSquareOrder(orderId: string): Promise<SquareOrder | null> {
  try {
    const res = await squareGet<SquareRetrieveOrderResponse>(`/v2/orders/${orderId}`)
    if (res.errors && res.errors.length > 0) return null
    return res.order || null
  } catch {
    return null
  }
}

/**
 * Fetch one payment from Square by id. Used by the webhook to enrich the
 * lightweight event payload with the same shape sync uses (fees, refunds,
 * card details, receipt url).
 */
interface RetrievePaymentResponse {
  payment?: SquarePayment
  errors?: Array<{ code: string; detail: string }>
}
export async function fetchSquarePayment(paymentId: string): Promise<SquarePayment | null> {
  try {
    const res = await squareGet<RetrievePaymentResponse>(`/v2/payments/${paymentId}`)
    if (res.errors && res.errors.length > 0) return null
    return res.payment || null
  } catch {
    return null
  }
}

/**
 * Extract a normalized email address from a Square payment, falling back to the
 * order if necessary.
 */
export async function resolvePaymentEmail(p: SquarePayment): Promise<string | null> {
  if (p.buyer_email_address) return p.buyer_email_address.toLowerCase().trim()
  if (!p.order_id) return null
  const order = await fetchSquareOrder(p.order_id)
  if (!order) return null

  for (const f of order.fulfillments || []) {
    const email = f.shipment_details?.recipient?.email_address || f.pickup_details?.recipient?.email_address
    if (email) return email.toLowerCase().trim()
  }
  return null
}

/**
 * Extract a display name for the buyer.
 */
export async function resolvePaymentName(p: SquarePayment): Promise<string | null> {
  const fromShipping = p.shipping_address && [p.shipping_address.first_name, p.shipping_address.last_name].filter(Boolean).join(' ')
  if (fromShipping) return fromShipping.trim()
  const fromBilling = p.billing_address && [p.billing_address.first_name, p.billing_address.last_name].filter(Boolean).join(' ')
  if (fromBilling) return fromBilling.trim()

  if (!p.order_id) return null
  const order = await fetchSquareOrder(p.order_id)
  if (!order) return null

  for (const f of order.fulfillments || []) {
    const name = f.shipment_details?.recipient?.display_name || f.pickup_details?.recipient?.display_name
    if (name) return name.trim()
  }
  return null
}

export function sumProcessingFees(p: SquarePayment): number {
  if (!p.processing_fee || p.processing_fee.length === 0) return 0
  return p.processing_fee.reduce((sum, f) => sum + (f.amount_money?.amount || 0), 0)
}

async function squarePost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SQUARE_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_VERSION,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Square API ${res.status} on ${path}: ${text}`)
  }
  return res.json() as Promise<T>
}

interface SquarePaymentLink {
  id: string
  version: number
  url: string
  order_id?: string
}

interface CreatePaymentLinkResponse {
  payment_link?: SquarePaymentLink
  errors?: Array<{ code: string; detail: string }>
}

interface SquareLocation {
  id: string
  name?: string
  status?: string
}

interface ListLocationsResponse {
  locations?: SquareLocation[]
  errors?: Array<{ code: string; detail: string }>
}

// Cached inside the container so the "resolve my location id" round-trip
// only happens once per cold start. `null` is a valid negative cache to
// avoid re-hitting Square if the account genuinely has no active
// locations — that'd be a fatal misconfiguration, not a retryable case.
let cachedLocationId: string | null | undefined = undefined

/**
 * Return an active Square location ID for the connected account.
 * Prefers SQUARE_LOCATION_ID when set (explicit is safer for
 * multi-location merchants). Falls back to discovering one via
 * /v2/locations. For single-location merchants this is a safe default
 * because there's nothing to pick wrong.
 */
async function resolveLocationId(): Promise<string> {
  const fromEnv = process.env.SQUARE_LOCATION_ID?.trim()
  if (fromEnv) return fromEnv
  if (cachedLocationId) return cachedLocationId
  if (cachedLocationId === null) throw new Error('No active Square locations on this account.')

  const res = await squareGet<ListLocationsResponse>('/v2/locations')
  if (res.errors?.length) {
    throw new Error(`Square: ${res.errors.map((e) => e.detail).join('; ')}`)
  }
  const active = (res.locations || []).find((l) => (l.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
    || (res.locations || [])[0]
  if (!active?.id) {
    cachedLocationId = null
    throw new Error('No Square locations returned for this account.')
  }
  cachedLocationId = active.id
  return active.id
}

/**
 * Create a Square Checkout Link for a membership renewal. The note carries
 * `renew:<memberId>` so sync/webhook can extend expires_at on match.
 */
export async function createRenewalCheckoutLink(input: {
  memberName: string
  memberEmail: string
  memberId: string
  amountCents: number
  redirectUrl: string
}): Promise<SquarePaymentLink> {
  const locationId = await resolveLocationId()
  const body = {
    idempotency_key: `renew-${input.memberId}-${Date.now()}`,
    quick_pay: {
      name: `CVICC Membership Renewal — ${input.memberName}`.slice(0, 255),
      price_money: { amount: input.amountCents, currency: 'USD' },
      location_id: locationId,
    },
    checkout_options: {
      redirect_url: input.redirectUrl,
      ask_for_shipping_address: false,
    },
    pre_populated_data: { buyer_email: input.memberEmail },
    payment_note: `renew:${input.memberId}`,
  }
  const res = await squarePost<CreatePaymentLinkResponse>('/v2/online-checkout/payment-links', body)
  if (res.errors?.length) throw new Error(`Square: ${res.errors.map((e) => e.detail).join('; ')}`)
  if (!res.payment_link) throw new Error('Square did not return a payment link.')
  return res.payment_link
}

/**
 * Create a Square Checkout Link for a single ticket purchase. The order
 * `reference_id` embeds `event:<eventId>:<rsvpId>` so the Square-sync
 * job can tag the resulting payment as an event purchase.
 */
export async function createEventCheckoutLink(input: {
  name: string
  amountCents: number
  buyerEmail: string
  eventId: string
  rsvpId: string
  redirectUrl: string
}): Promise<SquarePaymentLink> {
  const locationId = await resolveLocationId()

  const body = {
    idempotency_key: `evt-${input.rsvpId}`,
    quick_pay: {
      name: input.name.slice(0, 255),
      price_money: { amount: input.amountCents, currency: 'USD' },
      location_id: locationId,
    },
    checkout_options: {
      redirect_url: input.redirectUrl,
      ask_for_shipping_address: false,
    },
    pre_populated_data: { buyer_email: input.buyerEmail },
    payment_note: `event:${input.eventId}:${input.rsvpId}`,
    // We would also like reference_id on the order to filter payments,
    // but quick_pay doesn't expose it — the note above is what sync reads.
  }

  const res = await squarePost<CreatePaymentLinkResponse>('/v2/online-checkout/payment-links', body)
  if (res.errors?.length) {
    throw new Error(`Square: ${res.errors.map((e) => e.detail).join('; ')}`)
  }
  if (!res.payment_link) throw new Error('Square did not return a payment link.')
  return res.payment_link
}

/**
 * Look up a payment link by id to verify a completed checkout on redirect.
 */
interface RetrievePaymentLinkResponse {
  payment_link?: SquarePaymentLink
  errors?: Array<{ code: string; detail: string }>
}
export async function fetchSquarePaymentLink(id: string): Promise<SquarePaymentLink | null> {
  try {
    const res = await squareGet<RetrievePaymentLinkResponse>(`/v2/online-checkout/payment-links/${id}`)
    return res.payment_link || null
  } catch {
    return null
  }
}
