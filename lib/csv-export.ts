/**
 * Client-side CSV export helper. Serializes an array of records to a CSV
 * blob and triggers a browser download.
 *
 * Escapes double quotes, commas, and newlines the same way the server-side
 * report endpoints do, so files line up if the treasurer eyeballs both.
 *
 * Every table on /admin uses this via one shared "Export CSV" button so a
 * moderator can grab exactly the rows currently on screen (respecting
 * filters/search) without a round-trip to the server.
 */

export type CsvColumn<T> = {
  header: string
  get: (row: T) => string | number | null | undefined | boolean | Date
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString()
  const s = String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function rowsToCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const lines: string[] = []
  lines.push(columns.map((c) => escapeCell(c.header)).join(','))
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(c.get(row))).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv<T>(
  filename: string,
  rows: readonly T[],
  columns: readonly CsvColumn<T>[]
): void {
  if (typeof window === 'undefined') return
  const csv = rowsToCsv(rows, columns)
  // Prepend a BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
