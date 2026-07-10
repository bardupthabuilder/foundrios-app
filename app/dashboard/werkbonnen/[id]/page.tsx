'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Play, CheckCircle, FileText, Clock, Package, PenLine } from 'lucide-react'
import { SignaturePad } from '@/components/werkbonnen/SignaturePad'
import { PhotoStrip } from '@/components/werkbonnen/PhotoStrip'

type WOHour = {
  id: string
  employee_name: string | null
  hours: number
  hourly_rate_cents: number
  total_cents: number
  description: string | null
}
type WOMaterial = {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price_cents: number
  total_cents: number
}
type WorkOrder = {
  id: string
  work_order_number: string | null
  title: string
  description: string | null
  status: string
  date: string
  signed_by: string | null
  signed_at: string | null
  signature_data: string | null
  notes: string | null
  created_at: string
  clients: any
  projects: any
  hours: WOHour[]
  materials: WOMaterial[]
}

const statusConfig: Record<string, { label: string; bar: string; text: string }> = {
  concept:      { label: 'Concept',      bar: 'bg-zinc-500',    text: 'text-zinc-300' },
  actief:       { label: 'Actief',       bar: 'bg-blue-500',    text: 'text-blue-400' },
  afgerond:     { label: 'Afgerond',     bar: 'bg-green-500',   text: 'text-green-400' },
  gefactureerd: { label: 'Gefactureerd', bar: 'bg-emerald-500', text: 'text-emerald-400' },
}

const UNITS = ['stuk', 'm²', 'm³', 'm¹', 'kg', 'zak', 'pallet', 'post', 'ltr']

