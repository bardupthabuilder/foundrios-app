'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpenCheck, ChevronRight, Copy, Sparkles } from 'lucide-react'

type Step = { title: string; description: string; tools?: string[] }
type Prompt = { label: string; prompt: string; model?: string }

type PlaybookDetail = {
  id: string
  slug: string
  title: string
  purpose: string | null
  when_to_use?: string | null
  category_slug: string
  subcategory: string | null
  steps?: Step[]
  prompts?: Prompt[]
  checklist?: string[]
  output_example?: string | null
  tools_required?: string[]
}

export default function PlaybookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [data, setData] = useState<PlaybookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/playbooks/${slug}`)
      .then(r => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }, [slug])

  async function copyPrompt(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1500)
    } catch {
      // noop
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        <p className="text-sm text-zinc-400">Laden...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        <p className="text-sm text-zinc-400">Playbook niet gevonden of geen toegang.</p>
        <Link href="/dashboard/playbooks" className="mt-4 inline-flex items-center gap-1.5 text-sm text-foundri-yellow">
          <ArrowLeft className="h-4 w-4" /> Terug naar Playbooks
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-3xl">
      <Link
        href="/dashboard/playbooks"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Playbooks
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <BookOpenCheck className="h-3.5 w-3.5" />
          <span className="uppercase tracking-wider">{data.category_slug}{data.subcategory ? ` · ${data.subcategory}` : ''}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-white">{data.title}</h1>
        {data.purpose && <p className="mt-2 text-sm text-zinc-300">{data.purpose}</p>}
      </div>

      <div className="space-y-6">
        {data.when_to_use && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Wanneer gebruiken</h2>
            <p className="text-sm text-zinc-300">{data.when_to_use}</p>
          </section>
        )}

        {data.tools_required && data.tools_required.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Benodigde tools</h2>
            <div className="flex flex-wrap gap-1.5">
              {data.tools_required.map(t => (
                <span key={t} className="rounded bg-white/5 px-2 py-1 text-xs text-zinc-300">{t}</span>
              ))}
            </div>
          </section>
        )}

        {data.steps && data.steps.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Stappenplan</h2>
            <div className="space-y-3">
              {data.steps.map((step, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-foundri-deep p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foundri-yellow/15 text-xs font-semibold text-foundri-yellow">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                      {step.description && (
                        <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{step.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.prompts && data.prompts.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Prompts
              </span>
            </h2>
            <div className="space-y-3">
              {data.prompts.map((p, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-foundri-deep p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{p.label}</span>
                    <button
                      onClick={() => copyPrompt(p.prompt, i)}
                      className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-zinc-300 transition hover:border-foundri-yellow/40 hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedIdx === i ? 'Gekopieerd' : 'Kopiëren'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">{p.prompt}</pre>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.checklist && data.checklist.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Checklist</h2>
            <ul className="space-y-1.5">
              {data.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foundri-yellow" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.output_example && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Voorbeeld output</h2>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/5 bg-foundri-deep p-4 text-xs text-zinc-300">
              {data.output_example}
            </pre>
          </section>
        )}
      </div>
    </div>
  )
}
