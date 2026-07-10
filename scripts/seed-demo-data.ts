/**
 * FoundriOS Demo Data Seeder
 *
 * Vult een tenant met fictieve hoveniers-data voor sales demo's.
 * Markeert alles met is_demo=true zodat het via de demo-toggle zichtbaar wordt.
 *
 * Idempotent: verwijdert eerst alle is_demo=true rows voor de tenant, daarna re-insert.
 *
 * Run:
 *   SEED_USER_EMAIL=info@bartgroeneveld.com npx tsx scripts/seed-demo-data.ts
 *
 * Of expliciet:
 *   SEED_TENANT_ID=<uuid> npx tsx scripts/seed-demo-data.ts
 *
 * Vereist env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function resolveTenantId(): Promise<string> {
  if (process.env.SEED_TENANT_ID) return process.env.SEED_TENANT_ID

  const email = process.env.SEED_USER_EMAIL
  if (!email) throw new Error('Set SEED_TENANT_ID or SEED_USER_EMAIL')

  const { data: users, error: userErr } = await sb.auth.admin.listUsers()
  if (userErr) throw userErr
  const user = users.users.find(u => u.email === email)
  if (!user) throw new Error(`User not found for email: ${email}`)

  const { data: tu, error: tuErr } = await sb
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()
  if (tuErr || !tu) throw new Error(`No tenant for user ${email}`)
  return tu.tenant_id as string
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)
const daysAgoIso = (n: number) => daysAgo(n).toISOString()
const daysAgoDate = (n: number) => daysAgo(n).toISOString().split('T')[0]

async function clearDemoData(tenantId: string) {
  const tables = ['notifications', 'revenue_snapshots', 'projects', 'clients', 'leads']
  for (const t of tables) {
    const { error } = await sb.from(t).delete().eq('tenant_id', tenantId).eq('is_demo', true)
    if (error) console.warn(`  warn clearing ${t}: ${error.message}`)
  }
}

async function seedLeads(tenantId: string) {
  const leads = [
    // 4 HOT
    { name: 'Peter van Dijk', email: 'peter@vandijk.nl', phone: '0612345678', source: 'form', status: 'hot', ai_score: 92, ai_label: 'hot', ai_summary: 'Tuinrenovatie €15K, urgent voor zomer.', urgency: 'high', intent: 'Complete tuinrenovatie', created_at: daysAgoIso(1) },
    { name: 'Linda de Vries', email: 'linda.devries@gmail.com', phone: '0698765432', source: 'meta_lead_ads', status: 'hot', ai_score: 88, ai_label: 'hot', ai_summary: 'Onderhoudscontract groot huis, jaarcontract €4K.', urgency: 'high', intent: 'Onderhoudscontract', created_at: daysAgoIso(2) },
    { name: 'Mark Janssen', email: 'mjanssen@hotmail.com', phone: '0623456789', source: 'whatsapp', status: 'hot', ai_score: 85, ai_label: 'hot', ai_summary: 'Bestrating + beplanting €8K, beslist deze maand.', urgency: 'high', intent: 'Aanleg', created_at: daysAgoIso(3) },
    { name: 'Sandra Bakker', email: 'sbakker@outlook.com', phone: '0634567890', source: 'form', status: 'hot', ai_score: 81, ai_label: 'hot', ai_summary: 'Veranda + tuinverlichting €11K, drie offertes opgevraagd.', urgency: 'medium', intent: 'Aanleg + verlichting', created_at: daysAgoIso(4) },
    // 4 WARM
    { name: 'Tom Hendriks', email: 'tom.h@gmail.com', phone: '0645678901', source: 'meta_lead_ads', status: 'warm', ai_score: 65, ai_label: 'warm', ai_summary: 'Vraag over vijver renovatie, budget onduidelijk.', urgency: 'medium', intent: 'Vijver', created_at: daysAgoIso(5) },
    { name: 'Anouk Smit', email: 'anouk@smitfamily.nl', phone: '0656789012', source: 'form', status: 'warm', ai_score: 60, ai_label: 'warm', ai_summary: 'Wil prijsindicatie kunstgras 80m².', urgency: 'low', intent: 'Kunstgras', created_at: daysAgoIso(7) },
    { name: 'Erik Mulder', email: 'erikmulder@kpnmail.nl', phone: '0667890123', source: 'whatsapp', status: 'warm', ai_score: 58, ai_label: 'warm', ai_summary: 'Snoeien grote tuin, nog niet beslist.', urgency: 'low', intent: 'Onderhoud', created_at: daysAgoIso(9) },
    { name: 'Jeroen Vermeer', email: 'j.vermeer@ziggo.nl', phone: '0678901234', source: 'form', status: 'warm', ai_score: 55, ai_label: 'warm', ai_summary: 'Vergelijkt drie hoveniers voor terras.', urgency: 'medium', intent: 'Terras', created_at: daysAgoIso(11) },
    // 4 COLD
    { name: 'Ellen Bos', email: 'ellen.bos@gmail.com', phone: '0689012345', source: 'meta_lead_ads', status: 'cold', ai_score: 32, ai_label: 'cold', ai_summary: 'Eerst inspiratie verzamelen, geen budget gedeeld.', urgency: 'low', intent: 'Oriëntatie', created_at: daysAgoIso(14) },
    { name: 'Hugo Peters', email: 'hpeters@xs4all.nl', phone: '0690123456', source: 'form', status: 'cold', ai_score: 28, ai_label: 'cold', ai_summary: 'Klein klusje, twijfelt of hovenier nodig is.', urgency: 'low', intent: 'Klein onderhoud', created_at: daysAgoIso(18) },
    { name: 'Marlies Kuijpers', email: 'm.kuijpers@gmail.com', phone: '0612340987', source: 'whatsapp', status: 'cold', ai_score: 25, ai_label: 'cold', ai_summary: 'Wil eerst zelf proberen, vraagt advies.', urgency: 'low', intent: 'Advies', created_at: daysAgoIso(22) },
    { name: 'Daan Visser', email: 'daanv@hotmail.com', phone: '0623450987', source: 'form', status: 'cold', ai_score: 22, ai_label: 'cold', ai_summary: 'Verzamelt prijzen voor over 6 maanden.', urgency: 'low', intent: 'Toekomstig project', created_at: daysAgoIso(28) },
  ]

  const rows = leads.map(l => ({ ...l, tenant_id: tenantId, is_demo: true }))
  const { error } = await sb.from('leads').insert(rows)
  if (error) throw error
  console.log(`  ✓ ${leads.length} leads`)
}

async function seedClients(tenantId: string) {
  const clients = [
    { name: 'Familie de Boer', contact_name: 'Hans de Boer', phone: '0612000001', email: 'hans@deboer.nl', address: 'Lindelaan 12', city: 'Utrecht', notes: 'Onderhoudscontract sinds 2025. Tevreden, mond-op-mond verwijzer.' },
    { name: 'Bedrijfspark Zuid', contact_name: 'Carolien Aalbers', phone: '0612000002', email: 'c.aalbers@bedrijfsparkzuid.nl', address: 'Industrieweg 45', city: 'Amersfoort', notes: 'Kantoorpand-tuin onderhoud, kwartaalfacturatie.' },
    { name: 'Familie Spaargaren', contact_name: 'Marja Spaargaren', phone: '0612000003', email: 'spaargaren@gmail.com', address: 'Beukenlaan 8', city: 'Bilthoven', notes: 'Renovatie afgerond mei 2026, nu in onderhoudscontract.' },
  ]

  const rows = clients.map(c => ({ ...c, tenant_id: tenantId, is_demo: true }))
  const { data, error } = await sb.from('clients').insert(rows).select('id, name')
  if (error) throw error
  console.log(`  ✓ ${clients.length} clients`)
  return data ?? []
}

async function seedProjects(tenantId: string, clients: { id: string; name: string }[]) {
  if (clients.length < 3) return
  const projects = [
    { client_id: clients[0].id, name: 'Onderhoudscontract jaarrond', description: 'Maandelijks snoei + bemesting + onkruidbeheer', status: 'actief', project_type: 'onderhoud', start_date: daysAgoDate(120), end_date: null, budget_cents: 480000, hourly_rate_cents: 6500, address: 'Lindelaan 12', city: 'Utrecht' },
    { client_id: clients[1].id, name: 'Kantoorpand groenrenovatie', description: 'Beplanting refresh + nieuwe haagstructuur', status: 'gepland', project_type: 'vakwerk', start_date: daysAgoDate(-14), end_date: daysAgoDate(-30), budget_cents: 1850000, hourly_rate_cents: 7500, address: 'Industrieweg 45', city: 'Amersfoort' },
    { client_id: clients[2].id, name: 'Tuinrenovatie achtertuin', description: 'Volledige aanleg incl. terras 35m² en beplanting', status: 'opgeleverd', project_type: 'vakwerk', start_date: daysAgoDate(60), end_date: daysAgoDate(15), budget_cents: 2240000, hourly_rate_cents: 7500, address: 'Beukenlaan 8', city: 'Bilthoven' },
  ]

  const rows = projects.map(p => ({ ...p, tenant_id: tenantId, is_demo: true }))
  const { error } = await sb.from('projects').insert(rows)
  if (error) throw error
  console.log(`  ✓ ${projects.length} projects`)
}

async function seedRevenueSnapshots(tenantId: string) {
  const rows = []
  for (let i = 30; i >= 0; i--) {
    const baseRevenue = 850000 + Math.floor(Math.sin(i / 4) * 120000) + i * 8000
    const leadBase = 5 + Math.floor(Math.sin(i / 3) * 2)
    rows.push({
      tenant_id: tenantId,
      is_demo: true,
      snapshot_date: daysAgoDate(i),
      revenue_cents: baseRevenue,
      outstanding_cents: 320000 + Math.floor(Math.cos(i / 5) * 80000),
      overdue_cents: i % 7 === 0 ? 45000 : 0,
      pipeline_cents: 4200000 + Math.floor(Math.sin(i / 2) * 600000),
      mrr_cents: 480000,
      lead_count: leadBase + Math.floor(Math.random() * 3),
      hot_lead_count: Math.max(1, Math.floor(leadBase / 2)),
      conversion_pct: 35 + Math.floor(Math.cos(i / 6) * 8),
      avg_deal_value_cents: 850000 + Math.floor(Math.sin(i / 5) * 100000),
    })
  }
  const { error } = await sb.from('revenue_snapshots').insert(rows)
  if (error) throw error
  console.log(`  ✓ ${rows.length} revenue_snapshots`)
}

async function seedNotifications(tenantId: string) {
  const rows = [
    { tenant_id: tenantId, is_demo: true, title: 'Nieuwe warme lead — Peter van Dijk', message: 'AI-score 92. Tuinrenovatie €15K. Reageer binnen 5 min.', type: 'urgent', link: '/dashboard/leads', is_read: false },
    { tenant_id: tenantId, is_demo: true, title: 'CPL onder target deze week', message: 'Meta Ads CPL: €38 (target €30). Check creatives.', type: 'warning', link: '/dashboard/campagnes', is_read: false },
  ]
  const { error } = await sb.from('notifications').insert(rows)
  if (error) throw error
  console.log(`  ✓ ${rows.length} notifications`)
}

async function main() {
  console.log('FoundriOS demo data seeder\n')
  const tenantId = await resolveTenantId()
  console.log(`Tenant: ${tenantId}\n`)

  console.log('Clearing existing demo data...')
  await clearDemoData(tenantId)

  console.log('Seeding...')
  await seedLeads(tenantId)
  const clients = await seedClients(tenantId)
  await seedProjects(tenantId, clients as { id: string; name: string }[])
  await seedRevenueSnapshots(tenantId)
  await seedNotifications(tenantId)

  console.log('\n✓ Demo data klaar. Schakel demo modus in via de sidebar.')
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err.message ?? err)
  process.exit(1)
})
