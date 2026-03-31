'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import {
  Plus,
  Sparkles,
  LayoutGrid,
  CalendarDays,
  List,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentItem = {
  id: string
  title: string
  hook: string | null
  body: string | null
  cta: string | null
  status: string | null
  type: string | null
  content_template: string | null
  platforms: string[] | null
  visual_type: string | null
  scheduled_date: string | null
  published_date: string | null
  tags: string[] | null
  ai_generated: boolean | null
  primary_topic: string | null
  created_at: string | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUSES = [
  { key: 'ideeen', label: 'Ideeën', color: 'bg-purple-100 text-purple-700' },
  { key: 'te_maken', label: 'Te maken', color: 'bg-blue-100 text-blue-700' },
  { key: 'in_productie', label: 'In productie', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'klaar', label: 'Klaar', color: 'bg-green-100 text-green-700' },
  { key: 'gepubliceerd', label: 'Gepubliceerd', color: 'bg-zinc-100 text-zinc-700' },
  { key: 'herbruikbaar', label: 'Herbruikbaar', color: 'bg-emerald-100 text-emerald-700' },
]

const TEMPLATES = [
  { key: 'before_after', label: 'Before/After' },
  { key: 'timelapse', label: 'Timelapse Reel' },
  { key: 'foto_hook', label: 'Foto + Hook' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'educatie', label: 'Educatie/Tips' },
  { key: 'lead_magnet', label: 'Lead Magnet' },
]

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', color: '#E4405F' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'tiktok', label: 'TikTok', color: '#000000' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000' },
  { key: 'google_business', label: 'Google Business', color: '#4285F4' },
  { key: 'nextdoor', label: 'Nextdoor', color: '#8ED500' },
]

const getStatusConfig = (key: string) =>
  STATUSES.find((s) => s.key === key) ?? STATUSES[0]

const getTemplateLabel = (key: string | null) =>
  TEMPLATES.find((t) => t.key === key)?.label ?? key ?? '—'

// ─── Platform Dots ────────────────────────────────────────────────────────────

function PlatformDots({ platforms }: { platforms: string[] | null }) {
  if (!platforms?.length) return null
  return (
    <div className="flex items-center gap-0.5">
      {platforms.map((p) => {
        const cfg = PLATFORMS.find((pl) => pl.key === p)
        if (!cfg) return null
        return (
          <span
            key={p}
            title={cfg.label}
            className="h-2 w-2 rounded-full inline-block"
            style={{ backgroundColor: cfg.color }}
          />
        )
      })}
    </div>
  )
}

// ─── Kanban Card (draggable) ──────────────────────────────────────────────────

function KanbanCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const sc = getStatusConfig(item.status ?? 'ideeen')

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-40 shadow-lg' : ''
      }`}
    >
      <p
        className="text-sm font-medium text-zinc-900 leading-snug mb-2 cursor-pointer hover:underline"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClick}
      >
        {item.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.content_template && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              {getTemplateLabel(item.content_template)}
            </span>
          )}
          {item.ai_generated && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-600">
              AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <PlatformDots platforms={item.platforms} />
          {item.scheduled_date && (
            <span className="text-[10px] text-zinc-400 whitespace-nowrap">
              {new Date(item.scheduled_date).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Column (droppable) ────────────────────────────────────────────────

function KanbanColumn({
  status,
  items,
  onAddNew,
  onCardClick,
}: {
  status: (typeof STATUSES)[0]
  items: ContentItem[]
  onAddNew: () => void
  onCardClick: (item: ContentItem) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key })

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
          <span className="text-xs text-zinc-400">{items.length}</span>
        </div>
      </div>

      {/* Droppable zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 space-y-2 min-h-[120px] transition-colors ${
          isOver ? 'bg-zinc-50 ring-2 ring-zinc-200' : 'bg-zinc-50/50'
        }`}
      >
        {items.map((item) => (
          <KanbanCard
            key={item.id}
            item={item}
            onClick={() => onCardClick(item)}
          />
        ))}

        {/* Add button */}
        <button
          onClick={onAddNew}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-200 py-2 text-xs text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Toevoegen
        </button>
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

