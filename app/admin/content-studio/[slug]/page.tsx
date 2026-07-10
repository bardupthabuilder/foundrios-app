import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wrench, StickyNote, Plus, ExternalLink, Sparkles, Trash2, Archive } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { addNote, addTool, updateBrand, archiveTool, deleteNote } from '../actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TOOL_KINDS = [
  { value: 'chatgpt_project', label: 'ChatGPT Project' },
  { value: 'custom_gpt', label: 'Custom GPT' },
  { value: 'gemini_gem', label: 'Gemini Gem' },
  { value: 'claude_project', label: 'Claude Project' },
  { value: 'dalle', label: 'DALL-E' },
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'runway', label: 'Runway' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'perplexity', label: 'Perplexity' },
  { value: 'sora', label: 'Sora' },
  { value: 'heygen', label: 'HeyGen' },
  { value: 'canva', label: 'Canva' },
  { value: 'other', label: 'Anders' },
]

const KIND_LABEL: Record<string, string> = Object.fromEntries(TOOL_KINDS.map(k => [k.value, k.label]))

async function getBrand(slug: string) {
  const sb = createServiceClient() as any

  const { data: brand } = await sb.from('content_brands').select('*').eq('slug', slug).single()
  if (!brand) return null

  const [toolsRes, notesRes] = await Promise.all([
    sb.from('content_ai_tools').select('*').eq('brand_id', brand.id).order('created_at', { ascending: false }),
    sb.from('content_notes').select('*').eq('brand_id', brand.id).order('created_at', { ascending: false }).limit(50),
  ])

  return {
    brand,
    tools: toolsRes.data ?? [],
    notes: notesRes.data ?? [],
  }
}

function formatRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'vandaag'
  if (days === 1) return 'gisteren'
  if (days < 7) return `${days}d geleden`
  if (days < 30) return `${Math.floor(days / 7)}w geleden`
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  try { await requireSuperadmin() } catch { redirect('/dashboard') }
  const { slug } = await params
  const data = await getBrand(slug)
  if (!data) notFound()

  const { brand, tools, notes } = data
  const activeTools = tools.filter((t: any) => t.status === 'active')
  const toolById = new Map(tools.map((t: any) => [t.id, t]))

  return (
    <div className="space-y-6">
      <Link href="/admin/content-studio" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Content Studio
      </Link>

      <PageHeader
        title={brand.name}
        description={brand.description ?? undefined}
        actions={
          brand.brand_color ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="h-4 w-4 rounded shrink-0" style={{ backgroundColor: brand.brand_color }} />
              {brand.brand_color}
            </div>
          ) : null
        }
      />

      {/* Brand context — editable */}
      <details className="rounded-xl border border-white/5 bg-foundri-deep">
        <summary className="cursor-pointer px-5 py-4 flex items-center justify-between hover:bg-white/[0.02]">
          <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-500" />
            Brand context (positionering · tonality · do/dont)
          </span>
          <span className="text-xs text-zinc-500">Klik om te bewerken</span>
        </summary>
        <form action={updateBrand} className="px-5 pb-5 space-y-3">
          <input type="hidden" name="id" value={brand.id} />
          <FieldLabel label="Positionering">
            <textarea
              name="positioning"
              rows={2}
              defaultValue={brand.positioning ?? ''}
              className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white"
            />
          </FieldLabel>
          <FieldLabel label="Tonality">
            <textarea
              name="tonality"
              rows={2}
              defaultValue={brand.tonality ?? ''}
              className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white"
            />
          </FieldLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldLabel label="Wel doen">
              <textarea
                name="do_use"
                rows={3}
                defaultValue={brand.do_use ?? ''}
                className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white"
              />
            </FieldLabel>
            <FieldLabel label="Niet doen">
              <textarea
                name="do_not_use"
                rows={3}
                defaultValue={brand.do_not_use ?? ''}
                className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white"
              />
            </FieldLabel>
          </div>
          <button type="submit" className="rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite hover:bg-foundri-yellow/90">
            Brand context opslaan
          </button>
        </form>
      </details>

      {/* AI Tools sectie */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            AI Tools ({activeTools.length})
          </h2>
        </div>

        {activeTools.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-foundri-deep p-6 text-center text-sm text-zinc-500">
            Nog geen tools. Voeg er één toe via het formulier hieronder.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTools.map((t: any) => (
              <div key={t.id} className="rounded-xl border border-white/5 bg-foundri-deep p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge label={KIND_LABEL[t.kind] ?? t.kind} variant="violet" />
                    </div>
                    <h3 className="text-base font-semibold text-white truncate">{t.name}</h3>
                  </div>
                  {t.url && (
                    <a href={t.url} target="_blank" rel="noopener" className="text-zinc-500 hover:text-zinc-300 shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {t.description && <p className="text-sm text-zinc-400 mt-2">{t.description}</p>}
                {t.notes && <p className="text-xs text-zinc-500 mt-2 whitespace-pre-wrap border-t border-white/5 pt-2">{t.notes}</p>}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <span className="text-xs text-zinc-500">{formatRelative(t.created_at)}</span>
                  <form action={archiveTool}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1">
                      <Archive className="h-3 w-3" />
                      Archiveren
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add tool form */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tool toevoegen
          </h3>
          <form action={addTool} className="space-y-3">
            <input type="hidden" name="brand_id" value={brand.id} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                name="kind"
                required
                defaultValue=""
                className="rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white"
              >
                <option value="" disabled>Kies type…</option>
                {TOOL_KINDS.map(k => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
              <input
                type="text"
                name="name"
                required
                placeholder="Naam (bv. 'GM Content Generator')"
                className="rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <input
                type="url"
                name="url"
                placeholder="URL (optioneel)"
                className="rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
            </div>
            <textarea
              name="description"
              rows={2}
              placeholder="Wat doet deze tool? Waarvoor gebruik je hem?"
              className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
            />
            <textarea
              name="notes"
              rows={3}
              placeholder="Notes — wat werkt? Welke prompts? Wat moet je vermijden?"
              className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
            />
            <button type="submit" className="rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite hover:bg-foundri-yellow/90">
              Tool opslaan
            </button>
          </form>
        </div>
      </div>

      {/* Notes sectie */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Notes ({notes.length})
        </h2>

        {notes.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-foundri-deep p-6 text-center text-sm text-zinc-500">
            Nog geen notes. Voeg er een toe via het formulier hieronder.
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-foundri-deep overflow-hidden">
            <ul className="divide-y divide-white/5">
              {notes.map((n: any) => (
                <li key={n.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                      {n.body && <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{n.body}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {n.tool_id && toolById.get(n.tool_id) && (
                          <span className="text-xs text-violet-400">{(toolById.get(n.tool_id) as any).name}</span>
                        )}
                        {n.tags?.map((tag: string) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-zinc-500">{formatRelative(n.created_at)}</span>
                      <form action={deleteNote}>
                        <input type="hidden" name="id" value={n.id} />
                        <button type="submit" className="text-zinc-600 hover:text-red-400" title="Verwijderen">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add note form */}
        <div className="rounded-xl border border-white/5 bg-foundri-deep p-5">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Note toevoegen
          </h3>
          <form action={addNote} className="space-y-3">
            <input type="hidden" name="brand_id" value={brand.id} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                name="title"
                required
                placeholder="Titel"
                className="md:col-span-2 rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <select
                name="tool_id"
                defaultValue=""
                className="rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white"
              >
                <option value="">Geen tool</option>
                {activeTools.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <textarea
              name="body"
              rows={3}
              placeholder="Wat heb je geleerd? Welke prompt werkte? Wat ging fout?"
              className="w-full rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
            />
            <div className="flex items-center gap-3">
              <input
                type="text"
                name="tags"
                placeholder="tags (kommagescheiden: image, voice, prompt, branding)"
                className="flex-1 rounded-lg border border-white/10 bg-foundri-card px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <button type="submit" className="rounded-lg bg-foundri-yellow px-4 py-2 text-sm font-semibold text-foundri-graphite hover:bg-foundri-yellow/90">
                Opslaan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
