'use client'

import { Download } from 'lucide-react'
import { downloadCsv, CsvColumn } from '@/lib/csv-export'

interface Props<T> {
  filename: string
  rows: readonly T[]
  columns: readonly CsvColumn<T>[]
  label?: string
  className?: string
  disabled?: boolean
}

/**
 * Small button that pours the given rows/columns into a CSV file and
 * triggers a browser download. Uses the same visual weight as the other
 * secondary buttons in the admin shell.
 */
export default function ExportCsvButton<T>({
  filename,
  rows,
  columns,
  label = 'Export CSV',
  className = '',
  disabled = false,
}: Props<T>) {
  const isEmpty = rows.length === 0
  return (
    <button
      type="button"
      onClick={() => {
        if (!isEmpty && !disabled) downloadCsv(filename, rows, columns)
      }}
      disabled={disabled || isEmpty}
      title={isEmpty ? 'Nothing to export' : `Download ${rows.length} row${rows.length === 1 ? '' : 's'} as CSV`}
      className={`inline-flex items-center gap-1.5 bg-white border border-ivory-200 text-brand text-xs font-medium px-3 py-1.5 rounded hover:border-accent/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-accent" />
      {label}
    </button>
  )
}
