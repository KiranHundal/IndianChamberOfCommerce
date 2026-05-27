import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server'

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
- Address: 1840 Shaw Ave, 105-164, Clovis, CA 93611
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
- Kiran Hundal — Secretary & Founder (Software Developer)

RULES:
- Only answer questions related to CVICC, business networking, membership, or the Central Valley Indian business community.
- If asked about unrelated topics, politely redirect to CVICC-related matters.
- Never make up information. If you don't know something, suggest contacting CVICC directly.
- When discussing membership pricing, always mention the founding member discount.
- Direct people to /join for membership and /contact for inquiries.`

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')
  return new GoogleGenerativeAI(apiKey)
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages required' }, { status: 400 })
    }

    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
    })

    const history = messages
      .slice(0, -1)
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    // Gemini requires history to start with a user message
    while (history.length > 0 && history[0].role === 'model') {
      history.shift()
    }

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1].content

    const result = await chat.sendMessageStream(lastMessage)

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            controller.enqueue(new TextEncoder().encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Chat failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
