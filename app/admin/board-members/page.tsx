'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  UserPlus,
  Trash2,
  Pencil,
  X,
  Save,
  User,
  Loader2,
  Mail,
  MailCheck,
} from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import ExportCsvButton from '@/components/admin/ExportCsvButton'
import { headshotFor } from '@/lib/leader-headshots'

interface BoardMemberRow {
  id: string
  name: string
  role: string
  bio: string | null
  photoUrl: string | null
  email: string | null
  displayOrder: number
  createdAt: string | number
  welcomeEmailSentAt: string | number | null
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
  const [sendingWelcomeFor, setSendingWelcomeFor] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
        if (data.emailStatus === 'sent') {
          setNotice({ type: 'success', text: 'Board member added and welcome email sent.' })
        } else if (data.emailStatus === 'failed') {
          setNotice({ type: 'error', text: 'Board member added, but welcome email failed to send. You can resend it from the list.' })
        } else if (data.emailStatus === 'skipped') {
          setNotice({ type: 'success', text: editingId ? 'Board member updated.' : 'Board member added.' })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    }
    setSaving(false)
  }

  async function handleSendWelcome(id: string, name: string) {
    setSendingWelcomeFor(id)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/board-members/${id}/send-welcome`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setNotice({ type: 'error', text: data.error || 'Failed to send welcome email.' })
      } else {
        setNotice({ type: 'success', text: `Welcome email sent to ${name}.` })
        await fetchRows()
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error sending welcome email.' })
    }
    setSendingWelcomeFor(null)
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
      <AdminShell title="Board Members">
        <div className="animate-pulse text-mid text-sm">Loading…</div>
      </AdminShell>
    )
  }

  const headerActions = (
    <>
      <ExportCsvButton
        filename={`cvicc-board-members-${new Date().toISOString().slice(0, 10)}.csv`}
        rows={rows}
        columns={[
          { header: 'Name', get: (r) => r.name },
          { header: 'Role', get: (r) => r.role },
          { header: 'Email', get: (r) => r.email || '' },
          { header: 'Bio', get: (r) => r.bio || '' },
          { header: 'Photo URL', get: (r) => r.photoUrl || '' },
          { header: 'Display Order', get: (r) => r.displayOrder },
          { header: 'Created', get: (r) => r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '' },
          { header: 'Welcome Email Sent', get: (r) => r.welcomeEmailSentAt ? new Date(r.welcomeEmailSentAt).toISOString().slice(0, 10) : '' },
        ]}
      />
      {!showAdd && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-gold-900"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Board Member</span>
        </button>
      )}
    </>
  )

  return (
    <AdminShell title="Board Members" actions={headerActions}>
      <div>
          {notice && (
            <div className={`mb-6 border rounded-lg px-4 py-3 text-small flex items-start gap-3 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingRow?.email || ''}
                    className={inputClass}
                    placeholder="member@example.com"
                  />
                  <p className="text-[0.7rem] text-hint mt-1">Optional. Required to send a welcome email.</p>
                </div>
                {!editingId && (
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="sendWelcome"
                      value="true"
                      defaultChecked
                      className="mt-1 w-4 h-4 accent-accent"
                    />
                    <span className="text-small text-charcoal">
                      Send welcome email now (only if email is provided)
                    </span>
                  </label>
                )}
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
              {rows.map((row) => {
                // Manual upload wins; otherwise fall back to the same headshot
                // map the public /about/leadership page uses so seeded rows
                // don't render with a placeholder icon.
                const photoSrc = row.photoUrl || headshotFor(row.name)
                return (
                <div key={row.id} className="bg-white border border-ivory-200 rounded-xl p-5 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-page-bg border border-ivory-200 flex-shrink-0 flex items-center justify-center">
                    {photoSrc ? (
                      <Image src={photoSrc} alt={row.name} fill className="object-cover" unoptimized />
                    ) : (
                      <User className="w-6 h-6 text-hint" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-h5 text-brand">{row.name}</p>
                    <p className="font-label text-[0.6rem] tracking-widest uppercase text-brand/70 mt-0.5">{row.role}</p>
                    {row.email && (
                      <p className="text-small text-mid mt-1 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        {row.email}
                        {row.welcomeEmailSentAt && (
                          <span className="inline-flex items-center gap-1 text-[0.65rem] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <MailCheck className="w-3 h-3" />
                            Welcome sent
                          </span>
                        )}
                      </p>
                    )}
                    {row.bio && <p className="text-small text-mid mt-1 line-clamp-2">{row.bio}</p>}
                    <p className="text-[0.7rem] text-hint mt-1">Order: {row.displayOrder}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {row.email && (
                      <button
                        onClick={() => handleSendWelcome(row.id, row.name)}
                        disabled={sendingWelcomeFor === row.id}
                        className="flex items-center justify-center gap-1.5 bg-white border border-accent/40 text-accent font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:bg-gold-50 transition-all disabled:opacity-50"
                      >
                        {sendingWelcomeFor === row.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Sending
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" />
                            {row.welcomeEmailSentAt ? 'Resend Welcome' : 'Send Welcome'}
                          </>
                        )}
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(row)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-ivory-200 text-brand font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:border-accent/40 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row.id, row.name)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 font-label text-[0.6rem] tracking-widest uppercase px-3 py-2 rounded-sm hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          <p className="text-[0.7rem] text-hint mt-8 text-center">
            Board members added here appear in the Board Members grid on{' '}
            <Link href="/about/leadership" className="text-accent hover:underline">/about/leadership</Link>
            {' '}alongside the existing hardcoded members.
          </p>
      </div>
    </AdminShell>
  )
}
