'use client'

import RolePreviewBanner from '@/components/RolePreviewBanner'
import { RoleProvider } from '@/lib/use-effective-role'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <RolePreviewBanner />
      {children}
    </RoleProvider>
  )
}