const getWeekDates = (offset: number) => {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function WeekView({
  items,
  onDayClick,
  onCardClick,
}: {
  items: ContentItem[]
  onDayClick: (date: Date) => void
  onCardClick: (item: ContentItem) => void
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const dates = getWeekDates(weekOffset)

  const itemsOnDate = (date: Date) => {
    const iso = date.toISOString().slice(0, 10)
    return items.filter((item) => item.scheduled_date === iso)
  }

  const weekLabel = `${dates[0].toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  })} – ${dates[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="rounded-lg p-1.5 hover:bg-zinc-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-600" />
        </button>
        <span className="text-sm font-medium text-zinc-700">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="rounded-lg p-1.5 hover:bg-zinc-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-zinc-600" />
        </button>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 gap-2">
        {dates.map((date, i) => {
          const dayItems = itemsOnDate(date)
          const isToday = date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
          return (
            <div key={i} className="min-h-[160px]">
              {/* Day header */}
              <div className={`mb-1.5 text-center rounded-lg py-1 ${isToday ? 'bg-zinc-900' : ''}`}>
                <p className={`text-[10px] font-medium ${isToday ? 'text-white' : 'text-zinc-400'}`}>
                  {DAY_LABELS[i]}
                </p>
                <p className={`text-sm font-bold ${isToday ? 'text-white' : 'text-zinc-900'}`}>
                  {date.getDate()}
                </p>
              </div>

              {/* Day content area */}
              <div
                className="rounded-lg bg-zinc-50 p-1.5 min-h-[120px] cursor-pointer hover:bg-zinc-100 transition-colors space-y-1"
                onClick={() => onDayClick(date)}
              >
                {dayItems.map((item) => {
                  const sc = getStatusConfig(item.status ?? 'ideeen')
                  return (
                    <div
                      key={item.id}
                      className="rounded-md bg-white border p-1.5 cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCardClick(item)
                      }}
                    >
                      <p className="text-[10px] font-medium text-zinc-800 leading-tight line-clamp-2">
                        {item.title}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <PlatformDots platforms={item.platforms} />
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Lijst View ───────────────────────────────────────────────────────────────

function LijstView({
  items,
  onCardClick,
}: {
  items: ContentItem[]
  onCardClick: (item: ContentItem) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [templateFilter, setTemplateFilter] = useState('')

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.primary_topic ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || item.status === statusFilter
    const matchTemplate = !templateFilter || item.content_template === templateFilter
    return matchSearch && matchStatus && matchTemplate
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek content..."
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        >
          <option value="">Alle statussen</option>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        >
          <option value="">Alle templates</option>
          {TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">Geen items gevonden</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((item) => {
            const sc = getStatusConfig(item.status ?? 'ideeen')
            return (
              <div
                key={item.id}
                onClick={() => onCardClick(item)}
                className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{item.title}</p>
                  {item.primary_topic && (
                    <p className="text-xs text-zinc-400 truncate">{item.primary_topic}</p>
                  )}
                </div>

                {/* Template badge */}
                {item.content_template && (
                  <span className="hidden sm:inline-block shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                    {getTemplateLabel(item.content_template)}
                  </span>
                )}

                {/* Status badge */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${sc.color}`}>
                  {sc.label}
                </span>

                {/* Platforms */}
                <div className="shrink-0">
                  <PlatformDots platforms={item.platforms} />
                </div>

                {/* Date */}
                <span className="hidden sm:block shrink-0 text-xs text-zinc-400 w-20 text-right">
                  {item.scheduled_date
                    ? new Date(item.scheduled_date).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── New Content Dialog ───────────────────────────────────────────────────────

type NewContentForm = {
  title: string
  content_template: string
  status: string
  platforms: string[]
  scheduled_date: string
}

function NewContentDialog({
  open,
  onClose,
  onCreated,
  defaultStatus,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  onCreated: (item: ContentItem) => void
  defaultStatus?: string
  defaultDate?: string
}) {
  const [form, setForm] = useState<NewContentForm>({
    title: '',
    content_template: '',
    status: defaultStatus ?? 'ideeen',
    platforms: ['instagram', 'linkedin'],
    scheduled_date: defaultDate ?? '',
  })
  const [saving, setSaving] = useState(false)

  // Reset when defaults change
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      status: defaultStatus ?? 'ideeen',
      scheduled_date: defaultDate ?? '',
    }))
  }, [defaultStatus, defaultDate, open])

  const togglePlatform = (key: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(key)
        ? prev.platforms.filter((p) => p !== key)
        : [...prev.platforms, key],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content_template: form.content_template || null,
          status: form.status,
          platforms: form.platforms,
          scheduled_date: form.scheduled_date || null,
        }),
      })
      if (res.ok) {
        const item = await res.json()
        onCreated(item)
        setForm({ title: '', content_template: '', status: 'ideeen', platforms: ['instagram', 'linkedin'], scheduled_date: '' })
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Nieuw content item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-zinc-600">Titel *</label>
            <input
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Before/after dakdekkers Amersfoort"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>

          {/* Template + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600">Template</label>
              <select
                value={form.content_template}
                onChange={(e) => setForm({ ...form, content_template: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
              >
                <option value="">Selecteer...</option>
                {TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
              >
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-xs font-medium text-zinc-600">Platforms</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <label key={p.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.platforms.includes(p.key)}
                    onChange={() => togglePlatform(p.key)}
                    className="rounded"
                  />
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs text-zinc-700">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-zinc-600">Datum (optioneel)</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Aanmaken...' : 'Aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── AI Batch Dialog ──────────────────────────────────────────────────────────

function AIBatchDialog({
  open,
  onClose,
  onBatchCreated,
}: {
  open: boolean
  onClose: () => void
  onBatchCreated: (items: ContentItem[]) => void
}) {
  const [topics, setTopics] = useState('')
  const [template, setTemplate] = useState('')
  const [context, setContext] = useState('')
  const [platforms, setPlatforms] = useState(['instagram', 'linkedin'])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const togglePlatform = (key: string) => {
    setPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const topicList = topics
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicList.length) return
    setLoading(true)
    setProgress(`${topicList.length} items genereren...`)
    try {
      const res = await fetch('/api/content/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: topicList,
          content_template: template || null,
          context: context || null,
          platforms,
        }),
      })
      if (res.ok) {
        const items = await res.json()
        onBatchCreated(Array.isArray(items) ? items : [])
        setTopics('')
        setTemplate('')
        setContext('')
        setProgress('')
        onClose()
      } else {
        setProgress('Fout bij genereren. Probeer opnieuw.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-semibold">AI Content Batch</h2>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Topics */}
          <div>
            <label className="text-xs font-medium text-zinc-600">Topics (één per regel) *</label>
            <textarea
              required
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder={"Voor/na dakdekkers Amersfoort\nTimelapse tuinaanleg\nKlant over reactietijd"}
              rows={5}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
            {topicList.length > 0 && (
              <p className="mt-1 text-xs text-zinc-400">{topicList.length} topics</p>
            )}
          </div>

          {/* Template + Context */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
              >
                <option value="">Selecteer...</option>
                {TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Context (optioneel)</label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Niche, toon..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300"
              />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-xs font-medium text-zinc-600">Platforms</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.slice(0, 4).map((p) => (
                <label key={p.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platforms.includes(p.key)}
                    onChange={() => togglePlatform(p.key)}
                    className="rounded"
                  />
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs text-zinc-700">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-700">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{progress}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading || !topicList.length}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Genereren...' : `Genereer ${topicList.length || 0} items`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = 'kanban' | 'week' | 'lijst'

export default function ContentPage() {
  const router = useRouter()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('kanban')

  // Dialog state
  const [showNew, setShowNew] = useState(false)
  const [newDefaultStatus, setNewDefaultStatus] = useState<string>('ideeen')
  const [newDefaultDate, setNewDefaultDate] = useState<string>('')
  const [showBatch, setShowBatch] = useState(false)

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null)

  // Fetch all content
  const fetchContent = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/content')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  // Computed stats
  const ideeenCount = items.filter((i) => i.status === 'ideeen').length
  const teMakenCount = items.filter((i) => i.status === 'te_maken').length
  const thisWeekCount = (() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return items.filter((i) => {
      if (!i.scheduled_date) return false
      const d = new Date(i.scheduled_date)
      return d >= monday && d <= sunday
    }).length
  })()

  // Group items by status for kanban
  const itemsByStatus = STATUSES.reduce(
    (acc, s) => {
      acc[s.key] = items.filter((i) => i.status === s.key)
      return acc
    },
    {} as Record<string, ContentItem[]>
  )

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const itemId = active.id as string
    const newStatus = over.id as string

    // Only update if dropped on a valid status column
    if (!STATUSES.find((s) => s.key === newStatus)) return

    const item = items.find((i) => i.id === itemId)
    if (!item || item.status === newStatus) return

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
    )

    // API call
    await fetch(`/api/content/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  // Handlers
  const handleCardClick = (item: ContentItem) => {
    router.push(`/dashboard/content/${item.id}`)
  }

  const handleAddNew = (status: string) => {
    setNewDefaultStatus(status)
    setNewDefaultDate('')
    setShowNew(true)
  }

  const handleDayClick = (date: Date) => {
    setNewDefaultStatus('ideeen')
    setNewDefaultDate(date.toISOString().slice(0, 10))
    setShowNew(true)
  }

  const handleItemCreated = (item: ContentItem) => {
    setItems((prev) => [item, ...prev])
  }

  const handleBatchCreated = (newItems: ContentItem[]) => {
    setItems((prev) => [...newItems, ...prev])
  }

  const viewButtons: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'kanban', label: 'Kanban', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { key: 'week', label: 'Week', icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { key: 'lijst', label: 'Lijst', icon: <List className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Content</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {ideeenCount} ideeën · {teMakenCount} te maken · {thisWeekCount} gepland deze week
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-white p-0.5 gap-0.5">
            {viewButtons.map((b) => (
              <button
                key={b.key}
                onClick={() => setView(b.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  view === b.key
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {b.icon}
                {b.label}
              </button>
            ))}
          </div>

          {/* New button */}
          <button
            onClick={() => {
              setNewDefaultStatus('ideeen')
              setNewDefaultDate('')
              setShowNew(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nieuw
          </button>

          {/* AI Batch button */}
          <button
            onClick={() => setShowBatch(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-violet-500" />
            AI Batch
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      ) : view === 'kanban' ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {STATUSES.map((status) => (
                <KanbanColumn
                  key={status.key}
                  status={status}
                  items={itemsByStatus[status.key] ?? []}
                  onAddNew={() => handleAddNew(status.key)}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeItem ? (
              <div className="rounded-lg border bg-white p-3 shadow-xl w-64 rotate-2 cursor-grabbing">
                <p className="text-sm font-medium text-zinc-900 leading-snug mb-2">
                  {activeItem.title}
                </p>
                <div className="flex items-center gap-1.5">
                  {activeItem.content_template && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                      {getTemplateLabel(activeItem.content_template)}
                    </span>
                  )}
                  <PlatformDots platforms={activeItem.platforms} />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : view === 'week' ? (
        <WeekView
          items={items}
          onDayClick={handleDayClick}
          onCardClick={handleCardClick}
        />
      ) : (
        <LijstView items={items} onCardClick={handleCardClick} />
      )}

      {/* Dialogs */}
      <NewContentDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={handleItemCreated}
        defaultStatus={newDefaultStatus}
        defaultDate={newDefaultDate}
      />
      <AIBatchDialog
        open={showBatch}
        onClose={() => setShowBatch(false)}
        onBatchCreated={handleBatchCreated}
      />
    </div>
  )
}
