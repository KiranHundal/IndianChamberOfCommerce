'use client'

import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

interface Result<T> {
  sortedRows: T[]
  sortKey: string | null
  sortDir: SortDir
  toggleSort: (key: string) => void
  setSort: (key: string, dir: SortDir) => void
}

/**
 * Small hook for sortable table columns. Handles strings, numbers, dates
 * (comparable via Date.parse), null/undefined (always at bottom), and
 * booleans. Sort key is a string identifier — you provide a `getters` map
 * from key → (row) => value.
 *
 * Toggle behavior mirrors what people expect from Linear/Notion/Jira:
 * - First click on a new key sorts ascending
 * - Second click on the same key flips to descending
 * - Third click clears the sort
 */
export function useSortable<T>(
  rows: readonly T[],
  getters: Record<string, (row: T) => string | number | null | undefined | boolean | Date>,
  defaults?: { key?: string; dir?: SortDir }
): Result<T> {
  const [sortKey, setSortKey] = useState<string | null>(defaults?.key ?? null)
  const [sortDir, setSortDir] = useState<SortDir>(defaults?.dir ?? 'asc')

  function normalize(v: string | number | null | undefined | boolean | Date): number | string {
    if (v === null || v === undefined) return Number.POSITIVE_INFINITY // always last
    if (v instanceof Date) return v.getTime() || Number.POSITIVE_INFINITY
    if (typeof v === 'boolean') return v ? 1 : 0
    if (typeof v === 'string') {
      // Attempt to detect date strings
      const parsed = Date.parse(v)
      if (!isNaN(parsed) && /^\d{4}-\d{2}-\d{2}/.test(v)) return parsed
      return v.toLowerCase()
    }
    return v
  }

  const sortedRows = useMemo(() => {
    if (!sortKey || !getters[sortKey]) return [...rows]
    const g = getters[sortKey]
    const arr = [...rows]
    arr.sort((a, b) => {
      const va = normalize(g(a))
      const vb = normalize(g(b))
      if (va === vb) return 0
      if (va === Number.POSITIVE_INFINITY) return 1
      if (vb === Number.POSITIVE_INFINITY) return -1
      const cmp = va < vb ? -1 : 1
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [rows, sortKey, sortDir, getters])

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortKey(null)
        setSortDir('asc')
      }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function setSort(key: string, dir: SortDir) {
    setSortKey(key)
    setSortDir(dir)
  }

  return { sortedRows, sortKey, sortDir, toggleSort, setSort }
}
