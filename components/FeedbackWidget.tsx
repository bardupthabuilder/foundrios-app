'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquarePlus, X, Send } from 'lucide-react'

const TYPES = [
  { value: 'bug', label: '🐛 Bug', desc: 'Iets werkt niet goed' },
  { value: 'verbetering', label: '💡 Verbetering', desc: 'Dit kan beter' },
  { value: 'feature', label: '🚀 Feature', desc: 'Ik mis dit' },
  { value: 'vraag', label: '❓ Vraag', desc: 'Ik snap dit niet' },
]

export function FeedbackWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('verbetering')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message: message.trim(), page: pathname }),
    })
    setSending(false)
    setSent(true)
    setTimeout(() => { setSent(false); setOpen(false); setMessage('') }, 2000)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-foundri-yellow text-foundri-graphite shadow-lg transition-all hover:shadow-[0_0_20px_rgba(246,201,69,0.4)]"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 rounded-lg border border-white/10 bg-foundri-deep shadow-2xl">
          {sent ? (
            <div className="p-6 text-center">
              <p className="text-lg font-semibold text-white">Bedankt! 🙏</p>
              <p className="mt-1 text-sm text-zinc-400">We bekijken je feedback deze week.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-white/5 px-4 py-3">
                <h3 className="text-sm font-semibold text-white">Feedback geven</h3>
                <p className="text-xs text-zinc-500">Wat kunnen we verbeteren?</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`rounded-md px-2 py-1.5 text-xs text-left transition-colors ${
                        type === t.value ? 'bg-foundri-yellow/10 border border-foundri-yellow/30 text-white' : 'bg-foundri-card text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Beschrijf wat je wilt..."
                  rows={3}
                  className="w-full rounded-md border-0 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-foundri-yellow px-3 py-2 text-sm font-semibold text-foundri-graphite disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? 'Versturen...' : 'Versturen'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
