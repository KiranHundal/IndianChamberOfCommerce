interface Props {
  url: string
  name: string
  className?: string
}

export default function LeaderVideo({ url, name, className = '' }: Props) {
  return (
    <div className={`rounded-lg overflow-hidden bg-black shadow-card ${className}`}>
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        aria-label={`Video message from ${name}`}
        className="w-full max-h-96 mx-auto"
      />
    </div>
  )
}
