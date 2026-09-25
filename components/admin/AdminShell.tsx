'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Receipt,
  Shield,
  FileText,
  UserPlus,
  Video,
  Calendar,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { useEffectiveRole } from '@/lib/use-effective-role'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (path: string) => boolean
  roles: Array<'admin' | 'moderator' | 'reviewer'>
}

const NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'Overview',
    icon: LayoutDashboard,
    match: (p) => p === '/admin',
    roles: ['admin', 'moderator', 'reviewer'],
  },
  {
    href: '/admin/members',
    label: 'Members',
    icon: Users,
    match: (p) => p.startsWith('/admin/members'),
    roles: ['admin', 'moderator', 'reviewer'],
  },
  {
    href: '/admin/finances',
    label: 'Finances',
    icon: DollarSign,
    match: (p) => p.startsWith('/admin/finances'),
    roles: ['admin', 'moderator'],
  },
  {
    href: '/admin/expenses',
    label: 'Expenses',
    icon: Receipt,
    match: (p) => p.startsWith('/admin/expenses'),
    roles: ['admin', 'moderator'],
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    icon: FileText,
    match: (p) => p.startsWith('/admin/reports'),
    roles: ['admin'],
  },
  {
    href: '/admin/team',
    label: 'Team & Access',
    icon: Shield,
    match: (p) => p.startsWith('/admin/team'),
    roles: ['admin'],
  },
  {
    href: '/admin/board-members',
    label: 'Board Members',
    icon: UserPlus,
    match: (p) => p.startsWith('/admin/board-members'),
    roles: ['admin'],
  },
  {
    href: '/admin/events',
    label: 'Events',
    icon: Calendar,
    match: (p) => p.startsWith('/admin/events'),
    roles: ['admin', 'moderator'],
  },
  {
    href: '/admin/videos',
    label: 'Videos',
    icon: Video,
    match: (p) => p.startsWith('/admin/videos'),
    roles: ['admin'],
  },
]

export default function AdminShell({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname() || '/admin'
  const { data: session } = useSession()
  const { effectiveRole } = useEffectiveRole()
  const [mobileOpen, setMobileOpen] = useState(false)

  const uiRole = (effectiveRole || (session?.user as { role?: string })?.role || 'member') as
    | 'admin'
    | 'moderator'
    | 'reviewer'
    | 'member'
  const displayName = (session?.user as { name?: string })?.name || 'Admin'
  const displayEmail = (session?.user as { email?: string })?.email || ''

  const visibleNav = NAV.filter((item) =>
    uiRole === 'admin' ? true : item.roles.includes(uiRole as 'admin' | 'moderator' | 'reviewer')
  )

  return (
    <div className="min-h-screen bg-page-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-56 bg-navy-900 text-white flex-col z-30">
        <div className="p-5 border-b border-navy-800">
          <p className="font-label text-[0.6rem] tracking-widest uppercase text-gold-400">CVICC</p>
          <p className="text-body font-medium mt-1">Admin</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {visibleNav.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-white/5 text-gold-400 border-l-2 border-gold-400'
                    : 'text-white/70 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-navy-800">
          <p className="text-xs text-white/90 truncate">{displayName}</p>
          <p className="text-[0.65rem] text-white/40 truncate mb-3">{displayEmail}</p>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-1 text-[0.65rem] text-white/60 hover:text-white bg-white/5 rounded px-2 py-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              Site
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex-1 inline-flex items-center justify-center gap-1 text-[0.65rem] text-white/60 hover:text-red-300 bg-white/5 rounded px-2 py-1.5"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-navy-900 text-white flex flex-col z-50 transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-navy-800 flex items-center justify-between">
          <div>
            <p className="font-label text-[0.6rem] tracking-widest uppercase text-gold-400">CVICC</p>
            <p className="text-body font-medium mt-1">Admin</p>
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} className="text-white/60">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {visibleNav.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-white/5 text-gold-400 border-l-2 border-gold-400'
                    : 'text-white/70 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-navy-800">
          <p className="text-xs text-white/90 truncate">{displayName}</p>
          <p className="text-[0.65rem] text-white/40 truncate mb-3">{displayEmail}</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full inline-flex items-center justify-center gap-1 text-[0.65rem] text-white/60 hover:text-red-300 bg-white/5 rounded px-2 py-1.5"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-56 min-w-0">
        {/* Compact page header — no marketing hero */}
        <header className="sticky top-0 z-20 bg-page-bg/95 backdrop-blur border-b border-ivory-200">
          <div className="flex items-center gap-3 px-5 py-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-mid hover:text-brand"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium text-brand flex-1 truncate">{title}</h1>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>
        </header>

        <main className="px-5 py-6 max-w-7xl">{children}</main>
      </div>
    </div>
  )
}
