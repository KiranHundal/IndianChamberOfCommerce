/**
 * Fuzzy match helpers used to suggest which member a Square orphan payment
 * probably belongs to when the emails don't match up exactly.
 */

const COMPANY_SUFFIXES = /\s+(llc|inc|corp|corporation|co|ltd|limited|group|foundation|association|assn|company|associates)\.?$/i

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(COMPANY_SUFFIXES, '')
}

export function nameTokens(name?: string | null): string[] {
  if (!name) return []
  return normalize(name)
    .split(/[\s.,\-_/]+/)
    .map((t) => t.replace(/[^a-z0-9]+/g, ''))
    .filter((t) => t.length > 1)
}

/**
 * Jaccard similarity between two token sets — intersection / union.
 * Returns 0..1.
 */
export function jaccardScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  setA.forEach((t) => { if (setB.has(t)) intersection++ })
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : intersection / union
}

/**
 * Given an orphan Square payment's buyer name and (optional) member name to
 * compare against, return a 0..1 confidence score. Also considers the member's
 * business name so "Bob Smith paid via Bob's Truck LLC" still lines up.
 */
export function nameSimilarity(
  buyerName: string | null,
  buyerEmail: string | null,
  memberName: string,
  memberBusinessName: string | null | undefined,
  memberEmail: string,
): number {
  const buyerNameTokens = nameTokens(buyerName)
  const memberNameTokens = [...nameTokens(memberName), ...nameTokens(memberBusinessName || null)]

  const nameScore = jaccardScore(buyerNameTokens, memberNameTokens)

  // Local-part email match — if emails share the local part, that's a strong signal
  // even when the domain differs (jane@work.com vs jane@personal.com).
  let emailScore = 0
  if (buyerEmail && memberEmail) {
    const buyerLocal = buyerEmail.split('@')[0]?.toLowerCase() || ''
    const memberLocal = memberEmail.split('@')[0]?.toLowerCase() || ''
    if (buyerLocal && memberLocal && buyerLocal === memberLocal) emailScore = 0.9
    else if (buyerLocal && memberLocal && buyerLocal.length > 3 && memberLocal.length > 3) {
      if (buyerLocal.includes(memberLocal) || memberLocal.includes(buyerLocal)) emailScore = 0.6
    }
  }

  return Math.max(nameScore, emailScore)
}
