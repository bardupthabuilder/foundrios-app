'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Play, CheckCircle, FileText } from 'lucide-react'

type WOHour = { id: string; employee_name: string | null; hours: number; hourly_rate_cents: number; total_cents: number; description: string | null }
type WOMaterial = { id: string; description: string; quantity: number; unit: string; unit_price_cents: number; total_cents: number }
type WorkOrder = {
  id: string; work_order_number: string | null; title: string; description: string | null
  status: string; date: string; signed_by: string | null; signed_at: string | null; notes: string | null
  created_at: string; clients: any; projects: any; hours: WOHour[]; materials: WOMaterial[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  concept: { label: 'Concept', color: 'bg-zinc-100 text-zinc-700' },
  actief: { label: 'Actief', color: 'bg-blue-100 text-blue-700' },
  afgerond: { label: 'Afgerond', color: 'bg-green-100 text-green-700' },
  gefactureerd: { label: 'Gefactureerd', color: 'bg-emerald-100 text-emerald-700' },
}

export default function WerkbonDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [wo, setWo] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<{ id: string; name: string; hourly_cost_cents?: number }[]>([])
  const [showAddHour, setShowAddHour] = useState(false)
  const [showAddMat, setShowAddMat] = useState(false)
  const [showSign, setShowSign] = useState(false)
  const [signName, setSignName] = useState('')
  const [hourForm, setHourForm] = useState({ employee_name: '', hours: 8, hourly_rate: 45, description: '' })
  const [matForm, setMatForm] = useState({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })

  useEffect(() => {
    fetchWo()
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : []))
  }, [id])

  async function fetchWo() {
    const res = await fetch(`/api/work-orders/${id}`)
    if (res.ok) setWo(await res.json())
    setLoading(false)
  }

  async function updateStatus(status: string) {
    const body: any = { status }
    if (status === 'afgerond' && signName) body.signed_by = signName
    await fetch(`/api/work-orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowSign(false)
    fetchWo()
  }

  async function addHour(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/work-order-hours', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_order_id: id, employee_name: hourForm.employee_name, hours: hourForm.hours, hourly_rate_cents: Math.round(hourForm.hourly_rate * 100), description: hourForm.description || null, sort_order: (wo?.hours.length ?? 0) + 1 }),
    })
    setShowAddHour(false)
    setHourForm({ employee_name: '', hours: 8, hourly_rate: 45, description: '' })
    fetchWo()
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/work-order-materials', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_order_id: id, description: matForm.description, quantity: matForm.quantity, unit: matForm.unit, unit_price_cents: Math.round(matForm.unit_price * 100), sort_order: (wo?.materials.length ?? 0) + 1 }),
    })
    setShowAddMat(false)
    setMatForm({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })
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

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  const editable = wo?.status === 'concept' || wo?.status === 'actief'

  if (loading) return <div className="p-6 pt-16 lg:pt-6 text-sm text-zinc-400">Laden...</div>
  if (!wo) return <div className="p-6 pt-16 lg:pt-6 text-sm text-red-500">Werkbon niet gevonden</div>

  const sc = statusConfig[wo.status] || statusConfig.concept
  const totalHours = wo.hours.reduce((s, h) => s + Number(h.hours), 0)
  const totalHoursCents = wo.hours.reduce((s, h) => s + h.total_cents, 0)
  const totalMatCents = wo.materials.reduce((s, m) => s + m.total_cents, 0)
  const grandTotal = totalHoursCents + totalMatCents

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-4xl">
      <button onClick={() => router.push('/dashboard/werkbonnen')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
        <ArrowLeft className="h-4 w-4" /> Terug
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{wo.title}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{wo.work_order_number} · {wo.projects?.name} · {new Date(wo.date).toLocaleDateString('nl-NL')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wo.status === 'concept' && (
            <button onClick={() => updateStatus('actief')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Play className="h-4 w-4" /> Starten
            </button>
          )}
          {wo.status === 'actief' && (
            <button onClick={() => setShowSign(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
              <CheckCircle className="h-4 w-4" /> Afronden & tekenen
            </button>
          )}
          {wo.status === 'afgerond' && (
            <button onClick={() => updateStatus('gefactureerd')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <FileText className="h-4 w-4" /> Gefactureerd
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Uren</div>
          <div className="text-lg font-semibold">{totalHours}u</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Arbeid</div>
          <div className="text-lg font-semibold">{fmt(totalHoursCents)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Materiaal</div>
          <div className="text-lg font-semibold">{fmt(totalMatCents)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-zinc-500">Totaal</div>
          <div className="text-lg font-bold">{fmt(grandTotal)}</div>
        </div>
      </div>

      {/* Signed info */}
      {wo.signed_by && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
          Getekend door <strong>{wo.signed_by}</strong> op {wo.signed_at ? new Date(wo.signed_at).toLocaleDateString('nl-NL') : '—'}
        </div>
      )}

      {/* Uren */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Uren</h2>
          {editable && <button onClick={() => setShowAddHour(true)} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"><Plus className="h-3.5 w-3.5" /> Toevoegen</button>}
        </div>
        {wo.hours.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-400">Nog geen uren</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-zinc-500"><th className="pb-2 font-medium">Medewerker</th><th className="pb-2 font-medium">Omschrijving</th><th className="pb-2 font-medium text-right w-16">Uren</th><th className="pb-2 font-medium text-right w-20">Tarief</th><th className="pb-2 font-medium text-right w-20">Totaal</th>{editable && <th className="w-8"></th>}</tr></thead>
            <tbody>
              {wo.hours.map(h => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="py-2">{h.employee_name || '—'}</td>
                  <td className="py-2 text-zinc-500">{h.description || '—'}</td>
                  <td className="py-2 text-right">{Number(h.hours)}</td>
                  <td className="py-2 text-right">{fmt(h.hourly_rate_cents)}</td>
                  <td className="py-2 text-right font-medium">{fmt(h.total_cents)}</td>
                  {editable && <td className="py-2 text-right"><button onClick={() => deleteHour(h.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Materiaal */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Materiaal</h2>
          {editable && <button onClick={() => setShowAddMat(true)} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"><Plus className="h-3.5 w-3.5" /> Toevoegen</button>}
        </div>
        {wo.materials.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-400">Nog geen materiaal</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-zinc-500"><th className="pb-2 font-medium">Omschrijving</th><th className="pb-2 font-medium text-right w-16">Aantal</th><th className="pb-2 font-medium w-14">Eenheid</th><th className="pb-2 font-medium text-right w-20">Prijs</th><th className="pb-2 font-medium text-right w-20">Totaal</th>{editable && <th className="w-8"></th>}</tr></thead>
            <tbody>
              {wo.materials.map(m => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2">{m.description}</td>
                  <td className="py-2 text-right">{Number(m.quantity)}</td>
                  <td className="py-2">{m.unit}</td>
                  <td className="py-2 text-right">{fmt(m.unit_price_cents)}</td>
                  <td className="py-2 text-right font-medium">{fmt(m.total_cents)}</td>
                  {editable && <td className="py-2 text-right"><button onClick={() => deleteMaterial(m.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {wo.notes && <div className="rounded-lg border p-4"><h3 className="text-xs font-medium text-zinc-500 mb-1">Notities</h3><p className="text-sm text-zinc-700 whitespace-pre-wrap">{wo.notes}</p></div>}

      {/* Add Hour Dialog */}
      {showAddHour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddHour(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Uren toevoegen</h2>
            <form onSubmit={addHour} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Medewerker</label>
                <select value={hourForm.employee_name} onChange={e => {
                  const emp = employees.find(em => em.name === e.target.value)
                  setHourForm({ ...hourForm, employee_name: e.target.value, hourly_rate: emp?.hourly_cost_cents ? emp.hourly_cost_cents / 100 : hourForm.hourly_rate })
                }} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">Selecteer...</option>
                  {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600">Uren</label>
                  <input type="number" step="0.5" min="0.5" value={hourForm.hours} onChange={e => setHourForm({ ...hourForm, hours: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600">Uurtarief (€)</label>
                  <input type="number" step="0.01" min="0" value={hourForm.hourly_rate} onChange={e => setHourForm({ ...hourForm, hourly_rate: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Omschrijving</label>
                <input value={hourForm.description} onChange={e => setHourForm({ ...hourForm, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Grondwerk terras" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddHour(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Annuleren</button>
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Toevoegen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Material Dialog */}
      {showAddMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddMat(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Materiaal toevoegen</h2>
            <form onSubmit={addMaterial} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Omschrijving *</label>
                <input required value={matForm.description} onChange={e => setMatForm({ ...matForm, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tegels 60x60 antraciet" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600">Aantal</label>
                  <input type="number" step="0.01" min="0.01" value={matForm.quantity} onChange={e => setMatForm({ ...matForm, quantity: parseFloat(e.target.value) || 1 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600">Eenheid</label>
                  <select value={matForm.unit} onChange={e => setMatForm({ ...matForm, unit: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="stuk">Stuk</option><option value="m²">m²</option><option value="m³">m³</option><option value="m¹">m¹</option><option value="kg">kg</option><option value="zak">Zak</option><option value="pallet">Pallet</option><option value="post">Post</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600">Prijs (€)</label>
                  <input type="number" step="0.01" min="0" value={matForm.unit_price} onChange={e => setMatForm({ ...matForm, unit_price: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddMat(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Annuleren</button>
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Toevoegen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Dialog */}
      {showSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSign(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Werkbon aftekenen</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Naam klant / opdrachtgever</label>
                <input value={signName} onChange={e => setSignName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Naam" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowSign(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Annuleren</button>
                <button onClick={() => updateStatus('afgerond')} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Aftekenen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
