'use client'

import { useEffect, useState } from 'react'
import type { FwLead } from '@/lib/workforce/types'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  qualified: 'bg-green-500/20 text-green-400',
  conversation: 'bg-yellow-500/20 text-yellow-400',
  booking: 'bg-purple-500/20 text-purple-400',
  booked: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  reactivation: 'bg-orange-500/20 text-orange-400',
}

const QUAL_COLORS: Record<string, string> = {
  hot: 'bg-red-500/20 text-red-400',
  warm: 'bg-orange-500/20 text-orange-400',
  cold: 'bg-blue-500/20 text-blue-400',
  reject: 'bg-neutral-500/20 text-neutral-400',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'net'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u`
  return `${Math.floor(hours / 24)}d`
}

export default function WorkforceLeadsPage() {
  const [leads, setLeads] = useState<FwLead[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  async function fetchLeads() {
    const res = await fetch('/workforce/api/leads')
    if (res.ok) {
      const data = await res.json()
      setLeads(data.leads || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()
    const interval = setInterval(fetchLeads, 10000)
    return () => clearInterval(interval)
  }, [])

  async function sendTestLead() {
    setSending(true)
    await fetch('/workforce/api/webhook/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'test',
        message:
          'Hallo, ik ben Jan de Vries van Hoveniersbedrijf De Vries uit Amersfoort. We zoeken iemand voor de aanleg van een grote tuin bij een nieuwbouwproject. Budget rond de 25.000 euro. Graag snel contact, het project start over 3 weken. Bereikbaar op 06-12345678 of jan@devries-hoveniers.nl',
      }),
    })
    setSending(false)
    fetchLeads()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} totaal
          </p>
        </div>
        <button
          onClick={sendTestLead}
          disabled={sending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {sending ? 'Verwerken...' : 'Test Lead Versturen'}
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-400 text-sm">Laden...</div>
      ) : leads.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <p className="text-neutral-400 mb-4">Nog geen leads.</p>
          <p className="text-sm text-neutral-500">
            Stuur een test lead via de knop hierboven, of POST naar{' '}
            <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs">
              /workforce/api/webhook/lead
            </code>
          </p>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-left">
                <th className="px-4 py-3 font-medium">Naam</th>
                <th className="px-4 py-3 font-medium">Bedrijf</th>
                <th className="px-4 py-3 font-medium">Dienst</th>
                <th className="px-4 py-3 font-medium">Regio</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Bron</th>
                <th className="px-4 py-3 font-medium text-right">Tijd</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{lead.name || '—'}</td>
                  <td className="px-4 py-3 text-neutral-300">{lead.company || '—'}</td>
                  <td className="px-4 py-3 text-neutral-300">{lead.service || '—'}</td>
                  <td className="px-4 py-3 text-neutral-300">{lead.region || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={lead.status}
                      colorClass={STATUS_COLORS[lead.status] || 'bg-neutral-500/20 text-neutral-400'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {lead.qualification ? (
                      <Badge
                        label={lead.qualification}
                        colorClass={QUAL_COLORS[lead.qualification] || 'bg-neutral-500/20 text-neutral-400'}
                      />
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{lead.source || '—'}</td>
                  <td className="px-4 py-3 text-neutral-500 text-right">
                    {timeAgo(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
