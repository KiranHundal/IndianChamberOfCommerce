import Anthropic from '@anthropic-ai/sdk'

/**
 * Claude vision extraction for receipt / invoice images (or PDFs).
 * Returns best-effort structured data plus a per-field confidence tier,
 * or an {error} object when the image isn't a readable receipt.
 *
 * We use the public Vercel Blob URL as the image source so there's no
 * round-trip through base64 — the Blob URL is private-looking (hard-to-
 * guess UUID path) but publicly fetchable, which is enough for Claude's
 * vision input and matches the pattern used for board photos.
 */

export type ReceiptExtraction = {
  vendor: string
  amount: number
  expenseDate: string
  category: string
  description: string
  paymentMethod: string | null
  confidence: Partial<Record<'vendor' | 'amount' | 'expenseDate' | 'category' | 'description' | 'paymentMethod', 'high' | 'medium' | 'low'>>
}

export type ReceiptError = { error: string }

export const EXPENSE_CATEGORIES = [
  'Office supplies',
  'Software',
  'Food & beverage',
  'Travel',
  'Events',
  'Marketing',
  'Professional services',
  'Utilities',
  'Rent',
  'Membership',
  'Equipment',
  'Other',
] as const

const SYSTEM_PROMPT = `You are a receipt-parsing assistant for the Central Valley Indian Chamber of Commerce bookkeeping system. Given an image of a receipt, invoice, or payment confirmation, extract the fields below and return them as a single JSON object. Return nothing but the JSON — no prose, no markdown fences, no comments.

Fields:
- vendor (string): the merchant / payee name. Short form, no legal suffix (drop "Inc", "LLC"), no address lines.
- amount (integer): the total paid in WHOLE US DOLLARS (round to nearest). This is the final grand total AFTER tax and tip — never a subtotal.
- expenseDate (string): the transaction date on the receipt, formatted YYYY-MM-DD. If multiple dates exist, prefer the transaction / purchase date over the print date.
- category (string): best-guess from this exact list → ${EXPENSE_CATEGORIES.join(' | ')}.
- description (string): one short line describing what was bought, 60 chars or less. Make it informative, not generic.
- paymentMethod (string | null): one of "check", "zelle", "cash", "card", "square", "other" if clearly indicated on the receipt, else null.
- confidence (object): for each of the six fields above, "high" | "medium" | "low" based on how legible/clear that specific value was. Low confidence = reviewer should double-check.

If the image is not a receipt / invoice (e.g. a selfie, a landscape, blank, unreadable), instead return a single object: {"error": "short reason"}.

Return ONLY valid JSON. No code block, no explanation.`

let anthropicClient: Anthropic | null = null
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY env var is not set — receipt OCR unavailable until it is configured on Vercel.')
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

/**
 * Call Claude vision with a receipt image URL and return structured data.
 * Throws if the API fails or the model returns unparsable output.
 */
export async function extractReceiptFromUrl(imageUrl: string): Promise<ReceiptExtraction | ReceiptError> {
  const client = getClient()

  const response = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    output_config: { effort: 'low' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: 'Extract the receipt fields and return the JSON object.' },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : ''
  if (!raw) {
    throw new Error('Model returned no text — try a clearer image.')
  }

  // Strip accidental markdown code fences if the model slipped one in
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Could not parse model response as JSON: ${cleaned.slice(0, 200)}`)
  }

  if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
    return { error: String((parsed as { error: unknown }).error) }
  }

  // Light shape validation — reject bogus payloads early
  const p = parsed as Partial<ReceiptExtraction>
  if (typeof p.vendor !== 'string' || typeof p.amount !== 'number' || typeof p.expenseDate !== 'string') {
    throw new Error('Model response missing required fields (vendor / amount / expenseDate).')
  }

  // Coerce amount to a positive integer; model should already do this but belt + suspenders
  const amount = Math.max(0, Math.round(Number(p.amount) || 0))

  return {
    vendor: p.vendor.trim(),
    amount,
    expenseDate: p.expenseDate.trim(),
    category: typeof p.category === 'string' && (EXPENSE_CATEGORIES as readonly string[]).includes(p.category)
      ? p.category
      : 'Other',
    description: typeof p.description === 'string' ? p.description.trim().slice(0, 200) : '',
    paymentMethod: typeof p.paymentMethod === 'string' && p.paymentMethod ? p.paymentMethod : null,
    confidence: typeof p.confidence === 'object' && p.confidence ? p.confidence as ReceiptExtraction['confidence'] : {},
  }
}
