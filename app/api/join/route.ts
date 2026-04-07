import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { name, email, phone, city, businessName, sector, about } = body

    // Validate required fields
    if (!name || !email || !businessName) {
      return NextResponse.json(
        { error: 'Name, email, and business name are required.' },
        { status: 400 }
      )
    }

    // Create slug from business name
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if Sanity is configured with a real token
    const token = process.env.SANITY_API_TOKEN
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID

    if (!token || !projectId || projectId === 'placeholder') {
      // No Sanity configured — log the submission and return success
      console.log('[Join] Sanity not configured. Submission:', body)
      return NextResponse.json({
        success: true,
        message: 'Your application has been received. We will review it and get back to you shortly.',
      })
    }

    // Dynamically import write client only when we know Sanity is configured
    const { writeClient } = await import('@/lib/sanity')

    // Create member document in Sanity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = {
      _type: 'member',
      name,
      slug: { _type: 'slug', current: slug },
      businessName,
      city: city || undefined,
      bio: about || undefined,
      email,
      phone: phone || undefined,
      isMentor: false,
      mentorExpertise: [],
      featured: false,
      memberSince: new Date().toISOString().split('T')[0],
      order: 999,
    }

    // If a sector name was provided, try to find the matching sector document
    if (sector) {
      const sectorDoc = await writeClient.fetch(
        `*[_type == "sector" && name == $name][0]._id`,
        { name: sector }
      )
      if (sectorDoc) {
        doc.sector = { _type: 'reference', _ref: sectorDoc }
      }
    }

    await writeClient.create(doc)

    return NextResponse.json({
      success: true,
      message: 'Your application has been received. We will review it and get back to you shortly.',
    })
  } catch (error) {
    console.error('[Join] Error creating member:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}
