/**
 * Single source of truth for board / leader headshot URLs.
 *
 * Used by the public /about/leadership page and by the admin UI as a
 * fallback when a board_members row has no photoUrl of its own (which is
 * the normal case for members added via seed rather than via a manual
 * upload). Manual uploads always win: the admin table renders the row's
 * photoUrl if present, then falls back to this map, then to a placeholder.
 *
 * Keys use a normalized form (lowercased, no titles, no middle names)
 * so it survives casing differences and honorific variations:
 *   "Dr. Surdeep Singh" and "Surdeep Singh" both hit "surdeep singh"
 *   "Manreet Singh Sandhu" and "Manreet Sandhu" both hit "manreet sandhu"
 *   "Akash Singhal" and "Akash Singal" both hit "akash sing"
 */

const HEADSHOTS: Record<string, string> = {
  'sonia heer': '/headshots/sonia1.png',
  'surdeep singh': '/headshots/surdeep1.png',
  'rajinder kumar': '/headshots/rajinder-kumar.jpg',
  'kiran hundal': '/headshots/KiranH.jpg',
  'roken bhatt': '/headshots/Roken1.png',
  'manreet sandhu': '/headshots/manreet-sandhu.jpg',
  'akash sing': '/headshots/Akash1.png',
}

const HONORIFICS = new Set(['dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'prof', 'prof.'])

function normalize(name: string): string {
  const tokens = name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => !HONORIFICS.has(t))
  if (tokens.length <= 2) return tokens.join(' ')
  // Three-token names like "Manreet Singh Sandhu" collapse to "Manreet Sandhu"
  // (drop the middle) since almost every South Asian name here uses the
  // middle name as a religious marker rather than an identifier.
  return `${tokens[0]} ${tokens[tokens.length - 1]}`
}

function trimSurname(name: string): string {
  // "Akash Singhal" and "Akash Singal" both partially match "akash sing".
  // We generate a shortened key by clipping the surname to its first 4 chars
  // so a two-token normalized name can hit the "akash sing" style entry.
  const tokens = name.trim().split(/\s+/)
  if (tokens.length < 2) return name.trim()
  const last = tokens[tokens.length - 1]
  return `${tokens[0]} ${last.slice(0, 4)}`
}

/**
 * Look up a headshot URL by display name. Returns null when nothing matches.
 * Never throws — safe to call on user-entered names.
 */
export function headshotFor(name: string | null | undefined): string | null {
  if (!name) return null
  const norm = normalize(name)
  if (HEADSHOTS[norm]) return HEADSHOTS[norm]
  const trimmed = trimSurname(norm)
  if (HEADSHOTS[trimmed]) return HEADSHOTS[trimmed]
  return null
}
