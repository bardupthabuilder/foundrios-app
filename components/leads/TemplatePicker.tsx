'use client'

import { useEffect, useState } from 'react'
import { FileText, ChevronDown } from 'lucide-react'

/**
 * Templates op het moment van gebruik.
 *
 * De Templates-module is een goede bibliotheek, maar hij stond los van het moment
 * waarop je hem nodig hebt. Een template wordt pas leverage als hij verschijnt
 * in het antwoordveld — niet drie klikken verderop in een ander menu.
 */

type Template = {
  id: string
  name: string
  category: string | null
  content: { body: string; subject?: string }
}

/** Vult {{naam}}-achtige plaatshouders in met wat we al weten. */
function fill(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => vars[key.toLowerCase()] ?? match)
}

export function TemplatePicker({
  leadName,
  onPick,
}: {
  leadName: string
  onPick: (body: string) => void
}) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/templates?type=email')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  if (templates.length === 0) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Kies een standaardbericht"
        className="flex h-10 items-center gap-1.5 rounded-lg bg-foundri-card px-3 text-xs text-zinc-400 transition-colors hover:text-white"
      >
        <FileText className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 right-0 z-20 max-h-72 w-72 overflow-y-auto rounded-lg border border-white/10 bg-foundri-deep p-1 shadow-xl">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onPick(fill(t.content?.body ?? '', { naam: leadName, name: leadName }))
                  setOpen(false)
                }}
                className="block w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-white/5"
              >
                <span className="block text-sm text-zinc-200">{t.name}</span>
                {t.category && <span className="block text-xs text-zinc-500">{t.category}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
