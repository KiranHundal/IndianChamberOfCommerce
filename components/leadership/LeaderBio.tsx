import type { Leadership } from '@/lib/types'

interface BioBlock {
  children?: Array<{ text?: string }>
}

interface Props {
  leader: Leadership
  className?: string
}

export default function LeaderBio({ leader, className = '' }: Props) {
  const paragraphs = (leader.bio as unknown as BioBlock[])
    .map((block) => block.children?.[0]?.text || '')
    .filter(Boolean)

  if (paragraphs.length === 0) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-small text-mid leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  )
}
