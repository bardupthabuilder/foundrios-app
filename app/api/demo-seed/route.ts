import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// POST /api/demo-seed — vul het account met realistische demo data
export async function POST() {
  const supabase = await createClient()

  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Check of er al data is
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Er is al data in dit account' }, { status: 409 })
  }

  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
  const today = daysAgo(0)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  // ── Leads ──────────────────────────────────────────────────────────────────
  const leads = [
    {
      name: 'Peter van Dijk', email: 'peter@vandijk.nl', phone: '0612345678',
      source: 'form', status: 'hot' as const, ai_score: 85, ai_label: 'hot',
      ai_summary: 'Wil complete tuinrenovatie, budget rond €12.000. Dringend — wil voor de zomer klaar.',
      urgency: 'high', intent: 'Tuinrenovatie compleet',
      _msg: 'Goedemiddag, wij willen onze achtertuin compleet laten renoveren. Denk aan nieuw terras, beplanting en verlichting. Budget ca. €12.000. Graag voor juni klaar.',
    },
    {
      name: 'Lisa de Groot', phone: '0687654321',
      source: 'whatsapp', status: 'warm' as const, ai_score: 62, ai_label: 'warm',
      ai_summary: 'Interesse in tuinonderhoud, nog geen concreet budget genoemd.',
      urgency: 'medium', intent: 'Structureel tuinonderhoud',
      _msg: 'Hoi, ik zoek iemand voor structureel tuinonderhoud. Hoe werkt dat bij jullie?',
    },
    {
      name: 'Mark Hendriks', email: 'mark.h@gmail.com',
      source: 'meta_lead_ads', status: 'new' as const, ai_score: 45, ai_label: 'warm',
      ai_summary: 'Via Meta Ads formulier, weinig details ingevuld.',
      urgency: 'low', intent: 'Informatie opvragen',
      _msg: 'Interesse in tuinaanleg',
    },
    {
      name: 'Sandra Bakker', phone: '0698765432',
      source: 'whatsapp', status: 'cold' as const, ai_score: 25, ai_label: 'cold',
      ai_summary: 'Alleen een prijsindicatie gevraagd, geen project beschreven.',
      urgency: 'low', intent: 'Prijsvraag',
      _msg: 'Wat kost een gemiddelde tuin aanleggen?',
    },
    {
      name: 'Familie Jansen', email: 'jansen.tuin@outlook.com', phone: '0611223344',
      source: 'form', status: 'won' as const, ai_score: 92, ai_label: 'hot',
      ai_summary: 'Complete achtertuin inclusief overkapping. Budget €18.000. Project gestart.',
      urgency: 'high', intent: 'Tuin + overkapping',
      _msg: 'We willen graag onze achtertuin compleet laten doen inclusief een overkapping. We hebben al een idee en budget van circa €18.000.',
    },
  ]

  for (const lead of leads) {
    const { _msg, ...leadData } = lead
    const { data: newLead } = await supabase
      .from('leads')
      .insert({ ...leadData, tenant_id: tenantId } as any)
      .select('id')
      .single()

    if (newLead && _msg) {
      await supabase.from('lead_messages').insert({
        lead_id: newLead.id,
        tenant_id: tenantId,
        direction: 'inbound',
        channel: leadData.source,
        content: _msg,
      })
    }
  }

  // ── Klanten ────────────────────────────────────────────────────────────────
  await supabase.from('clients').insert([
    { company_name: 'Familie Jansen', email: 'jansen.tuin@outlook.com', phone: '0611223344', address: 'Dorpsstraat 12', city: 'Amstelveen', status: 'actief', tenant_id: tenantId } as any,
    { company_name: 'Woningcorporatie De Waard', email: 'info@dewaard.nl', phone: '0201234567', address: 'Hoofdweg 45', city: 'Amsterdam', status: 'actief', tenant_id: tenantId } as any,
  ])

  // ── Medewerkers ────────────────────────────────────────────────────────────
  const empInserts = [
    { full_name: 'Kevin Smit', role: 'hovenier', email: 'kevin@demo.nl', phone: '0600000001', hourly_rate: 45, tenant_id: tenantId },
    { full_name: 'Tom de Vries', role: 'hovenier', email: 'tom@demo.nl', phone: '0600000002', hourly_rate: 42, tenant_id: tenantId },
    { full_name: 'Ravi Patel', role: 'leerling', email: 'ravi@demo.nl', phone: '0600000003', hourly_rate: 28, tenant_id: tenantId },
  ]

  const employeeIds: string[] = []
  for (const emp of empInserts) {
    const { data } = await supabase
      .from('employees')
      .insert(emp as any)
      .select('id')
      .single()
    if (data) employeeIds.push(data.id)
  }

  // ── Projecten ──────────────────────────────────────────────────────────────
  const projInserts = [
    { name: 'Tuinrenovatie Jansen', city: 'Amstelveen', status: 'actief' as const, budget: 18000, start_date: daysAgo(7), tenant_id: tenantId },
    { name: 'Groenonderhoud Q2 De Waard', city: 'Amsterdam', status: 'actief' as const, budget: 8500, start_date: daysAgo(14), tenant_id: tenantId },
    { name: 'Terras aanleg Van Dijk', city: 'Rotterdam', status: 'gepland' as const, budget: 12000, tenant_id: tenantId },
  ]

  const projectIds: string[] = []
  for (const proj of projInserts) {
    const { data } = await supabase
      .from('projects')
      .insert(proj as any)
      .select('id')
      .single()
    if (data) projectIds.push(data.id)
  }

  // ── Planning (vandaag + morgen) ────────────────────────────────────────────
  if (employeeIds.length > 0 && projectIds.length > 0) {
    await supabase.from('planning_entries').insert([
      { tenant_id: tenantId, employee_id: employeeIds[0], project_id: projectIds[0], planned_date: today, planned_hours: 8 },
      { tenant_id: tenantId, employee_id: employeeIds[1] || employeeIds[0], project_id: projectIds[1] || projectIds[0], planned_date: today, planned_hours: 8 },
      { tenant_id: tenantId, employee_id: employeeIds[0], project_id: projectIds[1] || projectIds[0], planned_date: tomorrow, planned_hours: 6 },
    ])
  }

  // ── Uren (afgelopen week) ──────────────────────────────────────────────────
  if (employeeIds.length > 0 && projectIds.length > 0) {
    await supabase.from('time_entries').insert([
      { tenant_id: tenantId, employee_id: employeeIds[0], project_id: projectIds[0], entry_date: daysAgo(1), hours: 8, description: 'Werkzaamheden op locatie' },
      { tenant_id: tenantId, employee_id: employeeIds[0], project_id: projectIds[0], entry_date: daysAgo(2), hours: 7.5, description: 'Voorbereiding + uitvoering' },
      { tenant_id: tenantId, employee_id: employeeIds[1] || employeeIds[0], project_id: projectIds[1] || projectIds[0], entry_date: daysAgo(1), hours: 8, description: 'Complete dag op locatie' },
    ])
  }

  return NextResponse.json({ success: true, message: 'Demo data geladen' })
}
