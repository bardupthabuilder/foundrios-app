'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface SignatureWidgetProps {
  token: string
  quoteNumber: string
  tenantName: string
}

export function SignatureWidget({ token, quoteNumber, tenantName }: SignatureWidgetProps) {
  const [name, setName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) {
      setError('Vul je volledige naam in.')
      return
    }
    if (!agreed) {
      setError('Bevestig dat je akkoord gaat.')
      return
    }
    setBusy(true)
    try {
      const r = await fetch(`/api/q/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data?.error || 'Tekenen mislukt')
      } else {
        setDone(true)
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch {
      setError('Netwerkfout — probeer opnieuw')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 text-foundri-yellow">
        <CheckCircle2 className="h-6 w-6" />
        <p className="font-semibold text-white">Bedankt — akkoord geregistreerd.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-base font-semibold text-white">Offerte {quoteNumber} accepteren</p>
        <p className="mt-1 text-sm text-white/60">
          Door te ondertekenen ga je akkoord met de inhoud en prijs van deze offerte. {tenantName} zal hierna starten met de uitvoering.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">Volledige naam</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          autoComplete="name"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-foundri-yellow focus:outline-none"
          placeholder="Bijv. Jan Jansen"
        />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-white/80">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-foundri-yellow focus:ring-foundri-yellow"
        />
        <span>
          Ik ga akkoord met de offerte en geef opdracht tot uitvoering. Ik begrijp dat dit een bindende overeenkomst is.
        </span>
      </label>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy || !agreed || name.trim().length < 2}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-foundri-yellow px-4 py-3 text-sm font-semibold text-foundri-deep transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {busy ? 'Bezig...' : 'Offerte accepteren'}
      </button>
    </form>
  )
}
