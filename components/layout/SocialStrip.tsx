export default function SocialStrip() {
  return (
    <div className="bg-gold-100 border-y border-accent/20 py-3">
      <div className="max-w-[75rem] mx-auto px-8 flex items-center justify-between flex-wrap gap-2">
        <span className="font-label text-micro tracking-widest uppercase text-brand">
          Follow Us
        </span>

        <a
          href="https://www.instagram.com/indianchamberofcommerce"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-ivory-200 rounded-full px-4 py-1 text-caption text-mid font-body hover:border-accent hover:text-accent transition-all"
        >
          Instagram
        </a>

        <span className="text-caption text-mid font-body">
          Join our community of 100+ businesses
        </span>
      </div>
    </div>
  );
}
