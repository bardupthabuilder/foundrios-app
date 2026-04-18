'use client'

import { useEffect, useState } from 'react'
import { Zap, Plus, Trash2, X } from 'lucide-react'

type AutomationRule = {
  id: string
  name: string
  trigger_type: string
  action_type: string
  config: Record<string, unknown>
  delay_hours: number
  is_active: boolean
  created_at: string
}

const TRIGGER_LABELS: Record<string, string> = {
  lead_new: 'Nieuwe lead binnenkomt',
  lead_stale: 'Lead niet beantwoord',
  quote_stale: 'Offerte niet beantwoord',
  invoice_overdue: 'Factuur verlopen',
  project_delivered: 'Project opgeleverd',
  maintenance_due: 'Onderhoud gepland',
}

const ACTION_LABELS: Record<string, string> = {
  notification: 'Stuur notificatie',
  email: 'Stuur e-mail',
  status_change: 'Wijzig status',
  task_create: 'Maak taak aan',
}

const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value, label }))
const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState('lead_new')
  const [actionType, setActionType] = useState('notification')
  const [delayHours, setDelayHours] = useState(0)

  useEffect(() => {
    fetchRules()
  }, [])

  async function fetchRules() {
    setLoading(true)
    const res = await fetch('/api/automations')
    if (res.ok) {
      const data = await res.json()
      setRules(data)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)

    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        trigger_type: triggerType,
        action_type: actionType,
        delay_hours: delayHours,
        is_active: true,
      }),
    })

    if (res.ok) {
      setName('')
      setTriggerType('lead_new')
      setActionType('notification')
      setDelayHours(0)
      setShowForm(false)
      await fetchRules()
    }
    setSaving(false)
  }

  async function toggleActive(rule: AutomationRule) {
    const res = await fetch(`/api/automations/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    if (res.ok) {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      )
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRules((prev) => prev.filter((r) => r.id !== id))
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Automatiseringen</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Regels die automatisch acties uitvoeren op basis van triggers.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-[#0F1115] transition-colors hover:bg-foundri-yellow/90"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Annuleren' : 'Nieuwe regel'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-white/5 bg-[#1A1F29] p-6 space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Herinnering bij stale lead"
              className="w-full rounded-lg border border-white/10 bg-[#0F1115] px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-foundri-yellow/50 focus:outline-none focus:ring-1 focus:ring-foundri-yellow/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Trigger</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F1115] px-3 py-2 text-sm text-white focus:border-foundri-yellow/50 focus:outline-none focus:ring-1 focus:ring-foundri-yellow/50"
              >
                {TRIGGER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Actie</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F1115] px-3 py-2 text-sm text-white focus:border-foundri-yellow/50 focus:outline-none focus:ring-1 focus:ring-foundri-yellow/50"
              >
                {ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Vertraging (uren)
              </label>
              <input
                type="number"
                min={0}
                value={delayHours}
                onChange={(e) => setDelayHours(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0F1115] px-3 py-2 text-sm text-white focus:border-foundri-yellow/50 focus:outline-none focus:ring-1 focus:ring-foundri-yellow/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-foundri-yellow px-5 py-2 text-sm font-semibold text-[#0F1115] transition-colors hover:bg-foundri-yellow/90 disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Regel aanmaken'}
            </button>
          </div>
        </form>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500">Laden...</div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#1A1F29] py-20 text-center">
          <Zap className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">Nog geen automatiseringen.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Maak je eerste regel aan om tijd te besparen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-[#1A1F29] px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{rule.name}</span>
                  {!rule.is_active && (
                    <span className="rounded bg-[#282A2E] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                      Inactief
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                  <span>{TRIGGER_LABELS[rule.trigger_type] ?? rule.trigger_type}</span>
                  <span className="text-zinc-600">&rarr;</span>
                  <span>{ACTION_LABELS[rule.action_type] ?? rule.action_type}</span>
                  {rule.delay_hours > 0 && (
                    <span className="text-zinc-500">
                      Na {rule.delay_hours} uur
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-4 flex items-center gap-2">
                <button
                  onClick={() => toggleActive(rule)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    rule.is_active ? 'bg-foundri-yellow' : 'bg-[#282A2E]'
                  }`}
                  title={rule.is_active ? 'Deactiveren' : 'Activeren'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      rule.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
