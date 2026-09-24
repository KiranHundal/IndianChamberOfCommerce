'use client'

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Props {
  label: string
  sortKey: string
  activeKey: string | null
  dir: 'asc' | 'desc'
  onToggle: (key: string) => void
  align?: 'left' | 'right' | 'center'
  className?: string
}

/**
 * Column header th that toggles the parent table's sort on click. Shows a
 * dim double-chevron when inactive; the active column shows a single chevron
 * pointing in the current direction.
 */
export default function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onToggle,
  align = 'left',
  className = '',
}: Props) {
  const active = activeKey === sortKey
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''
  return (
    <th className={`px-4 py-2.5 text-[0.65rem] font-medium uppercase tracking-wide text-mid ${alignClass} ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-brand transition-colors ${justifyClass} ${active ? 'text-brand' : ''}`}
      >
        {label}
        {active ? (
          dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </th>
  )
}
