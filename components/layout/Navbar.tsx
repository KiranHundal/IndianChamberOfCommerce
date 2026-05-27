'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LogIn } from 'lucide-react';
import { useSession } from 'next-auth/react';
import LogoPlaceholder from '../ui/LogoPlaceholder';

const navLinks = [
  { label: 'About', href: '/about' },
  { label: 'Board', href: '/about/leadership' },
  // { label: 'Directory', href: '/directory' },
  // { label: 'Events', href: '/events' },
  // { label: 'Partners', href: '/partners' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-[200] transition-all duration-normal ${
        scrolled ? 'bg-navy-900 shadow-navy' : 'bg-transparent'
      }`}
    >
      <div
        className={`max-w-container mx-auto flex items-center justify-between px-8 transition-all duration-normal ${
          scrolled ? 'py-3' : 'py-4'
        }`}
      >
        {/* Logo */}
        <Link href="/">
          <LogoPlaceholder dark />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-label text-label tracking-label uppercase text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <Link
              href="/portal"
              className="flex items-center gap-2 border border-white/30 text-white font-label text-label tracking-label uppercase px-5 py-2 rounded-sm hover:bg-white/10 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Portal
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 border border-white/30 text-white font-label text-label tracking-label uppercase px-5 py-2 rounded-sm hover:bg-white/10 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </Link>
          )}
          <Link
            href="/join"
            className="bg-accent text-white font-label text-label tracking-label uppercase px-5 py-2 rounded-sm hover:bg-gold-900 transition-all"
          >
            Join Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-navy-900 z-[300] flex flex-col items-center justify-center gap-8">
          {/* Close button */}
          <button
            className="absolute top-6 right-8 text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Mobile nav links */}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-2xl font-label tracking-label uppercase text-white/80 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile CTAs */}
          {session ? (
            <Link
              href="/portal"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 border border-white/30 text-white font-label text-label tracking-label uppercase px-5 py-2 rounded-sm hover:bg-white/10 transition-all mt-4"
            >
              <LogIn className="w-3.5 h-3.5" />
              Portal
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 border border-white/30 text-white font-label text-label tracking-label uppercase px-5 py-2 rounded-sm hover:bg-white/10 transition-all mt-4"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </Link>
          )}
          <Link
            href="/join"
            onClick={() => setMobileOpen(false)}
            className="bg-accent text-white font-label text-label tracking-label uppercase px-5 py-2 rounded-sm hover:bg-gold-900 transition-all mt-2"
          >
            Join Now
          </Link>
        </div>
      )}
    </nav>
  );
}
