import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Plus, Wrench, StickyNote } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { addNote } from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Brand {
  id: string
  slug: string
  name: string
  description: string | null
  brand_color: string | null
}

interface BrandWithStats extends Brand {
  tool_count: number
  note_count: number
  last_note_at: string | null
}

async function getData() {
  const sb = createServiceClient() as any

  const [brandsRes, toolsRes, notesRes, recentNotesRes] = await Promise.all([
    sb.from('content_brands').select('id, slug, name, description, brand_color').order('name'),
    sb.from('content_ai_tools').select('brand_id, status').eq('status', 'active'),
    sb.from('content_notes').select('brand_id, created_at'),
    sb.from('content_notes').select('id, brand_id, tool_id, title, body, tags, created_at').order('created_at', { ascending: false }).limit(15),
  ])

  const brands = (brandsRes.data ?? []) as Brand[]
  const tools = toolsRes.data ?? []
  const notes = notesRes.data ?? []
  const recentNotes = recentNotesRes.data ?? []

  const toolCount = new Map<string, number>()
  for (const t of tools) toolCount.set(t.brand_id, (toolCount.get(t.brand_id) ?? 0) + 1)

  const noteCount = new Map<string, number>()
  const lastNote = new Map<string, string>()
  for (const n of notes) {
    if (n.brand_id) {
      noteCount.set(n.brand_id, (noteCount.get(n.brand_id) ?? 0) + 1)
      const prev = lastNote.get(n.brand_id)
      if (!prev || n.created_at > prev) lastNote.set(n.brand_id, n.created_at)
    }
  }

  const brandsWithStats: BrandWithStats[] = brands.map(b => ({
    ...b,
    tool_count: toolCount.get(b.id) ?? 0,
    note_count: noteCount.get(b.id) ?? 0,
    last_note_at: lastNote.get(b.id) ?? null,
  }))

  return { brands: brandsWithStats, recentNotes }
}

function formatRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'vandaag'
  if (days === 1) return 'gisteren'
  if (days < 7) return `${days}d geleden`
  if (days < 30) return `${Math.floor(days / 7)}w geleden`
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default async function ContentStudio() {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }
  const { brands, recentNotes } = await getData()
  const brandNameById = new Map(brands.map(b => [b.id, b.name]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Studio"
        description="Tracker voor AI-tools, prompts en notes per brand. Basis voor toekomstige agents."
      />

      {/* Brand cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brands.map(b => (
          <Link
            key={b.id}
            href={`/admin/content-studio/${b.slug}`}
            className="rounded-xl border border-white/5 bg-foundri-deep p-5 hover:border-white/15 hover:bg-foundri-deep/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {b.brand_color && (
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: b.brand_color }} />
                  )}
                  <h3 className="text-lg font-semibold text-white truncate">{b.name}</h3>
                </div>
                {b.description && <p className="text-sm text-zinc-400 line-clamp-2">{b.description}</p>}
              </div>
              <Sparkles className="h-5 w-5 text-zinc-600 shrink-0" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-foundri-card p-2.5">
                <p className="text-zinc-500">AI tools</p>
                <p className="text-base font-semibold text-white mt-0.5">{b.tool_count}</p>
              </div>
              <div className="rounded-lg bg-foundri-card p-2.5">
                <p className="text-zinc-500">Notes</p>
                <p className="text-base font-semibold text-white mt-0.5">{b.note_count}</p>
              </div>
              <div className="rounded-lg bg-foundri-card p-2.5">
                <p className="text-zinc-500">Laatste</p>
                <p className="text-xs font-medium text-zinc-300 mt-0.5">
                  {b.last_note_at ? formatRelative(b.last_note_at) : '—'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent notes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Recente notes
        </h2>
        {recentNotes.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-foundri-deep p-8 text-center text-sm text-zinc-500">
            Nog geen notes. Begin door notes toe te voegen via de quick-form hieronder of vanuit een brand-pagina.
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
            <ul className="divide-y divide-white/5">
              {recentNotes.map((n: any) => (
                <li key={n.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                    <span className="text-xs text-zinc-500 shrink-0">{formatRelative(n.created_at)}</span>
                  </div>
                  {n.body && <p className="text-sm text-zinc-400 mt-1 line-clamp-2 whitespace-pre-wrap">{n.body}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {n.brand_id && (
                      <span className="text-xs text-blue-400">{brandNameById.get(n.brand_id) ?? '?'}</span>
                    )}
                    {n.tags?.map((tag: string) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">#{tag}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick add note form */}
      <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Quick note toevoegen
        </h3>
        <form action={addNote} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              name="brand_id"
              required
              className="rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white"
              defaultValue=""
            >
              <option value="" disabled>Kies brand…</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <input
              type="text"
              name="title"
              required
              placeholder="Titel"
              className="md:col-span-2 rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
            />
          </div>
          <textarea
            name="body"
            rows={3}
            placeholder="Beschrijving / observatie / prompt die werkt / wat misging…"
            className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
          />
          <div className="flex items-center gap-3">
            <input
              type="text"
              name="tags"
              placeholder="tags, gescheiden, met, komma"
              className="flex-1 rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite hover:bg-foundri-yellow/90"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