export default function WerkbonDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [wo, setWo] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<{ id: string; name: string; hourly_cost_cents?: number }[]>([])

  const [sheet, setSheet] = useState<'hour' | 'material' | 'sign' | null>(null)
  const [signName, setSignName] = useState('')
  const [signingBusy, setSigningBusy] = useState(false)
  const [invoiceBusy, setInvoiceBusy] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  const [hourForm, setHourForm] = useState({ employee_name: '', hours: 8, hourly_rate: 45, description: '' })
  const [hourBusy, setHourBusy] = useState(false)

  const [matForm, setMatForm] = useState({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })
  const [matBusy, setMatBusy] = useState(false)

  useEffect(() => {
    fetchWo()
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : []))
  }, [id])

  async function fetchWo() {
    const res = await fetch(`/api/work-orders/${id}`)
    if (res.ok) setWo(await res.json())
    setLoading(false)
  }

  async function updateStatus(status: string, extra?: Record<string, unknown>) {
    await fetch(`/api/work-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    setSheet(null)
    fetchWo()
  }

  async function addHour(e: React.FormEvent) {
    e.preventDefault()
    setHourBusy(true)
    await fetch('/api/work-order-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        work_order_id: id,
        employee_name: hourForm.employee_name || null,
        hours: hourForm.hours,
        hourly_rate_cents: Math.round(hourForm.hourly_rate * 100),
        description: hourForm.description || null,
        sort_order: (wo?.hours.length ?? 0) + 1,
      }),
    })
    setSheet(null)
    setHourForm({ employee_name: '', hours: 8, hourly_rate: 45, description: '' })
    setHourBusy(false)
    fetchWo()
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault()
    setMatBusy(true)
    await fetch('/api/work-order-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        work_order_id: id,
        description: matForm.description,
        quantity: matForm.quantity,
        unit: matForm.unit,
        unit_price_cents: Math.round(matForm.unit_price * 100),
        sort_order: (wo?.materials.length ?? 0) + 1,
      }),
    })
    setSheet(null)
    setMatForm({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })
    setMatBusy(false)
    fetchWo()
  }

  async function deleteHour(hId: string) {
    await fetch(`/api/work-order-hours?id=${hId}`, { method: 'DELETE' })
    fetchWo()
  }

  async function deleteMaterial(mId: string) {
    await fetch(`/api/work-order-materials?id=${mId}`, { method: 'DELETE' })
    fetchWo()
  }

  async function createInvoice() {
    if (!wo) return
    setInvoiceBusy(true)
    setInvoiceError(null)

    // De server kopieert uren en materiaal naar echte factuurregels en zet de
    // werkbon in één keer op 'gefactureerd'.
    const res = await fetch(`/api/work-orders/${id}/to-invoice`, { method: 'POST' })

    if (res.ok) {
      const invoice = await res.json()
      router.push(`/dashboard/facturen/${invoice.id}`)
      return
    }

    const body = await res.json().catch(() => null)
    setInvoiceError(typeof body?.error === 'string' ? body.error : 'Factuur maken mislukt.')
    setInvoiceBusy(false)
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-3">
        <div className="h-8 w-40 rounded-lg bg-foundri-card animate-pulse" />
        <div className="h-24 rounded-xl bg-foundri-card animate-pulse" />
        <div className="h-40 rounded-xl bg-foundri-card animate-pulse" />
      </div>
    )
  }

  if (!wo) {
    return <div className="p-6 text-sm text-red-500">Werkbon niet gevonden</div>
  }

  const sc = statusConfig[wo.status] || statusConfig.concept
  const editable = wo.status === 'concept' || wo.status === 'actief'
  const totalHours = wo.hours.reduce((s, h) => s + Number(h.hours), 0)
  const totalHoursCents = wo.hours.reduce((s, h) => s + h.total_cents, 0)
  const totalMatCents = wo.materials.reduce((s, m) => s + m.total_cents, 0)
  const grandTotal = totalHoursCents + totalMatCents

  return (
    <>
      <div className="p-4 lg:p-6 max-w-3xl pb-36 lg:pb-6">
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard/werkbonnen')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 active:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Werkbonnen
        </button>

        {/* Title + status */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white lg:text-2xl leading-tight">{wo.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {wo.work_order_number && <span className="font-mono mr-2">{wo.work_order_number}</span>}
              {wo.projects?.name && <span>{wo.projects.name} · </span>}
              {new Date(wo.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${sc.text} bg-white/5`}>
            {sc.label}
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-4">
          <div className="rounded-xl bg-foundri-card p-3">
            <p className="text-xs text-zinc-400 mb-1">Uren</p>
            <p className="text-xl font-semibold text-white">{totalHours}u</p>
          </div>
          <div className="rounded-xl bg-foundri-card p-3">
            <p className="text-xs text-zinc-400 mb-1">Arbeid</p>
            <p className="text-xl font-semibold text-white">{fmt(totalHoursCents)}</p>
          </div>
          <div className="rounded-xl bg-foundri-card p-3">
            <p className="text-xs text-zinc-400 mb-1">Materiaal</p>
            <p className="text-xl font-semibold text-white">{fmt(totalMatCents)}</p>
          </div>
          <div className="rounded-xl bg-foundri-card p-3 sm:col-span-1">
            <p className="text-xs text-zinc-400 mb-1">Totaal</p>
            <p className="text-xl font-bold text-foundri-yellow">{fmt(grandTotal)}</p>
          </div>
        </div>

        {/* Signed */}
        {wo.signed_by && (
          <div className="mb-5 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
              <div className="text-sm">
                <span className="text-green-300 font-medium">Getekend door {wo.signed_by}</span>
                {wo.signed_at && (
                  <span className="text-green-400/70"> · {new Date(wo.signed_at).toLocaleDateString('nl-NL')}</span>
                )}
              </div>
            </div>
            {wo.signature_data && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={wo.signature_data}
                alt={`Handtekening van ${wo.signed_by}`}
                className="mt-3 h-20 rounded-lg bg-white/5 object-contain px-2"
              />
            )}
          </div>
        )}

        {/* Foto's — het beste bewijs bij discussie over meerwerk. */}
        <section className="mb-5">
          <PhotoStrip workOrderId={String(id)} readOnly={wo.status === 'gefactureerd'} />
        </section>

        {/* Uren section */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">Uren</h2>
              {wo.hours.length > 0 && (
                <span className="rounded-full bg-foundri-card px-2 py-0.5 text-xs text-zinc-400">
                  {wo.hours.length}
                </span>
              )}
            </div>
            {editable && (
              <button
                onClick={() => setSheet('hour')}
                className="flex items-center gap-1.5 rounded-lg bg-foundri-card px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-foundri-hover active:bg-foundri-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Uren toevoegen
              </button>
            )}
          </div>

          {wo.hours.length === 0 ? (
            <button
              onClick={() => editable && setSheet('hour')}
              disabled={!editable}
              className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center hover:border-white/20 transition-colors disabled:cursor-default"
            >
              <Clock className="h-7 w-7 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500">Nog geen uren</p>
              {editable && <p className="text-xs text-zinc-600 mt-0.5">Tik om toe te voegen</p>}
            </button>
          ) : (
            <div className="space-y-2">
              {wo.hours.map(h => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl bg-foundri-card px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {h.employee_name || 'Medewerker'}
                      </span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {Number(h.hours)}u
                      </span>
                    </div>
                    {h.description && (
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{h.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-zinc-200 tabular-nums">
                      {fmt(h.total_cents)}
                    </span>
                    {editable && (
                      <button
                        onClick={() => deleteHour(h.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 active:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Materiaal section */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">Materiaal</h2>
              {wo.materials.length > 0 && (
                <span className="rounded-full bg-foundri-card px-2 py-0.5 text-xs text-zinc-400">
                  {wo.materials.length}
                </span>
              )}
            </div>
            {editable && (
              <button
                onClick={() => setSheet('material')}
                className="flex items-center gap-1.5 rounded-lg bg-foundri-card px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-foundri-hover active:bg-foundri-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Materiaal toevoegen
              </button>
            )}
          </div>

          {wo.materials.length === 0 ? (
            <button
              onClick={() => editable && setSheet('material')}
              disabled={!editable}
              className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center hover:border-white/20 transition-colors disabled:cursor-default"
            >
              <Package className="h-7 w-7 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500">Nog geen materiaal</p>
              {editable && <p className="text-xs text-zinc-600 mt-0.5">Tik om toe te voegen</p>}
            </button>
          ) : (
            <div className="space-y-2">
              {wo.materials.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-foundri-card px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.description}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {Number(m.quantity)} {m.unit} · {fmt(m.unit_price_cents)}/stuk
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-zinc-200 tabular-nums">
                      {fmt(m.total_cents)}
                    </span>
                    {editable && (
                      <button
                        onClick={() => deleteMaterial(m.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 active:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notities */}
        {wo.notes && (
          <div className="rounded-xl bg-foundri-card p-4 mb-5">
            <h3 className="text-xs font-medium text-zinc-400 mb-2">Notities</h3>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{wo.notes}</p>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar — mobile + desktop */}
      {wo.status !== 'gefactureerd' && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-white/5 bg-foundri-surface/95 backdrop-blur-sm px-4 py-3 lg:relative lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:px-6 lg:pb-6 lg:max-w-3xl">
          {/* Mobile: only show the primary action */}
          <div className="flex gap-3 pb-safe">
            {wo.status === 'concept' && (
              <button
                onClick={() => updateStatus('actief')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                <Play className="h-5 w-5" /> Werkbon starten
              </button>
            )}
            {wo.status === 'actief' && (
              <>
                <button
                  onClick={() => setSheet('hour')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-foundri-card px-4 py-3.5 text-sm font-medium text-zinc-200 hover:bg-foundri-hover active:scale-[0.98] transition-all"
                >
                  <Clock className="h-5 w-5" />
                  <span className="hidden sm:inline">Uren</span>
                </button>
                <button
                  onClick={() => setSheet('material')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-foundri-card px-4 py-3.5 text-sm font-medium text-zinc-200 hover:bg-foundri-hover active:scale-[0.98] transition-all"
                >
                  <Package className="h-5 w-5" />
                  <span className="hidden sm:inline">Materiaal</span>
                </button>
                <button
                  onClick={() => setSheet('sign')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 active:scale-[0.98] transition-all"
                >
                  <CheckCircle className="h-5 w-5" /> Afronden & tekenen
                </button>
              </>
            )}
            {wo.status === 'afgerond' && (
              <>
                <button
                  onClick={() => updateStatus('gefactureerd')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-foundri-card px-4 py-3.5 text-sm font-medium text-zinc-300 hover:bg-foundri-hover active:scale-[0.98] transition-all"
                  title="Al elders gefactureerd"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">Al gefactureerd</span>
                </button>
                <button
                  onClick={createInvoice}
                  disabled={invoiceBusy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  <FileText className="h-5 w-5" />
                  {invoiceBusy ? 'Aanmaken...' : 'Maak factuur'}
                </button>
              </>
            )}
          </div>
          {invoiceError && (
            <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {invoiceError}
            </p>
          )}
        </div>
      )}

      {/* Bottom sheet backdrop */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center sm:justify-center sm:p-4"
          onClick={() => setSheet(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-foundri-deep border-t border-white/5 sm:border shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-1 sm:hidden" />

            {/* Add hour sheet */}
            {sheet === 'hour' && (
              <form onSubmit={addHour} className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-white">Uren toevoegen</h2>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Medewerker</label>
                  {employees.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {employees.map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => setHourForm({
                            ...hourForm,
                            employee_name: emp.name,
                            hourly_rate: emp.hourly_cost_cents ? emp.hourly_cost_cents / 100 : hourForm.hourly_rate,
                          })}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            hourForm.employee_name === emp.name
                              ? 'bg-foundri-yellow text-black'
                              : 'bg-foundri-card text-zinc-300 hover:bg-foundri-hover'
                          }`}
                        >
                          {emp.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setHourForm({ ...hourForm, employee_name: '' })}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          hourForm.employee_name === ''
                            ? 'bg-foundri-yellow text-black'
                            : 'bg-foundri-card text-zinc-300 hover:bg-foundri-hover'
                        }`}
                      >
                        Overig
                      </button>
                    </div>
                  ) : (
                    <input
                      value={hourForm.employee_name}
                      onChange={e => setHourForm({ ...hourForm, employee_name: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                      placeholder="Naam medewerker"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Uren *</label>
                    <input
                      required
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="0.5"
                      value={hourForm.hours}
                      onChange={e => setHourForm({ ...hourForm, hours: parseFloat(e.target.value) || 0 })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-base font-semibold text-white focus:outline-none focus:ring-1 focus:ring-white/20 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Uurtarief (€)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min="0"
                      value={hourForm.hourly_rate}
                      onChange={e => setHourForm({ ...hourForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-base font-semibold text-white focus:outline-none focus:ring-1 focus:ring-white/20 text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Omschrijving</label>
                  <input
                    value={hourForm.description}
                    onChange={e => setHourForm({ ...hourForm, description: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="Grondwerk terras"
                  />
                </div>
                {/* Live total */}
                <div className="rounded-lg bg-foundri-card px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Totaal arbeid</span>
                  <span className="text-sm font-semibold text-white">
                    {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(
                      hourForm.hours * hourForm.hourly_rate
                    )}
                  </span>
                </div>
                <div className="flex gap-3 pb-safe">
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="flex-1 rounded-xl py-3.5 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={hourBusy}
                    className="flex-1 rounded-xl bg-foundri-yellow py-3.5 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {hourBusy ? 'Opslaan...' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            )}

            {/* Add material sheet */}
            {sheet === 'material' && (
              <form onSubmit={addMaterial} className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-white">Materiaal toevoegen</h2>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Omschrijving *</label>
                  <input
                    required
                    autoFocus
                    value={matForm.description}
                    onChange={e => setMatForm({ ...matForm, description: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="Tegels 60×60 antraciet"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Aantal *</label>
                    <input
                      required
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      value={matForm.quantity}
                      onChange={e => setMatForm({ ...matForm, quantity: parseFloat(e.target.value) || 1 })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-2 py-3 text-base font-semibold text-white focus:outline-none focus:ring-1 focus:ring-white/20 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Eenheid</label>
                    <select
                      value={matForm.unit}
                      onChange={e => setMatForm({ ...matForm, unit: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-2 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Prijs (€)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={matForm.unit_price}
                      onChange={e => setMatForm({ ...matForm, unit_price: parseFloat(e.target.value) || 0 })}
                      className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-2 py-3 text-base font-semibold text-white focus:outline-none focus:ring-1 focus:ring-white/20 text-center"
                    />
                  </div>
                </div>
                {/* Live total */}
                <div className="rounded-lg bg-foundri-card px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Totaal materiaal</span>
                  <span className="text-sm font-semibold text-white">
                    {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(
                      matForm.quantity * matForm.unit_price
                    )}
                  </span>
                </div>
                <div className="flex gap-3 pb-safe">
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="flex-1 rounded-xl py-3.5 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={matBusy}
                    className="flex-1 rounded-xl bg-foundri-yellow py-3.5 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {matBusy ? 'Opslaan...' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            )}

            {/* Sign sheet */}
            {sheet === 'sign' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <PenLine className="h-5 w-5 text-green-400" />
                  <h2 className="text-base font-semibold text-white">Werkbon aftekenen</h2>
                </div>
                <p className="text-sm text-zinc-400">
                  Laat de klant zijn naam invullen en hieronder tekenen ter bevestiging van de uitgevoerde werkzaamheden.
                </p>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Naam ondertekenaar *</label>
                  <input
                    autoFocus
                    value={signName}
                    onChange={e => setSignName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/8 bg-foundri-card px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="Volledige naam"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Handtekening</label>
                  <div className="mt-1.5">
                    <SignaturePad onChange={setSignatureData} disabled={signingBusy} />
                  </div>
                </div>
                <div className="flex gap-3 pb-safe">
                  <button
                    onClick={() => { setSheet(null); setSignatureData(null) }}
                    className="flex-1 rounded-xl py-3.5 text-sm font-medium text-zinc-300 bg-foundri-card hover:bg-foundri-hover transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    disabled={!signName.trim() || signingBusy}
                    onClick={async () => {
                      setSigningBusy(true)
                      await updateStatus('afgerond', {
                        signed_by: signName.trim(),
                        signature_data: signatureData,
                      })
                      setSignName('')
                      setSignatureData(null)
                      setSigningBusy(false)
                    }}
                    className="flex-1 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 transition-all"
                  >
                    {signingBusy ? 'Aftekenen...' : 'Bevestigen & afronden'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
