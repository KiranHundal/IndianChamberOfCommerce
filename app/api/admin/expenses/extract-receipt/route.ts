import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'
import { extractReceiptFromUrl } from '@/lib/receipt-ocr'

export const dynamic = 'force-dynamic'
// Receipt uploads can be ~5-10 MB images; give the route enough runtime
// to upload + call Claude vision. Vercel's default is 10s on hobby, 60s
// on Pro — we're explicit here.
export const maxDuration = 60

/**
 * One-shot: upload the receipt image to Vercel Blob, then call Claude
 * vision to extract vendor/amount/date/category/description. Returns
 * BOTH the Blob URL (so the admin can attach it to the saved expense)
 * AND the extracted fields (so the modal can pre-fill).
 *
 * The extraction and the upload are intentionally in the same request:
 * splitting them would mean the admin uploads a file, gets a URL back,
 * then triggers a second request — twice the UI complexity for no gain.
 *
 * Even if extraction fails, we still return the Blob URL — admin can
 * fill the form manually and still attach the receipt image.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || (role !== 'admin' && role !== 'moderator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Request must be multipart/form-data.' }, { status: 400 })
  }

  const file = form.get('receipt') as File | null
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing "receipt" file.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file.' }, { status: 400 })
  }
  // 10 MB cap — modern phone photos can run large but we don't need
  // more than that for OCR.
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Receipt must be under 10 MB.' }, { status: 400 })
  }

  const okType = file.type.startsWith('image/') || file.type === 'application/pdf'
  if (!okType) {
    return NextResponse.json({ error: 'Only image or PDF files are supported.' }, { status: 400 })
  }

  // Upload to Blob first so Claude can fetch via URL. Random suffix in
  // the key keeps paths effectively private.
  const ext = (file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg')).toLowerCase()
  const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? ext : 'bin'
  const blobKey = `receipts/${crypto.randomUUID()}.${safeExt}`

  let receiptUrl: string
  try {
    const blob = await put(blobKey, file, { access: 'public' })
    receiptUrl = blob.url
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to upload receipt'
    console.error('Receipt blob upload failed:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Claude can't yet consume PDFs through the vision URL input. For
  // PDFs we return the Blob URL without extraction; admin fills the
  // form manually.
  if (file.type === 'application/pdf') {
    return NextResponse.json({
      receiptUrl,
      extracted: null,
      extractionError: 'PDF uploaded — enter the fields manually. Receipt image is attached to the expense.',
    })
  }

  try {
    const extracted = await extractReceiptFromUrl(receiptUrl)
    if ('error' in extracted) {
      return NextResponse.json({
        receiptUrl,
        extracted: null,
        extractionError: extracted.error,
      })
    }
    return NextResponse.json({ receiptUrl, extracted })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed'
    console.error('Receipt OCR failed:', err)
    return NextResponse.json({
      receiptUrl,
      extracted: null,
      extractionError: msg,
    })
  }
}
