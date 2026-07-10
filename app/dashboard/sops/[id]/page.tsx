'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Plus, ArrowUp, ArrowDown, Smartphone, Lock } from 'lucide-react'
import { useFeature } from '@/lib/hooks/useFeature'

type Step = { title: string; description?: string; checklist?: string[] }
type Sop = {
  id: string
  title: string
  category: 'operations' | 'field_work' | 'sales' | 'admin'
  description: string | null
  steps: Step[]
  version: number
  source: 'tenant' | 'foundri_seed'
  status: string
}

export default function SopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [sop, setSop] = useState<Sop | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const { allowed: canEdit, loading: featureLoading } = useFeature('sops_edit')

  useEffect(() => {
    fetch(`/api/sops/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSop(data))
  }, [id])

  function update(patch: Partial<Sop>) {
    if (!sop) return
    setSop({ ...sop, ...patch })
  }

  function updateStep(idx: number, patch: Partial<Step>) {
    if (!sop) return
    const steps = [...sop.steps]
    steps[idx] = { ...steps[idx], ...patch }
    update({ steps })
  }

  function addStep() {
    if (!sop) return
    update({ steps: [...sop.steps, { title: '', description: '' }] })
  }

  function removeStep(idx: number) {
    if (!sop) return
    update({ steps: sop.steps.filter((_, i) => i !== idx) })
  }

  function moveStep(idx: number, dir: -1 | 1) {
    if (!sop) return
    const target = idx + dir
    if (target < 0 || target >= sop.steps.length) return
    const steps = [...sop.steps]
    ;[steps[idx], steps[target]] = [steps[target], steps[idx]]
    update({ steps })
  }

  async function save() {
    if (!sop || !canEdit || saving) return
    setSaving(true)
    try {
      const r = await fetch(`/api/sops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sop.title,
          category: sop.category,
          description: sop.description,
          steps: sop.steps.filter((s) => s.title.trim().length > 0),
        }),
      })
      if (r.ok) {
        const fresh = await r.json()
        setSop(fresh)
        setSavedAt(new Date())
      }
    } finally {
      setSaving(false)
    }
  }

  async function archive() {
    if (!sop || !canEdit) return
    if (!confirm('Deze SOP archiveren?')) return
    const r = await fetch(`/api/sops/${id}`, { method: 'DELETE' })
    if (r.ok) router.push('/dashboard/sops')
  }

  if (!sop) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>

  const readOnly = !canEdit && !featureLoading

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-3xl">
      <Link href="/dashboard/sops" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Terug naar SOPs
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <input
            value={sop.title}
            onChange={(e) => update({ title: e.target.value })}
            disabled={readOnly}
            className="w-full bg-transparent text-2xl font-bold text-white outline-none disabled:cursor-not-allowed"
          />
          <div className="mt-2 flex items-center gap-2">
            <select
              value={sop.category}
              onChange={(e) => update({ category: e.target.value as Sop['category'] })}
              disabled={readOnly}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white disabled:cursor-not-allowed"
            >
              <option value="operations">Operations</option>
              <option value="field_work">In het veld</option>
              <option value="sales">Sales</option>
              <option value="admin">Administratie</option>
            </select>
            <span className="text-xs text-zinc-500">v{sop.version}</span>
            {sop.source === 'foundri_seed' && (
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-white/40">standaard</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/dashboard/sops/${id}/checklist`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            <Smartphone className="h-4 w-4" />
            Checklist
          </a>
          {readOnly ? (
            <Link
              href="/dashboard/billing/upgrade"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foundri-yellow/20 px-3 py-2 text-sm text-foundri-yellow hover:bg-foundri-yellow/30"
            >
              <Lock className="h-4 w-4" />
              Pro vereist om aan te passen
            </Link>
          ) : (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-foundri-deep hover:brightness-110 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
              {sop.source === 'tenant' && (
                <button
                  onClick={archive}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Archiveer
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {savedAt && (
        <p className="mb-4 text-xs text-emerald-400">Opgeslagen om {savedAt.toLocaleTimeString('nl-NL')}</p>
      )}

      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Korte omschrijving</label>
        <textarea
          value={sop.description || ''}
          onChange={(e) => update({ description: e.target.value })}
          disabled={readOnly}
          rows={2}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-foundri-yellow disabled:cursor-not-allowed"
          placeholder="Wanneer en waarvoor gebruik je deze SOP?"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Stappen</h2>
          {!readOnly && (
            <button
              onClick={addStep}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Stap toevoegen
            </button>
          )}
        </div>

        {sop.steps.map((step, idx) => (
          <div key={idx} className="rounded-lg border border-white/10 bg-foundri-deep p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foundri-yellow/20 text-xs font-semibold text-foundri-yellow">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-2">
                <input
                  value={step.title}
                  onChange={(e) => updateStep(idx, { title: e.target.value })}
                  disabled={readOnly}
                  placeholder="Stap titel"
                  className="w-full bg-transparent text-sm font-medium text-white outline-none disabled:cursor-not-allowed"
                />
                <textarea
                  value={step.description || ''}
                  onChange={(e) => updateStep(idx, { description: e.target.value })}
                  disabled={readOnly}
                  rows={2}
                  placeholder="Wat moet er gedaan worden? Wees concreet."
                  className="w-full resize-none rounded-md border border-white/5 bg-white/5 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-foundri-yellow disabled:cursor-not-allowed"
                />
              </div>
              {!readOnly && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveStep(idx, -1)} disabled={idx === 0} className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveStep(idx, 1)} disabled={idx === sop.steps.length - 1} className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeStep(idx)} className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {sop.steps.length === 0 && (
          <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-xs text-zinc-500">
            Geen stappen. {!readOnly && 'Voeg stappen toe om deze SOP bruikbaar te maken.'}
          </div>
        )}
      </div>
    </div>
  )
}
