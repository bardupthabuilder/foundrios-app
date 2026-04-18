'use client'

import { useEffect, useState } from 'react'
import { Plus, Megaphone, MapPin, Users, TrendingUp, Copy } from 'lucide-react'

type Campaign = {
  id: string
  title: string
  campaign_type: string
  area: string | null
  discount_pct: number
  valid_until: string | null
  message_template: string | null
  status: string
  leads_generated: number
  conversions: number
  notes: string | null
  created_at: string
  projects: { id: string; name: string; city: string | null } | null
}

const TYPE_LABELS: Record<string, string> = { burenactie: 'Burenactie', seizoensactie: 'Seizoensactie', upsell: 'Upsell', referral: 'Referral', custom: 'Overig' }
const STATUS_COLORS: Record<string, string> = { draft: 'bg-foundri-card text-zinc-300', active: 'bg-green-500/10 text-green-400', completed: 'bg-blue-500/10 text-blue-400', cancelled: 'bg-foundri-card text-zinc-400' }

const DEFAULT_TEMPLATES: Record<string, string> = {
  burenactie: `Beste buurman/buurvrouw,

We hebben onlangs bij uw buren op [adres] gewerkt. Ze zijn erg tevreden met het resultaat.

Omdat we al in de buurt zijn, bieden we u [korting]% korting aan als u binnen 30 dagen boekt.

Neem gerust contact op voor een vrijblijvende offerte.

Met vriendelijke groet,
[bedrijfsnaam]`,
  seizoensactie: `Het is weer tijd voor [seizoen]! We helpen u graag met [dienst].

Boek voor [datum] en ontvang [korting]% korting.

Neem contact op voor een afspraak.`,
  upsell: `Bedankt voor uw vertrouwen in ons. We willen u graag wijzen op onze [dienst] service.

Als bestaande klant ontvangt u [korting]% korting op de eerste sessie.`,
}

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string; city: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', campaign_type: 'burenactie', project_id: '', area: '', discount_pct: 10, valid_until: '', message_template: DEFAULT_TEMPLATES.burenactie })

  useEffect(() => {
    fetch('/api/campaigns').then(r => r.json()).then(d => setCampaigns(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])

  function updateType(type: string) {
    setForm({ ...form, campaign_type: type, message_template: DEFAULT_TEMPLATES[type] || '' })
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        campaign_type: form.campaign_type,
        project_id: form.project_id || null,
        area: form.area || null,
        discount_pct: form.discount_pct,
        valid_until: form.valid_until || null,
        message_template: form.message_template || null,
      }),
    })
    if (res.ok) {
      const c = await res.json()
      setCampaigns(prev => [c, ...prev])
      setShowNew(false)
    }
  }

  async function updateCampaign(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/campaigns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    if (res.ok) {
      const updated = await res.json()
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
    }
  }

  function copyTemplate(template: string) {
    navigator.clipboard.writeText(template || '')
  }

  const totalLeads = campaigns.reduce((s, c) => s + c.leads_generated, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const convRate = totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campagnes</h1>
          <p className="text-sm text-zinc-400">{campaigns.length} campagnes · {totalLeads} leads · {totalConversions} conversies ({convRate}%)</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          <Plus className="h-4 w-4" /> Nieuwe campagne
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400">Laden...</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-400">Nog geen campagnes.</p>
          <p className="text-xs text-zinc-400 mt-1">Start een burenactie na een afgerond project om meer klanten in dezelfde wijk te krijgen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{c.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[c.status]}`}>
                      {c.status === 'active' ? 'Actief' : c.status === 'draft' ? 'Concept' : c.status === 'completed' ? 'Afgerond' : 'Gestopt'}
                    </span>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-zinc-400">{TYPE_LABELS[c.campaign_type]}</span>
                    {c.discount_pct > 0 && <span className="text-xs text-green-400 font-medium">{c.discount_pct}% korting</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
                    {c.area && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.area}</span>}
                    {c.projects?.city && <span>{c.projects.name} — {c.projects.city}</span>}
                    {c.valid_until && <span>Geldig t/m {new Date(c.valid_until).toLocaleDateString('nl-NL')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{c.leads_generated}</div>
                    <div className="text-[10px] text-zinc-400">leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{c.conversions}</div>
                    <div className="text-[10px] text-zinc-400">klanten</div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                {c.message_template && (
                  <button onClick={() => copyTemplate(c.message_template!)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">
                    <Copy className="h-3 w-3" /> Kopieer template
                  </button>
                )}
                {c.status === 'active' && (
                  <>
                    <button onClick={() => updateCampaign(c.id, { leads_generated: c.leads_generated + 1 })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">
                      <Users className="h-3 w-3" /> +1 lead
                    </button>
                    <button onClick={() => updateCampaign(c.id, { conversions: c.conversions + 1 })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-green-400 hover:bg-green-500/10">
                      <TrendingUp className="h-3 w-3" /> +1 conversie
                    </button>
                  </>
                )}
                {c.status === 'draft' && (
                  <button onClick={() => updateCampaign(c.id, { status: 'active' })} className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white hover:bg-zinc-800">
                    Activeren
                  </button>
                )}
                {c.status === 'active' && (
                  <button onClick={() => updateCampaign(c.id, { status: 'completed' })} className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-white/10">
                    Afronden
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Campaign Dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-lg rounded-xl bg-foundri-deep p-6 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nieuwe campagne</h2>
            <form onSubmit={createCampaign} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Titel *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Burenactie Dorpsstraat Amstelveen" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Type</label>
                  <select value={form.campaign_type} onChange={e => updateType(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Gekoppeld project</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Selecteer...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Gebied</label>
                  <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Dorpsstraat 1-30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Korting %</label>
                  <input type="number" min="0" max="50" value={form.discount_pct} onChange={e => setForm({ ...form, discount_pct: parseInt(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Geldig tot</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300">Berichttemplate (kopieerbaar voor WhatsApp/brief)</label>
                <textarea value={form.message_template} onChange={e => setForm({ ...form, message_template: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={6} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">Annuleren</button>
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Aanmaken</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
