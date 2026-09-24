'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export type UserRole = 'admin' | 'moderator' | 'reviewer' | 'member' | null

const STORAGE_KEY = 'cvicc-preview-role'

function readPreview(): 'moderator' | 'reviewer' | null {
  if (typeof window === 'undefined') return null
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    if (v === 'moderator' || v === 'reviewer') return v
  } catch {}
  return null
}

interface RoleCtx {
  realRole: UserRole
  effectiveRole: UserRole
  isPreviewing: boolean
  canPreview: boolean
  preview: 'moderator' | 'reviewer' | null
  setPreview: (role: 'moderator' | 'reviewer') => void
  exitPreview: () => void
}

const Ctx = createContext<RoleCtx | null>(null)

/**
 * Wrap this around every surface that reads/writes preview role. It owns
 * the single source of truth so every consumer re-renders together when the
 * preview is changed or exited. Without this, each useEffectiveRole() call
 * has its own useState and the banner's Exit button only clears its own copy.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const realRole = ((session?.user as { role?: UserRole } | undefined)?.role ?? null) as UserRole
  const [preview, setPreviewState] = useState<'moderator' | 'reviewer' | null>(null)

  useEffect(() => {
    // Escape hatch: any admin URL with ?resetPreview=1 hard-clears preview
    // state before rendering the page. Bookmarkable panic button.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('resetPreview') === '1') {
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {}
        url.searchParams.delete('resetPreview')
        window.history.replaceState({}, '', url.toString())
        setPreviewState(null)
        return
      }
    }
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
  }, [])

  const exitPreview = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
    setPreviewState(null)
  }, [])

  const canPreview = realRole === 'admin'
  const isPreviewing = canPreview && preview !== null
  const effectiveRole: UserRole = isPreviewing ? preview : realRole

  return (
    <Ctx.Provider
      value={{ realRole, effectiveRole, isPreviewing, canPreview, preview, setPreview, exitPreview }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useEffectiveRole(): RoleCtx {
  const ctx = useContext(Ctx)
  if (ctx) return ctx
  // Fallback for surfaces not wrapped in RoleProvider — behaves like a plain
  // read of the session role with no preview capability. Prevents crashes if
  // a page forgets the provider.
  return {
    realRole: null,
    effectiveRole: null,
    isPreviewing: false,
    canPreview: false,
    preview: null,
    setPreview: () => {},
    exitPreview: () => {},
  }
}
