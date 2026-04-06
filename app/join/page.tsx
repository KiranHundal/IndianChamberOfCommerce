'use client'

import { useState, FormEvent } from 'react'
import {
  Users,
  BookOpen,
  UserCheck,
  Handshake,
  Megaphone,
  Heart,
  CheckCircle,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'

const benefits = [
  {
    icon: Users,
    title: 'Networking Events',
    description: '40+ annual events to connect with fellow professionals and grow your business relationships.',
  },
  {
    icon: BookOpen,
    title: 'Business Directory',
    description: 'Get listed in our business directory and increase your visibility to potential clients and partners.',
  },
  {
    icon: UserCheck,
    title: 'Mentorship Access',
    description: 'Connect with industry leaders who can guide your business growth and career development.',
  },
  {
    icon: Handshake,
    title: 'Cross-Sector Partnerships',
    description: 'Collaborate across industries to discover new opportunities and expand your reach.',
  },
  {
    icon: Megaphone,
    title: 'Marketing Exposure',
    description: 'Get featured on our website and social media channels to boost your brand awareness.',
  },
  {
    icon: Heart,
    title: 'Community Impact',
    description: 'Support Indian business growth in the Central Valley and contribute to a thriving community.',
  },
]

const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export default function JoinPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('fullName') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('applyEmail') as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem('applyPhone') as HTMLInputElement).value.trim(),
      city: (form.elements.namedItem('city') as HTMLSelectElement).value,
      businessName: (form.elements.namedItem('businessName') as HTMLInputElement).value.trim(),
      sector: (form.elements.namedItem('sector') as HTMLSelectElement).value,
      about: (form.elements.namedItem('about') as HTMLTextAreaElement).value.trim(),
    }

    if (!data.name || !data.email || !data.businessName) {
      setStatus('error')
      setErrorMsg('Please fill in your name, email, and business name.')
      return
    }

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(result.error || 'Something went wrong.')
        return
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="max-w-4xl mx-auto px-8">
          <SectionLabel dark>Membership</SectionLabel>
          <SectionTitle dark className="mt-4">
            Join the Chamber
          </SectionTitle>
          <Divider className="mx-auto mt-6" />
          <p className="text-body text-white/55 mt-6 max-w-xl mx-auto">
            Submit your request below and our team will review your application.
            Once approved, your business will appear in our directory.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-page-bg py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Why Join</SectionLabel>
            <SectionTitle className="mt-4">Membership Benefits</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.title}
                  className="bg-white border border-ivory-200 rounded-lg p-6 text-center shadow-card"
                >
                  <div className="w-12 h-12 rounded-full bg-navy-100 mx-auto flex items-center justify-center text-brand">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-h4 text-brand mt-4">
                    {benefit.title}
                  </h3>
                  <p className="text-small text-mid mt-2">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Membership Request Form */}
      <section id="apply" className="bg-page-alt py-24">
        <div className="max-w-[75rem] mx-auto px-8">
          <div className="text-center">
            <SectionLabel>Get Started</SectionLabel>
            <SectionTitle className="mt-4">Request to Join</SectionTitle>
            <Divider className="mx-auto mt-6" />
          </div>

          <div className="mt-12 max-w-2xl mx-auto bg-white border border-ivory-200 rounded-lg p-8">
            {status === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-accent mx-auto" />
                <h3 className="font-display text-h3 text-brand mt-6">
                  Application Received
                </h3>
                <p className="text-body text-mid mt-3 max-w-md mx-auto">
                  Thank you for your interest in joining the Central Valley Indian Chamber of Commerce.
                  Our team will review your application and your business will appear in the directory once approved.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-accent text-small font-medium hover:text-gold-900 transition-colors"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="fullName" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                      Full Name *
                    </label>
                    <input id="fullName" type="text" required className={inputClass} placeholder="Your full name" />
                  </div>
                  <div>
                    <label htmlFor="applyEmail" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                      Email *
                    </label>
                    <input id="applyEmail" type="email" required className={inputClass} placeholder="you@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="applyPhone" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                      Phone
                    </label>
                    <input id="applyPhone" type="tel" className={inputClass} placeholder="(559) 555-0100" />
                  </div>
                  <div>
                    <label htmlFor="city" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                      City
                    </label>
                    <select id="city" className={inputClass}>
                      <option value="">Select city</option>
                      <option value="Fresno">Fresno</option>
                      <option value="Clovis">Clovis</option>
                      <option value="Visalia">Visalia</option>
                      <option value="Bakersfield">Bakersfield</option>
                      <option value="Modesto">Modesto</option>
                      <option value="Madera">Madera</option>
                      <option value="Hanford">Hanford</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="businessName" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                    Business Name *
                  </label>
                  <input id="businessName" type="text" required className={inputClass} placeholder="Your business name" />
                </div>
                <div>
                  <label htmlFor="sector" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                    Industry Sector
                  </label>
                  <select id="sector" className={inputClass}>
                    <option value="">Select sector</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Legal">Legal</option>
                    <option value="Technology">Technology</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="about" className="font-label text-micro tracking-widest uppercase text-accent block mb-2">
                    Tell Us About Your Business
                  </label>
                  <textarea
                    id="about"
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Brief description of your business and why you'd like to join"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-accent text-white font-label text-label tracking-label uppercase px-6 py-3 rounded-sm hover:bg-gold-900 transition-all shadow-card hover:shadow-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
                </button>
                <p className="text-caption text-hint text-center mt-3">
                  Your business will appear in our directory once reviewed and approved.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
