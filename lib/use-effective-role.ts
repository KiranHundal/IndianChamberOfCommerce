'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export type UserRole = 'admin' | 'moderator' | 'reviewer' | 'member' | null

const STORAGE_KEY = 'cvicc-preview-role'

function readPreview(): UserRole {
  if (typeof window === 'undefined') return null
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    if (v === 'moderator' || v === 'reviewer') return v
  } catch {}
  return null
}

/**
 * Role-preview hook.
 *
 * Admins can preview the UI as a Moderator or Reviewer. The preview state
 * lives in sessionStorage so it survives navigation within a tab but not
 * a fresh browser session. The server-side role never changes — only the
 * client-side UI decisions do — so the admin cannot actually cross a
 * permission boundary while previewing.
 */
export function useEffectiveRole() {
  const { data: session } = useSession()
  const realRole = ((session?.user as { role?: UserRole } | undefined)?.role ?? null) as UserRole
  const [preview, setPreviewState] = useState<UserRole>(null)

  useEffect(() => {
    setPreviewState(readPreview())
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setPreviewState(readPreview())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setPreview = useCallback((role: 'moderator' | 'reviewer') => {
    try {
      sessionStorage.setItem(STORAGE_KEY, role)
    } catch {}
    setPreviewState(role)
    // Cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: role }))
  }, [])

  const exitPreview = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
    setPreviewState(null)
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: null }))
  }, [])

  // Only admins may preview — a non-admin who somehow set the key gets ignored.
  const canPreview = realRole === 'admin'
  const isPreviewing = canPreview && preview !== null
  const effectiveRole: UserRole = isPreviewing ? preview : realRole

  return {
    realRole,
    effectiveRole,
    isPreviewing,
    canPreview,
    preview,
    setPreview,
    exitPreview,
  }
}
