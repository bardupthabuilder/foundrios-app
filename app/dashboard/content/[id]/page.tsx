'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Bot, ExternalLink, Save, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Distribution = {
  id: string
  platform: string
  status: string
  published_at: string | null
  post_url: string | null
}

type Asset = {
  id: string
  asset_type: string
  url: string | null
  file_name: string | null
  sort_order: number
}

type ContentItem = {
  id: string
  title: string
  hook: string | null
  body: string | null
  angle: string | null
  cta: string | null
  status: string | null
  type: string | null
  content_template: string | null
  platforms: string[] | null
  visual_type: string | null
  visual_prompt: string | null
  script: string | null
  scheduled_date: string | null
  published_date: string | null
  tags: string[] | null
  ai_generated: boolean | null
  primary_topic: string | null
  hook_score: number | null
  clarity_score: number | null
  cta_strength: number | null
  created_at: string | null
  content_distributions: Distribution[]
  content_assets: Asset[]
}

const STATUSES = [
  { key: 'ideeen', label: 'Ideeën' },
  { key: 'te_maken', label: 'Te maken' },
  { key: 'in_productie', label: 'In productie' },
  { key: 'klaar', label: 'Klaar' },
  { key: 'gepubliceerd', label: 'Gepubliceerd' },
  { key: 'herbruikbaar', label: 'Herbruikbaar' },
]

const TEMPLATES = [
  { key: 'before_after', label: 'Before/After' },
  { key: 'timelapse', label: 'Timelapse Reel' },
  { key: 'foto_hook', label: 'Foto + Hook' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'educatie', label: 'Educatie/Tips' },
  { key: 'lead_magnet', label: 'Lead Magnet' },
]

const VISUAL_TYPES = [
  { key: 'foto', label: 'Foto' },
  { key: 'video', label: 'Video' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'reel', label: 'Reel' },
]

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube Shorts' },
  { key: 'google_business', label: 'Google Business' },
  { key: 'nextdoor', label: 'Nextdoor' },
]

