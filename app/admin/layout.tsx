'use client'

import RolePreviewBanner from '@/components/RolePreviewBanner'
import { RoleProvider } from '@/lib/use-effective-role'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The RoleProvider owns the shared preview state.
  // RolePreviewBanner shows the three View As pills.
  // Individual admin pages wrap themselves in <AdminShell> to opt in to the
  // sidebar + compact header. This layout intentionally stays lean — it's
  // just the shared providers and the top pill row.
  return (
    <RoleProvider>
      <RolePreviewBanner />
      {children}
    </RoleProvider>
  )
}
