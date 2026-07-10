'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Audience = 'internal' | 'tier' | 'granted'
type Tier = 'free' | 'pro' | 'scale'

type Playbook = {
  id: string
  slug: string
  title: string
  purpose: string | null
  min_tier: Tier
  audience: Audience
}

const AUDIENCE_LABELS: Record<Audience, { label: string; color: string }> = {
  internal: { label: 'Intern', color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20' },
  tier: { label: 'Per tier', color: 'bg-blue-500/15 text-blue-300 border-blue-500/20' },
  granted: { label: 'Granted', color: 'bg-foundri-yellow/15 text-foundri-yellow border-foundri-yellow/20' },
}

export function PlaybookRow({ playbook }: { playbook: Playbook }) {
  const router = useRouter()
  const [audience, setAudience] = useState<Audience>(playbook.audience)
  const [minTier, setMinTier] = useState<Tier>(playbook.min_tier)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const r = await fetch(`/api/admin/playbooks/${playbook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, min_tier: minTier }),
      })
      if (r.ok) {
        setDirty(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  function onAudienceChange(v: Audience) {
    setAudience(v)
    setDirty(true)
  }
  function onTierChange(v: Tier) {
    setMinTier(v)
    setDirty(true)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-foundri-deep p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{playbook.title}</p>
        {playbook.purpose && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">{playbook.purpose}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${AUDIENCE_LABELS[audience].color}`}>
          {AUDIENCE_LABELS[audience].label}
        </span>

        <select
          value={audience}
          onChange={e => onAudienceChange(e.target.value as Audience)}
          className="rounded border border-white/10 bg-foundri-graphite px-2 py-1 text-xs text-white"
        >
          <option value="internal">Intern</option>
          <option value="tier">Per tier</option>
          <option value="granted">Granted</option>
        </select>

        {audience === 'tier' && (
          <select
            value={minTier}
            onChange={e => onTierChange(e.target.value as Tier)}
            className="rounded border border-white/10 bg-foundri-graphite px-2 py-1 text-xs text-white"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="scale">Scale</option>
          </select>
        )}

        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="rounded bg-foundri-yellow px-2.5 py-1 text-xs font-semibold text-foundri-deep transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}
