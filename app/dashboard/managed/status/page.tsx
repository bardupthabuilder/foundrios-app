'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Briefcase, Clock, CheckCircle2, XCircle, Calendar, Trophy } from 'lucide-react'

type Status = 'new' | 'reviewing' | 'qualified' | 'rejected' | 'scheduled' | 'won' | 'lost'

type ManagedRequest = {
  id: string
  status: Status
  preferred_package: 'light' | 'core' | 'premium' | 'unsure'
  bedrijfsnaam: string
  grootste_probleem: string | null
  created_at: string
  updated_at: string
}

const STATUS_INFO: Record<Status, { label: string; color: string; icon: typeof Clock; description: string }> = {
  new: {
    label: 'Ontvangen',
    color: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    icon: Clock,
    description: 'We hebben je aanvraag ontvangen. We nemen binnen 2 werkdagen contact op.',
  },
  reviewing: {
    label: 'In behandeling',
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    icon: Clock,
    description: 'We bekijken je aanvraag en bedrijfssituatie.',
  },
  qualified: {
    label: 'Gekwalificeerd',
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
    description: 'Je past bij wat we doen. We plannen een adviesgesprek.',
  },
  scheduled: {
    label: 'Adviesgesprek gepland',
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    icon: Calendar,
    description: 'Het adviesgesprek staat in de agenda.',
  },
  rejected: {
    label: 'Niet passend',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    icon: XCircle,
    description: 'Op dit moment past dit niet bij wat we doen. Je kan zelf met Pro of Scale verder.',
  },
  won: {
    label: 'Gestart',
    color: 'bg-foundri-yellow/10 text-foundri-yellow border-foundri-yellow/30',
    icon: Trophy,
    description: 'Welkom als klant. We zijn live.',
  },
  lost: {
    label: 'Afgesloten',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    icon: XCircle,
    description: 'Het traject is niet doorgegaan.',
  },
}

export default function ManagedStatusPage() {
  const [items, setItems] = useState<ManagedRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/managed-requests')
      .then(r => (r.ok ? r.json() : []))
      .then(data => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-3xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Terug
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-foundri-yellow" />
            <h1 className="text-2xl font-bold text-white">Mijn aanvragen</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">Status van je aanvragen voor uitvoering door Groeneveld Media.</p>
        </div>
        <Link
          href="/dashboard/managed/request"
          className="inline-flex items-center justify-center rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-foundri-deep transition hover:brightness-110"
        >
          Nieuwe aanvraag
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Laden...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
          <p className="text-sm text-zinc-400">Je hebt nog geen aanvraag ingediend.</p>
          <Link
            href="/dashboard/managed/request"
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-foundri-deep transition hover:brightness-110"
          >
            Aanvraag indienen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const info = STATUS_INFO[item.status]
            const Icon = info.icon
            return (
              <div key={item.id} className="rounded-xl border border-white/5 bg-foundri-deep p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-white">{item.bedrijfsnaam}</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${info.color}`}>
                    <Icon className="h-3 w-3" />
                    {info.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{info.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                  <span>Pakket: {item.preferred_package}</span>
                  <span>·</span>
                  <span>Ingediend {new Date(item.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
