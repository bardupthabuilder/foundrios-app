'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronDown, ChevronUp, Save, Users, Building2 } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string | null
  plan: string | null
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  user_count: number
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState<string>('free')
  const [editStatus, setEditStatus] = useState<string>('trial')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/tenants')
    if (res.ok) {
      const data = await res.json()
      setTenants(data.tenants)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.slug || '').toLowerCase().includes(search.toLowerCase())
  )

  function expand(t: Tenant) {
    if (expandedId === t.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(t.id)
    setEditPlan(t.plan || 'free')
    setEditStatus(t.subscription_status)
    setSaveMsg('')
  }

  async function handleSave(id: string) {
    setSaving(true)
    setSaveMsg('')
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: editPlan, subscription_status: editStatus }),
    })
    if (res.ok) {
      setSaveMsg('Opgeslagen')
      fetchTenants()
    } else {
      const err = await res.json()
      setSaveMsg(`Fout: ${err.error}`)
    }
    setSaving(false)
  }

  function planBadge(plan: string | null) {
    const p = plan || 'free'
    if (p === 'scale') return 'bg-foundri-yellow/20 text-foundri-yellow'
    if (p === 'pro') return 'bg-blue-500/20 text-blue-400'
    return 'bg-white/10 text-zinc-400'
  }

  function statusBadge(status: string) {
    if (status === 'active') return 'bg-green-500/20 text-green-400'
    if (status === 'trial') return 'bg-orange-500/20 text-orange-400'
    return 'bg-red-500/20 text-red-400'
  }

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">Bedrijven</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Zoek op naam of slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-foundri-deep py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-foundri-yellow/30 focus:outline-none focus:ring-1 focus:ring-foundri-yellow/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-zinc-500">Laden...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">Geen bedrijven gevonden</p>
      ) : (
        <div className="rounded-lg border border-white/5 bg-foundri-deep divide-y divide-white/5">
          {filtered.map(t => (
            <div key={t.id}>
              <button
                onClick={() => expand(t)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.slug} &middot; {new Date(t.created_at).toLocaleDateString('nl-NL')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Users className="h-3 w-3" />
                    {t.user_count}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${planBadge(t.plan)}`}>{t.plan || 'free'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(t.subscription_status)}`}>{t.subscription_status}</span>
                  {expandedId === t.id ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                </div>
              </button>

              {expandedId === t.id && (
                <div className="border-t border-white/5 bg-foundri-surface px-4 py-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">Plan</label>
                      <select
                        value={editPlan}
                        onChange={e => setEditPlan(e.target.value)}
                        className="rounded-lg border border-white/10 bg-foundri-deep px-3 py-1.5 text-sm text-white focus:border-foundri-yellow/30 focus:outline-none"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">Status</label>
                      <select
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value)}
                        className="rounded-lg border border-white/10 bg-foundri-deep px-3 py-1.5 text-sm text-white focus:border-foundri-yellow/30 focus:outline-none"
                      >
                        <option value="trial">Trial</option>
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleSave(t.id)}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-lg bg-foundri-yellow px-3 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                    {saveMsg && (
                      <p className={`text-xs ${saveMsg.startsWith('Fout') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</p>
                    )}
                  </div>
                  {t.trial_ends_at && (
                    <p className="mt-3 text-xs text-zinc-500">
                      Trial eindigt: {new Date(t.trial_ends_at).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
