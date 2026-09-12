'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Pencil,
  X,
  Save,
  User,
  Loader2,
} from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'

interface BoardMemberRow {
  id: string
  name: string
  role: string
  bio: string | null
  photoUrl: string | null
  displayOrder: number
  createdAt: string | number
}

const inputClass =
  'w-full bg-page-bg border border-ivory-200 rounded-md px-4 py-3 text-body font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export default function AdminBoardMembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rows, setRows] = useState<BoardMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/board-members')
      if (res.ok) {
        const data = await res.json()
        setRows(data.boardMembers || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const user = session?.user as Record<string, unknown>
      if (user?.role !== 'admin') {
        router.push('/portal')
        return
      }
      fetchRows()
    }
  }, [status, session, router, fetchRows])

  function resetForm() {
    setShowAdd(false)
    setEditingId(null)
    setPhotoPreview(null)
    setError('')
    if (photoRef.current) photoRef.current.value = ''
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const url = editingId ? `/api/admin/board-members/${editingId}` : '/api/admin/board-members'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        await fetchRows()
        resetForm()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    }
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the board?`)) return
    try {
      await fetch(`/api/admin/board-members/${id}`, { method: 'DELETE' })
      await fetchRows()
    } catch {}
  }

  function startEdit(row: BoardMemberRow) {
    setEditingId(row.id)
    setShowAdd(true)
    setPhotoPreview(row.photoUrl)
    setError('')
  }

  const editingRow = editingId ? rows.find((r) => r.id === editingId) : null

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <section className="bg-navy-900 py-32 text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gold-600/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-gold-600/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-gold-600/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gold-600/30" />

        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection>
            <SectionLabel dark>Admin</SectionLabel>
          </AnimatedSection>
          <AnimatedSection delay={1}>
            <SectionTitle dark className="mt-4">Board Members</SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-16">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-mid hover:text-brand font-label text-[0.65rem] tracking-widest uppercase transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Admin
            </Link>

            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-accent text-white font-label text-[0.65rem] tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-gold-900 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Board Member
              </button>
            )}
          </div>

          {showAdd && (
            <div className="bg-white border border-ivory-200 rounded-xl p-8 mb-8 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-h4 text-brand">
                  {editingId ? 'Edit Board Member' : 'Add Board Member'}
                </h3>
                <button onClick={resetForm} className="text-mid hover:text-brand" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingRow?.name || ''}
                    className={inputClass}
                    placeholder="e.g. Jane Kaur"
                  />
                </div>
                <div>
                  <label className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    defaultValue={editingRow?.role || 'Board Member'}
                    className={inputClass}
                    placeholder="Board Member"
                  />
                </div>
                <div>
                  <label className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Short Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    defaultValue={editingRow?.bio || ''}
                    className={inputClass}
                    placeholder="1-2 sentences shown in the read-bio modal"
                  />
                </div>
                <div>
                  <label className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={editingRow?.displayOrder ?? 100}
                    className={inputClass}
                  />
                  <p className="text-[0.7rem] text-hint mt-1">Lower numbers appear first (default 100)</p>
                </div>

                <div>
                  <label className="font-label text-micro tracking-widest uppercase text-brand block mb-2">
                    Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-page-bg border border-ivory-200 flex items-center justify-center flex-shrink-0">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="preview" fill className="object-cover" unoptimized />
                      ) : (
                        <User className="w-8 h-8 text-hint" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={photoRef}
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = () => setPhotoPreview(reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="block w-full text-small text-mid file:mr-3 file:py-2 file:px-4 file:rounded-sm file:border-0 file:font-label file:text-[0.6rem] file:tracking-widest file:uppercase file:bg-accent file:text-white file:cursor-pointer hover:file:bg-gold-900"
                      />
                      <p className="text-[0.7rem] text-hint mt-1">JPG or PNG, up to 5MB. Square photos work best.</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-small text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-white border border-ivory-200 text-mid font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:border-brand/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-label text-label tracking-label uppercase px-4 py-3 rounded-sm hover:bg-gold-900 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        {editingId ? 'Save Changes' : 'Add Member'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="bg-white border border-ivory-200 rounded-xl p-12 text-center">
              <UserPlus className="w-10 h-10 text-hint mx-auto mb-4" />
              <p className="text-body text-mid">No board members added yet.</p>
              <p className="text-small text-hint mt-2">
                Existing hardcoded members (Roken, Manreet, Akash) still appear on the leadership page.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="bg-white border border-ivory-200 rounded-xl p-5 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-page-bg border border-ivory-200 flex-shrink-0 flex items-center justify-center">
                    {row.photoUrl ? (
                      <Image src={row.photoUrl} alt={row.name} fill className="object-cover" unoptimized />
                    ) : (
                      <User className="w-6 h-6 text-hint" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-h5 text-brand">{row.name}</p>
                    <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/70 mt-0.5">{row.role}</p>
                    {row.bio && <p className="text-small text-mid mt-1 line-clamp-2">{row.bio}</p>}
                    <p className="text-[0.7rem] text-hint mt-1">Order: {row.displayOrder}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(row)}
                      className="flex items-center gap-1.5 bg-white border border-ivory-200 text-brand font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:border-accent/40 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.id, row.name)}
                      className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[0.7rem] text-hint mt-8 text-center">
            Board members added here appear in the Board Members grid on{' '}
            <Link href="/about/leadership" className="text-accent hover:underline">/about/leadership</Link>
            {' '}alongside the existing hardcoded members.
          </p>
        </div>
      </section>
    </>
  )
}