export default function ContentDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [item, setItem] = useState<ContentItem | null>(null)
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingField, setGeneratingField] = useState<string | null>(null)
  const [aiCache, setAiCache] = useState<Record<string, string> | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    fetchItem()
  }, [id])

  async function fetchItem() {
    const res = await fetch(`/api/content/${id}`)
    if (res.ok) {
      const data: ContentItem = await res.json()
      setItem(data)
      setDistributions(data.content_distributions ?? [])
      setTagsInput((data.tags ?? []).join(', '))
    }
    setLoading(false)
  }

  function updateField(field: keyof ContentItem, value: unknown) {
    setItem((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  async function handleSave() {
    if (!item) return
    setSaving(true)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    await fetch(`/api/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title,
        hook: item.hook,
        body: item.body,
        cta: item.cta,
        status: item.status,
        content_template: item.content_template,
        visual_type: item.visual_type,
        visual_prompt: item.visual_prompt,
        script: item.script,
        scheduled_date: item.scheduled_date || null,
        published_date: item.published_date || null,
        tags,
        platforms: item.platforms,
      }),
    })
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/content/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      router.push('/dashboard/content')
    }
    setDeleting(false)
  }

  async function callGenerate(): Promise<Record<string, string> | null> {
    if (!item) return null
    const res = await fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: item.title || 'content',
        content_template: item.content_template || 'foto_hook',
        platforms: item.platforms && item.platforms.length > 0 ? item.platforms : ['instagram'],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data
  }

  async function handleGenerateAll() {
    if (!item) return
    setGenerating(true)
    const data = await callGenerate()
    if (data) {
      setAiCache(data)
      setItem((prev) =>
        prev
          ? {
              ...prev,
              hook: data.hook ?? prev.hook,
              body: data.body ?? prev.body,
              cta: data.cta ?? prev.cta,
              visual_prompt: data.visual_prompt ?? prev.visual_prompt,
              script: data.script ?? prev.script,
            }
          : prev
      )
      if (data.tags) {
        const tagsArr = Array.isArray(data.tags) ? data.tags : []
        setTagsInput(tagsArr.join(', '))
      }
    }
    setGenerating(false)
  }

  async function handleGenerateField(field: string) {
    if (!item) return
    setGeneratingField(field)
    let cached = aiCache
    if (!cached) {
      cached = await callGenerate()
      if (cached) setAiCache(cached)
    }
    if (cached && cached[field] !== undefined) {
      setItem((prev) => prev ? { ...prev, [field]: cached![field] } : prev)
    }
    setGeneratingField(null)
  }

  async function handlePlatformToggle(platformKey: string, checked: boolean) {
    if (!item) return
    const current = item.platforms ?? []
    const updated = checked
      ? [...current, platformKey]
      : current.filter((p) => p !== platformKey)
    updateField('platforms', updated)
    await fetch(`/api/content/${id}/distribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platforms: updated }),
    })
    fetchItem()
  }

  async function handleMarkPublished(distId: string) {
    await fetch(`/api/content-distributions/${distId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'gepubliceerd' }),
    })
    fetchItem()
  }

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>
  if (!item) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-500">Content item niet gevonden</div>

  const isVideo = item.visual_type === 'video' || item.visual_type === 'reel'
  const hasAiScores = item.hook_score !== null || item.clarity_score !== null || item.cta_strength !== null

  return (
    <div className="flex min-h-screen flex-col pb-24 pt-16 lg:pt-0">
      <div className="mx-auto w-full max-w-6xl p-4 lg:p-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard/content')}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar content
        </button>

        {/* 2-col layout */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column */}
          <div className="flex flex-col gap-5 lg:w-2/3">
            {/* Title */}
            <input
              value={item.title ?? ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-foundri-deep px-4 py-3 text-2xl font-bold text-white placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="Titel van dit content item..."
            />

            {/* Hook */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">Hook</label>
                <button
                  onClick={() => handleGenerateField('hook')}
                  disabled={generatingField === 'hook'}
                  className="inline-flex items-center gap-1 rounded-md bg-foundri-card px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/15 disabled:opacity-50"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {generatingField === 'hook' ? 'Bezig...' : 'AI'}
                </button>
              </div>
              <input
                value={item.hook ?? ''}
                onChange={(e) => updateField('hook', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                placeholder="Pakkende eerste zin die direct aandacht trekt..."
              />
            </div>

            {/* Caption / Body */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">Caption</label>
                <button
                  onClick={() => handleGenerateField('body')}
                  disabled={generatingField === 'body'}
                  className="inline-flex items-center gap-1 rounded-md bg-foundri-card px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/15 disabled:opacity-50"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {generatingField === 'body' ? 'Bezig...' : 'AI'}
                </button>
              </div>
              <textarea
                rows={6}
                value={item.body ?? ''}
                onChange={(e) => updateField('body', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-y"
                placeholder="De volledige tekst / caption voor dit content item..."
              />
            </div>

            {/* CTA */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">CTA</label>
                <button
                  onClick={() => handleGenerateField('cta')}
                  disabled={generatingField === 'cta'}
                  className="inline-flex items-center gap-1 rounded-md bg-foundri-card px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/15 disabled:opacity-50"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {generatingField === 'cta' ? 'Bezig...' : 'AI'}
                </button>
              </div>
              <input
                value={item.cta ?? ''}
                onChange={(e) => updateField('cta', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                placeholder="Reacteer, stuur een DM, klik de link in de bio..."
              />
            </div>

            {/* Script — only for video/reel */}
            {isVideo && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-200">Script</label>
                  <button
                    onClick={() => handleGenerateField('script')}
                    disabled={generatingField === 'script'}
                    className="inline-flex items-center gap-1 rounded-md bg-foundri-card px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/15 disabled:opacity-50"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    {generatingField === 'script' ? 'Bezig...' : 'AI'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={item.script ?? ''}
                  onChange={(e) => updateField('script', e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-y"
                  placeholder="Script voor de video of reel..."
                />
              </div>
            )}

            {/* Visual Prompt */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">Visual Prompt</label>
                <button
                  onClick={() => handleGenerateField('visual_prompt')}
                  disabled={generatingField === 'visual_prompt'}
                  className="inline-flex items-center gap-1 rounded-md bg-foundri-card px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/15 disabled:opacity-50"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {generatingField === 'visual_prompt' ? 'Bezig...' : 'AI'}
                </button>
              </div>
              <textarea
                rows={3}
                value={item.visual_prompt ?? ''}
                onChange={(e) => updateField('visual_prompt', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-y"
                placeholder="Beschrijf het beeld: hoek, licht, compositie, sfeer..."
              />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 lg:w-1/3">
            {/* Status & Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-200">Status & Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Status</label>
                  <select
                    value={item.status ?? ''}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="">— Selecteer —</option>
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Template</label>
                  <select
                    value={item.content_template ?? ''}
                    onChange={(e) => updateField('content_template', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="">— Selecteer —</option>
                    {TEMPLATES.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Visueel type</label>
                  <select
                    value={item.visual_type ?? ''}
                    onChange={(e) => updateField('visual_type', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="">— Selecteer —</option>
                    {VISUAL_TYPES.map((v) => (
                      <option key={v.key} value={v.key}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Planning */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-200">Planning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Geplande datum</label>
                  <input
                    type="date"
                    value={item.scheduled_date ?? ''}
                    onChange={(e) => updateField('scheduled_date', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Publicatiedatum</label>
                  <input
                    type="date"
                    value={item.published_date ?? ''}
                    onChange={(e) => updateField('published_date', e.target.value)}
                    disabled={item.status !== 'gepubliceerd'}
                    className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Tags (komma-gescheiden)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-foundri-deep px-3 py-2 text-sm text-zinc-100 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    placeholder="tuin, voor-na, zomer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platforms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-200">Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {PLATFORMS.map((platform) => {
                  const isEnabled = (item.platforms ?? []).includes(platform.key)
                  const dist = distributions.find((d) => d.platform === platform.key)
                  return (
                    <div key={platform.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`platform-${platform.key}`}
                        checked={isEnabled}
                        onChange={(e) => handlePlatformToggle(platform.key, e.target.checked)}
                        className="h-4 w-4 rounded border-white/15 accent-zinc-800"
                      />
                      <label
                        htmlFor={`platform-${platform.key}`}
                        className="flex-1 text-sm text-zinc-200 cursor-pointer"
                      >
                        {platform.label}
                      </label>
                      {isEnabled && dist && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-medium ${
                              dist.status === 'gepubliceerd'
                                ? 'text-emerald-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            {dist.status === 'gepubliceerd' ? 'Gepubliceerd' : 'Gepland'}
                          </span>
                          {dist.status === 'gepubliceerd' && dist.post_url && (
                            <a
                              href={dist.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-zinc-200"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {dist.status !== 'gepubliceerd' && (
                            <button
                              onClick={() => handleMarkPublished(dist.id)}
                              className="rounded bg-foundri-card px-1.5 py-0.5 text-xs text-zinc-300 hover:bg-white/15"
                            >
                              Markeer gepubliceerd
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* AI Scores — only if values exist */}
            {hasAiScores && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-200">AI Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.hook_score !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Hook score</span>
                      <span className="font-medium text-zinc-100">{item.hook_score}/10</span>
                    </div>
                  )}
                  {item.clarity_score !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Clarity score</span>
                      <span className="font-medium text-zinc-100">{item.clarity_score}/10</span>
                    </div>
                  )}
                  {item.cta_strength !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">CTA strength</span>
                      <span className="font-medium text-zinc-100">{item.cta_strength}/10</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-foundri-deep px-4 py-3 lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Bot className="h-4 w-4" />
            {generating ? 'Genereren...' : 'Genereer alles'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Verwijderen
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-foundri-deep p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-white mb-2">Content verwijderen?</h2>
            <p className="text-sm text-zinc-400 mb-5">
              Dit verwijdert het content item inclusief alle distributies. Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Verwijderen...' : 'Ja, verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
