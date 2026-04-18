'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

export function ReplyBox({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    const res = await fetch(`/api/leads/${leadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim(), channel: 'manual' }),
    })

    if (res.ok) {
      setContent('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-white/5 bg-[#111317] px-6 py-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Schrijf een notitie of bericht..."
        rows={1}
        className="flex-1 resize-none rounded-lg border-0 bg-[#282A2E] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-foundri-yellow/50 focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
      />
      <button
        type="submit"
        disabled={!content.trim() || loading}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-foundri-yellow text-foundri-graphite transition-all hover:shadow-[0_0_16px_rgba(246,201,69,0.3)] disabled:opacity-30"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  )
}
