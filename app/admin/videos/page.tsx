'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'
import { ArrowLeft, Upload, Trash2, Play, Loader2 } from 'lucide-react'
import SectionLabel from '@/components/ui/SectionLabel'
import SectionTitle from '@/components/ui/SectionTitle'
import Divider from '@/components/ui/Divider'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { mockLeadership } from '@/lib/mock-data'

interface VideoRow {
  leaderName: string
  url: string
  updatedAt: string | number
}

export default function AdminVideosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/videos')
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos || [])
      }
    } catch {
    }
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
      fetchVideos()
    }
  }, [status, session, router, fetchVideos])

  async function handleUpload(leaderName: string, file: File) {
    setError('')
    setUploadingFor(leaderName)
    setUploadProgress(0)

    try {
      const ext = file.name.split('.').pop() || 'mp4'
      const safeSlug = leaderName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const pathname = `leaders/${safeSlug}-${Date.now()}.${ext}`

      await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/videos/upload',
        clientPayload: JSON.stringify({ leaderName }),
        onUploadProgress: (event) => {
          setUploadProgress(Math.round(event.percentage))
        },
      })

      await fetchVideos()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
    setUploadingFor(null)
    setUploadProgress(0)
  }

  async function handleDelete(leaderName: string) {
    if (!confirm(`Delete the video for ${leaderName}?`)) return
    try {
      await fetch('/api/admin/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderName }),
      })
      await fetchVideos()
    } catch {
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-pulse text-brand font-label text-label tracking-label uppercase">Loading...</div>
      </div>
    )
  }

  const videoByLeader = new Map(videos.map((v) => [v.leaderName, v]))

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
            <SectionTitle dark className="mt-4">
              Leadership Videos
            </SectionTitle>
          </AnimatedSection>
          <AnimatedSection delay={2}>
            <Divider className="mx-auto mt-6" />
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-page-bg py-16">
        <div className="max-w-4xl mx-auto px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-mid hover:text-brand font-label text-[0.65rem] tracking-widest uppercase mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Admin
          </Link>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-small">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {mockLeadership.map((leader) => {
              const video = videoByLeader.get(leader.name)
              const isUploading = uploadingFor === leader.name
              return (
                <div
                  key={leader._id}
                  className="bg-white border border-ivory-200 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-h4 text-brand">{leader.name}</h3>
                      <p className="font-label text-[0.65rem] tracking-widest uppercase text-brand/70 mt-1">
                        {leader.role}
                      </p>
                      {video && (
                        <p className="text-[0.7rem] text-hint mt-2 truncate max-w-md">
                          Uploaded {new Date(video.updatedAt).toLocaleDateString()} · {video.url.split('/').pop()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        ref={(el) => {
                          fileInputs.current[leader.name] = el
                        }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(leader.name, file)
                          e.target.value = ''
                        }}
                      />
                      <button
                        onClick={() => fileInputs.current[leader.name]?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-1.5 bg-accent text-white font-label text-[0.6rem] tracking-widest uppercase px-4 py-2 rounded-sm hover:bg-gold-900 transition-all disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            {video ? 'Replace' : 'Upload'}
                          </>
                        )}
                      </button>
                      {video && !isUploading && (
                        <button
                          onClick={() => handleDelete(leader.name)}
                          className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 font-label text-[0.6rem] tracking-widest uppercase px-4 py-2 rounded-sm hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {video && !isUploading && (
                    <div className="mt-4 rounded-lg overflow-hidden bg-black relative">
                      <video
                        src={video.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-72 mx-auto"
                      />
                    </div>
                  )}

                  {!video && !isUploading && (
                    <div className="mt-4 rounded-lg border-2 border-dashed border-ivory-200 py-8 text-center">
                      <Play className="w-6 h-6 text-hint mx-auto mb-2" />
                      <p className="text-small text-hint">No video uploaded yet</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-[0.7rem] text-hint mt-8 text-center">
            Supported: MP4, WebM, MOV · Max 500MB per file · Videos display in each leader&apos;s bio card on the Leadership page
          </p>
        </div>
      </section>
    </>
  )
}
