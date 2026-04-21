'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Flame, Clock, Bot } from 'lucide-react'
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

interface Stats {
  leads: { total: number; hot: number; warm: number; cold: number; new_today: number }
  agents: { active_24h: number; avg_response_ms: number; total_runs: number; success_rate: number }
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

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <div className="flex items-center gap-2 text-neutral-500 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function WorkforceLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<FwLead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [qualFilter, setQualFilter] = useState<string>('all')

  async function fetchData() {
    const [leadsRes, statsRes] = await Promise.all([
      fetch('/workforce/api/leads'),
      fetch('/workforce/api/stats'),
    ])
    if (leadsRes.ok) {
      const data = await leadsRes.json()
      setLeads(data.leads || [])
    }
    if (statsRes.ok) {
      const data = await statsRes.json()
      setStats(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
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
    fetchData()
  }

  // Client-side filtering
  const filtered = leads.filter((lead) => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false
    if (qualFilter !== 'all' && lead.qualification !== qualFilter) return false
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {filtered.length} van {leads.length} lead{leads.length !== 1 ? 's' : ''}
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={Users}
            label="Totaal leads"
            value={stats.leads.total}
            sub={stats.leads.new_today > 0 ? `+${stats.leads.new_today} vandaag` : undefined}
          />
          <StatCard
            icon={Flame}
            label="Hot leads"
            value={stats.leads.hot}
            sub={stats.leads.warm > 0 ? `${stats.leads.warm} warm` : undefined}
          />
          <StatCard
            icon={Clock}
            label="Responstijd"
            value={stats.agents.avg_response_ms > 0 ? `${(stats.agents.avg_response_ms / 1000).toFixed(1)}s` : '—'}
            sub="gem. intake agent"
          />
          <StatCard
            icon={Bot}
            label="Agents actief"
            value={stats.agents.active_24h}
            sub={stats.agents.total_runs > 0 ? `${stats.agents.success_rate}% success` : undefined}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="all">Alle statussen</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="conversation">Conversation</option>
          <option value="booking">Booking</option>
          <option value="booked">Booked</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={qualFilter}
          onChange={(e) => setQualFilter(e.target.value)}
          className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="all">Alle scores</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
          <option value="reject">Reject</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-neutral-400 text-sm">Laden...</div>
      ) : filtered.length === 0 && leads.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <p className="text-neutral-400 mb-4">Nog geen leads.</p>
          <p className="text-sm text-neutral-500">
            Stuur een test lead via de knop hierboven, of POST naar{' '}
            <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs">
              /workforce/api/webhook/lead
            </code>
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-8 text-center">
          <p className="text-neutral-400">Geen leads met deze filters.</p>
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
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/workforce/dashboard/leads/${lead.id}`)}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{lead.name || '—'}</td>
                  <td className="px-4 py-3 text-neutral-300">{lead.company || '—'}</td>
                  <td className="px-4 py-3 text-neutral-300">{lead.service || '—'}</td>
                  <td className="px-4 py-3 text-neutral-300">{lead.region || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge label={lead.status} colorClass={STATUS_COLORS[lead.status] || 'bg-neutral-500/20 text-neutral-400'} />
                  </td>
                  <td className="px-4 py-3">
                    {lead.qualification ? (
                      <Badge label={lead.qualification} colorClass={QUAL_COLORS[lead.qualification] || 'bg-neutral-500/20 text-neutral-400'} />
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{lead.source || '—'}</td>
                  <td className="px-4 py-3 text-neutral-500 text-right">{timeAgo(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
