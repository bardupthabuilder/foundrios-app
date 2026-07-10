'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Send, FileText, Film, MessageSquare, ScrollText, Plus, Lock } from 'lucide-react'
import { TYPE_LABELS, TYPE_ORDER } from '@/lib/templates/variables'
import { useFeature } from '@/lib/hooks/useFeature'

type Template = {
  id: string
  name: string
  type: string
  category: string | null
  description: string | null
  is_default: boolean
  is_custom: boolean
  is_system: boolean
  content: { body: string; subject?: string; variables?: { name: string; label: string }[] }
}

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageSquare,
  content: ScrollText,
  reel: Film,
  offerte: FileText,
  werkbon: FileText,
  campagne: Send,
  sop: ScrollText,
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeType, setActiveType] = useState<string>('email')
  const [loading, setLoading] = useState(true)
  const { allowed: canCreate } = useFeature('templates_custom')

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((data) => setTemplates(data.templates || []))
      .finally(() => setLoading(false))
  }, [])

  const byType = templates.reduce<Record<string, Template[]>>((acc, t) => {
    if (!acc[t.type]) acc[t.type] = []
    acc[t.type].push(t)
    return acc
  }, {})

  const visibleTypes = TYPE_ORDER.filter((t) => byType[t]?.length)

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-foundri-yellow" />
            <h1 className="text-2xl font-bold text-white">Templates</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Bibliotheek met klaarliggende communicatie. Vul de variabelen in via een klant of project en kopieer.
          </p>
        </div>
        <Link
          href={canCreate ? '/dashboard/templates/new' : '/dashboard/billing/upgrade'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foundri-yellow px-3 py-2 text-sm font-medium text-foundri-deep hover:brightness-110"
        >
          {canCreate ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          Nieuwe template
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Laden...</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-1.5 border-b border-white/5">
            {visibleTypes.map((type) => {
              const Icon = TYPE_ICONS[type] || Mail
              const active = activeType === type
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-foundri-yellow text-foundri-yellow'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {TYPE_LABELS[type] || type}
                  <span className="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60">
                    {byType[type]?.length || 0}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(byType[activeType] || []).map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/templates/${t.id}`}
                className="flex flex-col rounded-lg border border-white/5 bg-foundri-deep p-4 transition hover:border-foundri-yellow/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  {t.is_system && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-white/40">standaard</span>}
                  {t.is_custom && <span className="rounded bg-foundri-yellow/20 px-1.5 py-0.5 text-[10px] uppercase text-foundri-yellow">eigen</span>}
                </div>
                {t.description && (
                  <p className="mt-1 text-xs text-zinc-400">{t.description}</p>
                )}
                <p className="mt-3 line-clamp-3 text-xs text-zinc-500">{t.content.body}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(t.content.variables || []).slice(0, 4).map((v) => (
                    <span key={v.name} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60">
                      {`{{${v.name}}}`}
                    </span>
                  ))}
                  {(t.content.variables?.length || 0) > 4 && (
                    <span className="text-[10px] text-white/40">+{(t.content.variables?.length || 0) - 4}</span>
                  )}
                </div>
              </Link>
            ))}
            {!byType[activeType]?.length && (
              <div className="col-span-2 rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
                Geen templates in deze categorie.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
