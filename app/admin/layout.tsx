import RolePreviewBanner from '@/components/RolePreviewBanner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RolePreviewBanner />
      {children}
    </>
  )
}
