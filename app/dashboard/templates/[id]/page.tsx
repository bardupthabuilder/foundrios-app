'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, CheckCircle2, ExternalLink, Lock, Pencil } from 'lucide-react'
import { renderTemplate, extractVariableNames, hasUnfilledVariables } from '@/lib/templates/render'
import { useFeature } from '@/lib/hooks/useFeature'

type TemplateVar = { name: string; label: string; default?: string }
type Template = {
  id: string
  name: string
  type: string
  description: string | null
  is_custom: boolean
  is_system: boolean
  content: { body: string; subject?: string; variables?: TemplateVar[] }
}

type ContextOption = { id: string; label: string }

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tpl, setTpl] = useState<Template | null>(null)
  const [vars, setVars] = useState<Record<string, string>>({})
  const [copiedBody, setCopiedBody] = useState(false)
  const [copiedSubject, setCopiedSubject] = useState(false)

  const [clients, setClients] = useState<ContextOption[]>([])
  const [projects, setProjects] = useState<ContextOption[]>([])
  const [quotes, setQuotes] = useState<ContextOption[]>([])
  const [invoices, setInvoices] = useState<ContextOption[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedQuote, setSelectedQuote] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState('')

  const { allowed: canEdit } = useFeature('templates_custom')

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setTpl(data)
        // Initial defaults
        const initial: Record<string, string> = {}
        for (const v of data.content.variables || []) {
          if (v.default) initial[v.name] = v.default
        }
        setVars(initial)
      })

    // Context lookups
    fetch('/api/templates/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ want: ['clients', 'projects', 'quotes', 'invoices'] }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => {
        setClients((d.clients || []).map((c: any) => ({ id: c.id, label: c.company_name || c.name })))
        setProjects((d.projects || []).map((p: any) => ({ id: p.id, label: p.name })))
        setQuotes((d.quotes || []).map((q: any) => ({ id: q.id, label: `${q.quote_number} — ${q.title}` })))
        setInvoices((d.invoices || []).map((i: any) => ({ id: i.id, label: i.invoice_number || i.id.slice(0, 8) })))
      })
  }, [id])

  // Resolve context wanneer dropdown verandert
  useEffect(() => {
    if (!selectedClient && !selectedProject && !selectedQuote && !selectedInvoice) return
    const params = new URLSearchParams()
    if (selectedClient) params.set('client_id', selectedClient)
    if (selectedProject) params.set('project_id', selectedProject)
    if (selectedQuote) params.set('quote_id', selectedQuote)
    if (selectedInvoice) params.set('invoice_id', selectedInvoice)
    fetch(`/api/templates/context?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.vars) {
          setVars((prev) => ({ ...data.vars, ...prev /* gebruiker behoudt eigen overschrijvingen */ }))
        }
      })
  }, [selectedClient, selectedProject, selectedQuote, selectedInvoice])

  const usedVarNames = useMemo(() => {
    if (!tpl) return []
    return Array.from(new Set([
      ...extractVariableNames(tpl.content.body || ''),
      ...extractVariableNames(tpl.content.subject || ''),
    ]))
  }, [tpl])

  const renderedBody = useMemo(() => (tpl ? renderTemplate(tpl.content.body, vars) : ''), [tpl, vars])
  const renderedSubject = useMemo(() => (tpl?.content.subject ? renderTemplate(tpl.content.subject, vars) : ''), [tpl, vars])
  const incomplete = hasUnfilledVariables(renderedBody) || hasUnfilledVariables(renderedSubject)

  async function copy(text: string, which: 'body' | 'subject') {
    try {
      await navigator.clipboard.writeText(text)
      if (which === 'body') {
        setCopiedBody(true)
        setTimeout(() => setCopiedBody(false), 2000)
      } else {
        setCopiedSubject(true)
        setTimeout(() => setCopiedSubject(false), 2000)
      }
    } catch {
      /* noop */
    }
  }

  if (!tpl) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>

  const isWhatsapp = tpl.type === 'whatsapp'
  const isEmail = tpl.type === 'email'

  const mailto = isEmail
    ? `mailto:?subject=${encodeURIComponent(renderedSubject)}&body=${encodeURIComponent(renderedBody)}`
    : null

  const phoneRaw = vars.client_phone || ''
  const phoneClean = phoneRaw.replace(/[^0-9+]/g, '').replace(/^\+/, '').replace(/^06/, '316')
  const waLink = isWhatsapp
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(renderedBody)}`
    : null

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-5xl">
      <Link href="/dashboard/templates" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Terug naar templates
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{tpl.name}</h1>
            {tpl.is_system && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-white/40">standaard</span>}
            {tpl.is_custom && <span className="rounded bg-foundri-yellow/20 px-1.5 py-0.5 text-[10px] uppercase text-foundri-yellow">eigen</span>}
          </div>
          {tpl.description && <p className="mt-1 text-sm text-zinc-400">{tpl.description}</p>}
        </div>
        {tpl.is_custom && canEdit && (
          <Link href={`/dashboard/templates/${id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">
            <Pencil className="h-4 w-4" /> Bewerken
          </Link>
        )}
        {tpl.is_system && !canEdit && (
          <Link href="/dashboard/billing/upgrade" className="inline-flex items-center gap-1.5 rounded-lg bg-foundri-yellow/20 px-3 py-2 text-sm text-foundri-yellow hover:bg-foundri-yellow/30">
            <Lock className="h-4 w-4" /> Pro voor eigen templates
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Left: Variabelen invoer */}
        <div className="space-y-4">
          <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Context</h3>
            <p className="mb-3 text-xs text-zinc-400">Kies een klant/project en de variabelen worden automatisch ingevuld.</p>

            <div className="space-y-2">
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white">
                <option value="">— Geen klant —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white">
                <option value="">— Geen project —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <select value={selectedQuote} onChange={(e) => setSelectedQuote(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white">
                <option value="">— Geen offerte —</option>
                {quotes.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
              </select>
              <select value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white">
                <option value="">— Geen factuur —</option>
                {invoices.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Variabelen</h3>
            {usedVarNames.length === 0 ? (
              <p className="text-xs text-zinc-500">Deze template heeft geen variabelen.</p>
            ) : (
              <div className="space-y-2">
                {usedVarNames.map((name) => {
                  const def = (tpl.content.variables || []).find((v) => v.name === name)
                  const label = def?.label || name
                  return (
                    <div key={name}>
                      <label className="text-[11px] font-medium text-zinc-400">{label}</label>
                      <input
                        type="text"
                        value={vars[name] || ''}
                        onChange={(e) => setVars({ ...vars, [name]: e.target.value })}
                        placeholder={`{{${name}}}`}
                        className="mt-0.5 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-foundri-yellow focus:outline-none"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview + acties */}
        <div className="space-y-4">
          {renderedSubject && (
            <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Onderwerp</h3>
                <button onClick={() => copy(renderedSubject, 'subject')} className="inline-flex items-center gap-1 rounded-md bg-foundri-yellow/20 px-2 py-1 text-xs text-foundri-yellow hover:bg-foundri-yellow/30">
                  {copiedSubject ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedSubject ? 'Gekopieerd' : 'Kopieer'}
                </button>
              </div>
              <p className="text-sm text-white">{renderedSubject}</p>
            </div>
          )}

          <div className="rounded-lg border border-white/5 bg-foundri-deep p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Bericht</h3>
              <div className="flex gap-1.5">
                <button onClick={() => copy(renderedBody, 'body')} className="inline-flex items-center gap-1 rounded-md bg-foundri-yellow px-2 py-1 text-xs font-medium text-foundri-deep hover:brightness-110">
                  {copiedBody ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedBody ? 'Gekopieerd' : 'Kopieer tekst'}
                </button>
                {mailto && (
                  <a href={mailto} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/5">
                    <ExternalLink className="h-3 w-3" /> Open in mail
                  </a>
                )}
                {waLink && phoneClean && (
                  <a href={waLink} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                    <ExternalLink className="h-3 w-3" /> Open in WhatsApp
                  </a>
                )}
              </div>
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-white">{renderedBody}</pre>
            {incomplete && (
              <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
                Niet alle variabelen zijn ingevuld — {`{{naam}}`} blokken blijven zichtbaar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
