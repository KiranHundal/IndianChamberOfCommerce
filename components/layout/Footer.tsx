import Link from 'next/link';
import { Globe, ExternalLink } from 'lucide-react';
import LogoPlaceholder from '../ui/LogoPlaceholder';

const quickLinks = [
  { label: 'About', href: '/about' },
  { label: 'Members', href: '/members' },
  { label: 'Events', href: '/events' },
  { label: 'Partners', href: '/partners' },
  { label: 'Join', href: '/join' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900 border-t border-white/10 text-white">
      <div className="py-16 px-8">
        <div className="max-w-[75rem] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Column 1 — Brand */}
          <div>
            <LogoPlaceholder dark />
            <p className="text-white/55 font-body text-small mt-4 max-w-xs">
              Connecting Indian businesses across the Central Valley, fostering
              growth, collaboration, and community impact.
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="font-label text-label tracking-widest uppercase text-gold-600 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-small transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact */}
          <div>
            <h4 className="font-label text-label tracking-widest uppercase text-gold-600 mb-4">
              Get in Touch
            </h4>
            <address className="not-italic space-y-2 text-white/60 text-small">
              <p>Central Valley, California</p>
              <p>(559) 555-0100</p>
              <p>info@cvicc.org</p>
            </address>
            <div className="flex gap-4 mt-4">
              <a href="#" aria-label="Instagram" className="text-white/50 hover:text-accent transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-white/50 hover:text-accent transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Facebook" className="text-white/50 hover:text-accent transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[75rem] mx-auto px-8 border-t border-white/10 mt-0 pt-6 pb-6 flex justify-between text-caption text-white/35">
        <span>&copy; 2025 Central Valley Indian Chamber of Commerce</span>
        <span className="text-accent">Built by AATHOPS</span>
      </div>
    </footer>
  );
}
