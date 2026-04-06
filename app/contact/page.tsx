import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock, Globe, ExternalLink } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import { mockSiteSettings } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Central Valley Indian Chamber of Commerce. Reach out for membership inquiries, event information, partnership opportunities, and more.',
}

const contactDetails = [
  {
    icon: MapPin,
    label: 'Address',
    value: mockSiteSettings.address,
    href: `https://maps.google.com/?q=${encodeURIComponent(mockSiteSettings.address)}`,
  },
  {
    icon: Phone,
    label: 'Phone',
    value: mockSiteSettings.phone,
    href: `tel:${mockSiteSettings.phone.replace(/[^\d+]/g, '')}`,
  },
  {
    icon: Mail,
    label: 'Email',
    value: mockSiteSettings.email,
    href: `mailto:${mockSiteSettings.email}`,
  },
]

const socialLinks = [
  {
    icon: Globe,
    label: 'Instagram',
    value: mockSiteSettings.instagramHandle,
    href: `https://instagram.com/${mockSiteSettings.instagramHandle?.replace('@', '')}`,
  },
  {
    icon: ExternalLink,
    label: 'LinkedIn',
    value: 'CVICC',
    href: mockSiteSettings.linkedinUrl,
  },
  {
    icon: Globe,
    label: 'Facebook',
    value: 'CVICC',
    href: mockSiteSettings.facebookUrl,
  },
]

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="max-w-4xl mx-auto px-8">
          <SectionLabel dark>Reach Out</SectionLabel>
          <SectionTitle dark className="mt-4">
            Contact Us
          </SectionTitle>
          <Divider className="mx-auto mt-6" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <div>
            <SectionLabel>Get in Touch</SectionLabel>
            <SectionTitle className="mt-4">Contact Us</SectionTitle>
            <Divider className="mt-6" />

            {/* Contact Details */}
            <div className="mt-10 space-y-6">
              {contactDetails.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-brand flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-label text-label tracking-label uppercase text-accent">
                        {item.label}
                      </p>
                      <p className="text-body text-brand group-hover:text-accent transition-colors mt-1">
                        {item.value}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>

            {/* Social Links */}
            <div className="mt-10">
              <p className="font-label text-label tracking-label uppercase text-accent">
                Follow Us
              </p>
              <div className="flex gap-4 mt-4">
                {socialLinks.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Office Hours */}
            <div className="mt-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-brand flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-label text-label tracking-label uppercase text-accent">
                    Office Hours
                  </p>
                  <p className="text-body text-brand mt-1">
                    Monday &ndash; Friday: 9:00 AM &ndash; 5:00 PM
                  </p>
                  <p className="text-small text-mid mt-1">
                    Saturday &ndash; Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white border border-ivory-200 rounded-lg p-8">
            <h3 className="font-display text-h3 text-brand mb-6">Send a Message</h3>
            <form className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className="w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className="w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                    placeholder="Your last name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                  placeholder="(559) 555-0100"
                />
              </div>
              <div>
                <label htmlFor="subject" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  className="w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                >
                  <option value="">Select a topic</option>
                  <option value="membership">Membership Inquiry</option>
                  <option value="events">Events &amp; Programs</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="mentorship">Mentorship Program</option>
                  <option value="media">Media &amp; Press</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm hover:bg-gold-900 transition-all shadow-card hover:shadow-hover"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
