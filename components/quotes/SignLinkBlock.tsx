'use client'

import { useEffect, useState } from 'react'
import { Link2, Copy, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react'

interface SignLinkBlockProps {
  quoteId: string
  signToken: string | null
  status: string
  validUntil: string | null
  signedAt: string | null
  signatureName: string | null
}

type QuoteEvent = {
  id: string
  event_type: string
  actor_name: string | null
  ip: string | null
  created_at: string
}

const EVENT_LABEL: Record<string, string> = {
  sent: 'Verstuurd',
  viewed: 'Bekeken door klant',
  signed: 'Akkoord',
  expired: 'Verlopen',
  rejected: 'Afgewezen',
  reminded: 'Herinnering verzonden',
}

export function SignLinkBlock({ quoteId, signToken, status, validUntil, signedAt, signatureName }: SignLinkBlockProps) {
  const [copied, setCopied] = useState(false)
  const [events, setEvents] = useState<QuoteEvent[]>([])
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  const url = typeof window !== 'undefined' && signToken ? `${window.location.origin}/q/${signToken}` : ''

  useEffect(() => {
    fetch(`/api/quotes/${quoteId}/events`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [quoteId])

  useEffect(() => {
    if (!validUntil) return setDaysLeft(null)
    const diff = new Date(validUntil).getTime() - Date.now()
    setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [validUntil])

  async function copyLink() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  const isSigned = !!signedAt
  const isExpired = daysLeft !== null && daysLeft < 0

  return (
    <div className="mb-6 rounded-lg border border-foundri-yellow/20 bg-foundri-deep p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Link2 className="h-4 w-4 text-foundri-yellow" />
        Acceptlink voor klant
      </div>

      {signToken ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-white/80">
              {url || `/q/${signToken}`}
            </code>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-md bg-foundri-yellow px-3 py-2 text-xs font-medium text-foundri-deep hover:brightness-110"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Gekopieerd' : 'Kopieer'}
            </button>
            <a
              href={url || `/q/${signToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>

          {validUntil && !isSigned && (
            <div className={`mt-3 flex items-center gap-2 text-xs ${isExpired ? 'text-red-400' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-400' : 'text-white/60'}`}>
              {isExpired ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
              {isExpired
                ? `Verlopen sinds ${new Date(validUntil).toLocaleDateString('nl-NL')}`
                : daysLeft === 0
                  ? 'Verloopt vandaag'
                  : `Verloopt over ${daysLeft} dagen (${new Date(validUntil).toLocaleDateString('nl-NL')})`}
            </div>
          )}

          {isSigned && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ondertekend door {signatureName} op {new Date(signedAt).toLocaleString('nl-NL')}
            </div>
          )}
        </>
      ) : (
        <p className="mt-2 text-xs text-white/60">Geen acceptlink beschikbaar — sla offerte opnieuw op.</p>
      )}

      {events.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Tijdlijn</p>
          <ul className="space-y-1.5">
            {events.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between text-xs">
                <span className="text-white/80">
                  {EVENT_LABEL[ev.event_type] || ev.event_type}
                  {ev.actor_name ? ` — ${ev.actor_name}` : ''}
                </span>
                <span className="text-white/40">{new Date(ev.created_at).toLocaleString('nl-NL')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
