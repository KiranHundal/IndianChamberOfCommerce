export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateRange(start: string, end?: string): string {
  const startFormatted = formatDate(start)
  if (!end) return startFormatted

  const s = new Date(start)
  const e = new Date(end)

  // Same day
  if (s.toDateString() === e.toDateString()) return startFormatted

  // Same month and year
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', { month: 'short' })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  }

  // Same year
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${s.getFullYear()}`
  }

  return `${startFormatted} – ${formatDate(end)}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
