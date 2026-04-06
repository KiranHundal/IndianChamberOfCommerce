const platforms = ['Instagram', 'LinkedIn', 'Facebook'];

export default function SocialStrip() {
  return (
    <div className="bg-gold-100 border-y border-accent/20 py-3">
      <div className="max-w-[75rem] mx-auto px-8 flex items-center justify-between flex-wrap gap-2">
        {/* Left label */}
        <span className="font-label text-micro tracking-widest uppercase text-accent">
          Follow Us
        </span>

        {/* Platform pills */}
        <div className="flex gap-2">
          {platforms.map((platform) => (
            <a
              key={platform}
              href="#"
              className="bg-white border border-ivory-200 rounded-full px-3 py-1 text-caption text-mid font-body hover:border-accent hover:text-accent transition-all"
            >
              {platform}
            </a>
          ))}
        </div>

        {/* Right text */}
        <span className="text-caption text-mid font-body">
          Join our community of 200+ businesses
        </span>
      </div>
    </div>
  );
}
