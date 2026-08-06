import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { leaderVideos } from '@/lib/schema'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getServerSession(authOptions)
        const user = session?.user as Record<string, unknown> | undefined
        if (!user || user.role !== 'admin') {
          throw new Error('Unauthorized: admin session required to upload')
        }

        const payload = clientPayload ? JSON.parse(clientPayload) : {}
        if (!payload.leaderName || typeof payload.leaderName !== 'string') {
          throw new Error('leaderName is required')
        }
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: JSON.stringify({ leaderName: payload.leaderName }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return
        const { leaderName } = JSON.parse(tokenPayload) as { leaderName: string }
        await db
          .insert(leaderVideos)
          .values({ leaderName, url: blob.url, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: leaderVideos.leaderName,
            set: { url: blob.url, updatedAt: new Date() },
          })
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
