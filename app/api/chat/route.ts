import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({ interval: 60_000, limit: 15 })

const SYSTEM_PROMPT = `You are the AI assistant for the Central Valley Indian Chamber of Commerce (CVICC). You help visitors learn about the chamber, membership, and how to get involved. Be warm, professional, and concise. Keep responses under 3 sentences unless more detail is needed.

KEY FACTS:
- CVICC connects, supports, and elevates Indian-American businesses across California's Central Valley
- Serves 6 counties: Stanislaus, Merced, Madera, Fresno, Tulare, and Kern
- 8 industry sectors: Healthcare, Real Estate, Legal, Technology, Hospitality, Agriculture, Education, Finance
- Founded by Sonia Heer (Chairwoman), Dr. Surdeep Singh (President), and Rajinder Kumar (Executive Director)
- Website: indianchamberofcommerce.org
- Instagram: @indianchamberofcommerce

MEMBERSHIP:
- Individual Membership: $95/year (founding member price, normally $195). Includes: business directory listing, access to all networking events, mentorship program eligibility, monthly newsletter, voting rights.
- Corporate Membership: $395/year (founding member price, normally $495). Includes everything in Individual plus: featured directory placement, logo on partners page, priority event sponsorship, up to 5 employee profiles, social media promotion.
- To join, visit the Join page at /join on the website.

CONTACT:
- Address: 4610 W Jacquelyn Ave, Fresno, CA 93722
- Phone: (510) 453-1248
- Email: info@indianchamberofcommerce.org
- Contact form available at /contact on the website

WHAT MEMBERS GET:
- Powerful business connections and networking
- Business promotion in the community
- Exclusive networking events
- Collaboration with entrepreneurs and professionals
- Part of a growing Indian business network
- Mentorship opportunities

BOARD OF DIRECTORS:
- Sonia Heer — Chairwoman & Founder (Broker/Owner, Golden State Realty; Founder, Lavish Eventz)
- Dr. Surdeep Singh — President & Founder (DDS, Robotic Dental Implant Center)
- Rajinder Kumar — Executive Director & Founder (CRPC, Senior Portfolio Advisor at Merrill Lynch)
- Kiran Hundal — Treasurer, Chief Financial Officer & Founder (Software Developer)

RULES:
- Only answer questions related to CVICC, business networking, membership, or the Central Valley Indian business community.
- If asked about unrelated topics, politely redirect to CVICC-related matters.
- Never make up information. If you don't know something, suggest contacting CVICC directly.
- When discussing membership pricing, always mention the founding member discount.
- Direct people to /join for membership and /contact for inquiries.`

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')
  return new Groq({ apiKey })
}

export async function POST(req: NextRequest) {
  const { success } = limiter(req)
  if (!success) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages required' }, { status: 400 })
    }

    if (messages.length > 20) {
      return Response.json(
        { error: 'Conversation too long. Please start a new chat (max 20 messages).' },
        { status: 400 }
      )
    }

    const lastMessage = messages[messages.length - 1]
    if (
      lastMessage &&
      lastMessage.role === 'user' &&
      typeof lastMessage.content === 'string' &&
      lastMessage.content.length > 500
    ) {
      return Response.json(
        { error: 'Message too long. Please keep your message under 500 characters.' },
        { status: 400 }
      )
    }

    const groq = getGroq()

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      stream: true,
      max_tokens: 500,
    })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) {
            controller.enqueue(new TextEncoder().encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Chat failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
