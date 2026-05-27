'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME = 'Hello! I\'m the CVICC assistant. Ask me about membership, events, or how we can help your business grow in the Central Valley.'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: assistantContent }
          return copy
        })
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again or contact us at info@indianchamberofcommerce.org.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat bubble button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[400] w-14 h-14 bg-navy-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-navy-800 transition-all hover:scale-105"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[400] w-[22rem] sm:w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-ivory-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-navy-900 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-display text-[1rem] text-white">CVICC Assistant</p>
              <p className="text-[0.65rem] text-white/50 font-label tracking-widest uppercase">Powered by AI</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.85rem] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-navy-900 text-white rounded-br-sm'
                      : 'bg-navy-100/50 text-charcoal rounded-bl-sm'
                  }`}
                >
                  {msg.content || (
                    <Loader2 className="w-4 h-4 animate-spin text-brand/50" />
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-navy-100/50 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-brand/50" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-ivory-200 px-3 py-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about CVICC..."
              className="flex-1 bg-page-bg border border-ivory-200 rounded-full px-4 py-2.5 text-[0.85rem] font-body text-charcoal placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center hover:bg-gold-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
